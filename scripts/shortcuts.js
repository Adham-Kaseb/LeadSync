import { Storage } from './core.js';

export const ShortcutsManager = {
    modules: ['dashboard', 'leads', 'almdrasa', 'messages', 'notes', 'links', 'calculator', 'reminders', 'calendar', 'articles'],
    
    config: {
        scheme: 'default', 
        customMap: {} 
    },

    defaultMap: {}, 
    altMap: {}, 

    init() {
        this.loadSettings();
        this.computeDefaultMaps();
        this.setupListeners();
        this.updateSidebarBadges();
    },

    loadSettings() {
        const saved = Storage.get('app_settings');
        if (saved && saved.shortcuts) {
            this.config.scheme = saved.shortcuts.scheme || 'default';
            this.config.customMap = saved.shortcuts.customMap || {};
            this.config.panicMode = saved.panicMode !== false; 
        }
    },

    saveSettings() {
        const settings = Storage.get('app_settings') || {};
        settings.shortcuts = {
            scheme: this.config.scheme,
            customMap: this.config.customMap
        };
        Storage.set('app_settings', settings);
        this.updateSidebarBadges();
    },

    computeDefaultMaps() {
        this.modules.forEach((mod, index) => {
            if (index < 9) {
                this.defaultMap[mod] = { key: (index + 1).toString(), alt: true, ctrl: false, shift: false };
            }
        });

        this.modules.forEach((mod, index) => {
            if (index < 9) {
                this.altMap[mod] = { key: (index + 1).toString(), alt: false, ctrl: true, shift: true };
            }
        });
    },

    setupListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    },

    handleKeyDown(e) {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if (document.activeElement.isContentEditable) return;

        let targetModule = null;

        if (this.config.scheme === 'default') {
            targetModule = this.findModuleByMap(this.defaultMap, e);
        } else if (this.config.scheme === 'alternative') {
            targetModule = this.findModuleByMap(this.altMap, e);
        } else if (this.config.scheme === 'custom') {
            targetModule = this.findModuleByMap(this.config.customMap, e);
        }

        if (targetModule) {
            e.preventDefault();
            window.location.hash = targetModule;
            
            const link = document.querySelector(`.nav-item[data-target="${targetModule}"]`);
            if(link) {
                link.classList.add('shortcut-active');
                setTimeout(() => link.classList.remove('shortcut-active'), 200);
            }
        }
    },

    findModuleByMap(map, e) {
        for (const [mod, rule] of Object.entries(map)) {
            if (e.key.toLowerCase() === rule.key.toLowerCase() &&
                !!e.altKey === !!rule.alt &&
                !!e.ctrlKey === !!rule.ctrl &&
                !!e.shiftKey === !!rule.shift) {
                return mod;
            }
        }
        return null;
    },

    validateShortcut(keyEvent) {
        if (keyEvent.key === 'Control' || keyEvent.key === 'Alt' || keyEvent.key === 'Shift') return { valid: false, message: 'Invalid key' };
        
        for (const [mod, rule] of Object.entries(this.config.customMap)) {
            if (rule.key.toLowerCase() === keyEvent.key.toLowerCase() &&
                !!rule.alt === !!keyEvent.alt &&
                !!rule.ctrl === !!keyEvent.ctrl &&
                !!rule.shift === !!keyEvent.shift) {
                return { valid: false, message: `Conflict with ${mod}` };
            }
        }
        return { valid: true };
    },

    registerCustomShortcut(module, keyEvent) {
        if (this.config.customMap[module]) delete this.config.customMap[module];
        
        this.config.customMap[module] = {
            key: keyEvent.key,
            alt: keyEvent.alt,
            ctrl: keyEvent.ctrl,
            shift: keyEvent.shift
        };
        this.saveSettings();
    },
    
    getShortcutString(module) {
        let rule = null;
        if (this.config.scheme === 'default') rule = this.defaultMap[module];
        else if (this.config.scheme === 'alternative') rule = this.altMap[module];
        else rule = this.config.customMap[module];

        if (!rule) return '';

        if (this.config.scheme === 'default') {
             const mod = 'Alt';
             return mod + '+' + rule.key.toUpperCase();
        }

        const parts = [];
        if (rule.ctrl) parts.push('Ctrl');
        if (rule.alt) parts.push('Alt');
        if (rule.shift) parts.push('Shift');
        parts.push(rule.key.toUpperCase());
        return parts.join('+');
    },

    updateSidebarBadges() {
        document.querySelectorAll('.shortcut-badge').forEach(el => el.remove());

        const getSymbol = (part) => {
            const symbols = {
                'Ctrl': 'Ctrl',
                'Alt': 'Alt',
                'Shift': 'Shift',
                'Command': '⌘'
            };
            return symbols[part] || part;
        };

        this.modules.forEach(mod => {
            const link = document.querySelector(`.nav-item[data-target="${mod}"]`);
            if (link) {
                const shortcutStr = this.getShortcutString(mod);
                if (shortcutStr) {
                    const badge = document.createElement('span');
                    badge.className = 'shortcut-badge';
                    
                    const parts = shortcutStr.split('+');
                    parts.forEach((part, i) => {
                        const key = document.createElement('kbd');
                        key.className = 'key-cap';
                        key.textContent = getSymbol(part);
                        badge.appendChild(key);
                        
                        if (i < parts.length - 1) {
                            const plus = document.createElement('span');
                            plus.className = 'key-plus';
                            plus.textContent = '+';
                            badge.appendChild(plus);
                        }
                    });

                    link.appendChild(badge);
                }
            }
        });
    }
};

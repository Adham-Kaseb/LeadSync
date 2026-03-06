const EventBus = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    },
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
};

const Notifications = {
    container: null,
    init() {
        if (document.getElementById('toast-container')) {
            this.container = document.getElementById('toast-container');
            return;
        }
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px; pointer-events: none;
        `;
        document.body.appendChild(this.container);
    },

    show(message, type = 'info') {
        if (!this.container) this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'fa-info-circle';
        let color = '#3498db';
        if (type === 'success') { color = '#2ecc71'; icon = 'fa-check-circle'; }
        if (type === 'error') { color = '#e74c3c'; icon = 'fa-exclamation-circle'; }
        if (type === 'warning') { color = '#f1c40f'; icon = 'fa-triangle-exclamation'; }

        toast.style.cssText = `
            background: rgba(20, 20, 20, 0.95);
            color: #fff;
            padding: 12px 20px;
            border-radius: 8px;
            border-left: 4px solid ${color};
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            font-size: 0.9rem;
            display: flex; align-items: center; gap: 10px;
            backdrop-filter: blur(10px);
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.3s;
            pointer-events: auto;
            min-width: 250px;
            opacity: 0;
        `;

        toast.innerHTML = `
            <i class="fa-solid ${icon}" style="color: ${color}; font-size: 1.1rem;"></i>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    warning(msg) { this.show(msg, 'warning'); },
    info(msg) { this.show(msg, 'info'); }
};

const Storage = {
    get: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error(`Storage Read Error [${key}]:`, e);
            return null;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            EventBus.emit(`storage:${key}`, value);
            EventBus.emit('storage:change', { key, value });
            return true;
        } catch (e) {
            console.error(`Storage Write Error [${key}]:`, e);
            Notifications.error('الذاكرة ممتلئة! حاول حذف بعض البيانات أو الصور.');
            return false;
        }
    },
    getList: (key) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error(`Error reading list ${key}:`, e);
            return [];
        }
    },
    saveList: (key, list) => {
        try {
            const stringified = JSON.stringify(list);
            localStorage.setItem(key, stringified);
            EventBus.emit(`storage:${key}`, list);
            EventBus.emit('storage:update', { key, list });
            EventBus.emit('storage:change', { key, value: list });
            return true;
        } catch (e) {
            console.error(`Error saving list ${key}:`, e);
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                Notifications.error('عذراً، الذاكرة ممتلئة. لا يمكن الحفظ.');
            } else {
                Notifications.error('فشل في حفظ البيانات');
            }
            return false;
        }
    }
};

const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    formatDate(isoString) {
        if (!isoString) return '';
        const d = new Date(isoString);
        return new Intl.DateTimeFormat('ar-EG', { 
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(d);
    },
    initCustomSelect(selectElement) {
        if (!selectElement || selectElement.closest('.custom-select-wrapper')) return;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger glass-input';
        
        const currentOption = selectElement.options[selectElement.selectedIndex];
        trigger.innerHTML = `<span>${currentOption ? currentOption.text : ''}</span><i class="fa-solid fa-chevron-down"></i>`;
        
        const optionsList = document.createElement('div');
        optionsList.className = 'custom-options';
        
        Array.from(selectElement.options).forEach((opt, idx) => {
            const customOpt = document.createElement('div');
            customOpt.className = 'custom-option';
            if (idx === selectElement.selectedIndex) customOpt.classList.add('selected');
            customOpt.innerHTML = opt.innerHTML;
            
            customOpt.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                selectElement.selectedIndex = idx;
                selectElement.value = opt.value;
                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                trigger.querySelector('span').innerHTML = opt.innerHTML;
                optionsList.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                customOpt.classList.add('selected');
                wrapper.classList.remove('open');
            };
            optionsList.appendChild(customOpt);
        });
        
        selectElement.style.display = 'none';
        selectElement.parentNode.insertBefore(wrapper, selectElement);
        wrapper.appendChild(selectElement); 
        wrapper.appendChild(trigger);
        wrapper.appendChild(optionsList);
        
        trigger.onclick = (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            document.querySelectorAll('.custom-select-wrapper.open').forEach(w => {
                if(w !== wrapper) w.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        };
        
        selectElement.addEventListener('sync', () => {
            const opt = selectElement.options[selectElement.selectedIndex];
            if(opt) trigger.querySelector('span').innerHTML = opt.innerHTML;
        });

        if(!window.customSelectGlobalClose) {
            window.customSelectGlobalClose = true;
            document.addEventListener('click', () => {
                document.querySelectorAll('.custom-select-wrapper.open').forEach(w => w.classList.remove('open'));
            });
        }
    }
};

window.LeadSync = window.LeadSync || {};
window.LeadSync.Core = {
    EventBus,
    Storage,
    Notifications,
    Utils
};
window.LeadSync.Modules = window.LeadSync.Modules || {};

export { EventBus, Storage, Notifications, Utils };

import { Storage, Utils, Notifications } from './core.js';
import { Security } from './lib/security.js';

/**
 * Vault Service
 * Manages encrypted storage and session state
 */
const VaultService = {
    sessionKey: null,
    storageKey: 'vault_passwords_v2',
    legacyKey: 'vault_passwords',

    async initialize(pin) {
        this.sessionKey = pin;
        
        // Handle migration if needed
        const legacyData = Storage.get(this.legacyKey);
        if (legacyData && Array.isArray(legacyData)) {
            await this.savePasswords(legacyData);
            localStorage.removeItem(this.legacyKey);
            Notifications.info('تم تشفير بياناتك القديمة بنجاح');
        }
    },

    async getPasswords() {
        if (!this.sessionKey) return [];
        const encrypted = Storage.get(this.storageKey);
        if (!encrypted) return [];
        
        try {
            const JSONData = await Security.decrypt(encrypted, this.sessionKey);
            return JSON.parse(JSONData);
        } catch (e) {
            this.lock();
            throw e;
        }
    },

    async savePasswords(passwords) {
        if (!this.sessionKey) return;
        const JSONData = JSON.stringify(passwords);
        const encrypted = await Security.encrypt(JSONData, this.sessionKey);
        Storage.set(this.storageKey, encrypted);
    },

    lock() {
        this.sessionKey = null;
        const container = document.querySelector('.passwords-container');
        if (container) {
            const event = new CustomEvent('vault-lock');
            container.dispatchEvent(event);
        }
    }
};

/**
 * Main Vault Entry Point
 */
export async function renderPasswords() {
    const container = document.createElement('div');
    container.className = 'passwords-container';
    
    // Ensure styles are loaded
    if (!document.getElementById('passwords-style')) {
        const link = document.createElement('link');
        link.id = 'passwords-style';
        link.rel = 'stylesheet';
        link.href = 'styles/modules/passwords.css';
        document.head.appendChild(link);
    }

    container.addEventListener('vault-lock', () => {
        renderAuth();
    });

    let authState = 'UNAUTHORIZED'; // UNAUTHORIZED -> STAGE_1 -> AUTHORIZED

    const renderAuth = () => {
        const isFirstSetup = !Storage.get(VaultService.storageKey) && !Storage.get(VaultService.legacyKey);
        container.classList.remove('authorized');
        container.innerHTML = `
            <div class="auth-wrapper">
                <div class="locker-door-left"></div>
                <div class="locker-door-right"></div>
                
                <div class="keypad-center" id="fingerprint-scan">
                    <svg class="scan-progress-svg">
                        <circle class="scan-progress-circle" cx="45" cy="45" r="42"></circle>
                    </svg>
                    <i class="fa-solid fa-fingerprint"></i>
                </div>

                <div class="auth-card">
                    <div class="auth-icon"><i class="fa-solid fa-shield-halved"></i></div>
                    <h2 id="auth-title">${isFirstSetup ? 'إعداد الخزنة الآمنة' : 'الخزنة المشفرة'}</h2>
                    <p id="auth-desc">${isFirstSetup ? 'اختر رمز PIN مكون من 6 أرقام (سيطلب منك على مرحلتين)' : 'يرجى إدخال رمز الوصول للمتابعة'}</p>
                    <div id="stage-indicator" style="display: flex; justify-content: center; gap: 8px; margin-bottom: 1rem;">
                        <span style="width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--vault-gold);"></span>
                        <span style="width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--vault-gold);"></span>
                    </div>
                    <input type="password" class="pass-input" id="vault-pass" placeholder="••••" maxlength="6">
                    <div id="auth-hints" style="margin-top: 1rem; font-size: 0.8rem; color: rgba(255,255,255,0.4); font-family: 'Cairo', sans-serif;">
                         نظام تشفير LeadSync Elite v2.5 (AES-GCM)
                    </div>
                </div>
            </div>
        `;

        const keypad = container.querySelector('#fingerprint-scan');
        const progressCircle = container.querySelector('.scan-progress-circle');
        const input = container.querySelector('#vault-pass');
        const title = container.querySelector('#auth-title');
        const desc = container.querySelector('#auth-desc');

        let scanTimer = null;
        let scanProgress = 0;
        const scanDuration = 1500;

        const startScan = () => {
            if (keypad.classList.contains('scanning')) return;
            keypad.classList.add('scanning');
            const startTime = Date.now();
            
            scanTimer = setInterval(() => {
                const elapsed = Date.now() - startTime;
                scanProgress = Math.min(elapsed / scanDuration, 1);
                const offset = 264 - (scanProgress * 264);
                progressCircle.style.strokeDashoffset = offset;

                if (scanProgress >= 1) {
                    clearInterval(scanTimer);
                    completeScan();
                }
            }, 50);
        };

        const stopScan = () => {
            keypad.classList.remove('scanning');
            clearInterval(scanTimer);
            scanProgress = 0;
            progressCircle.style.strokeDashoffset = 264;
        };

        const completeScan = () => {
            container.classList.add('scan-complete');
            Notifications.success('تم التحقق الحيوي');
            keypad.style.pointerEvents = 'none';
            input.focus();
            
            // Cleanup keyboard listeners
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };

        keypad.addEventListener('mousedown', startScan);
        keypad.addEventListener('mouseup', stopScan);
        keypad.addEventListener('mouseleave', stopScan);
        keypad.addEventListener('touchstart', (e) => { e.preventDefault(); startScan(); });
        keypad.addEventListener('touchend', stopScan);

        const handleKeyDown = (e) => {
            if (e.code === 'Space' && !e.repeat && !container.classList.contains('scan-complete')) {
                e.preventDefault();
                startScan();
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                stopScan();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        input.oninput = async (e) => {
            const val = e.target.value.toUpperCase();
            const isFirstSetup = !Storage.get(VaultService.storageKey) && !Storage.get(VaultService.legacyKey);

            if (authState === 'UNAUTHORIZED' && val.length === 3) {
                 authState = 'STAGE_1';
                 window._first_pin = val;
                 input.value = '';
                 title.innerText = isFirstSetup ? 'أكد الرمز السري' : 'الرمز الثاني';
                 desc.innerText = isFirstSetup ? 'يرجى إعادة إدخال الرمز للتأكيد' : 'أدخل الجزء الثاني من مفتاح التشفير';
                 container.querySelectorAll('#stage-indicator span')[0].style.background = 'var(--vault-gold)';
                 Notifications.info('بانتظار الرمز الثاني');
            } else if (authState === 'STAGE_1' && val.length === 3) {
                 const fullPin = window._first_pin + val;
                 authState = 'AUTHORIZED';
                 await authorize(fullPin);
            }
        };

        const authorize = async (pin) => {
            try {
                await VaultService.initialize(pin);
                container.classList.add('authorized');
                Notifications.success('تم فك التشفير بنجاح');
                setTimeout(() => renderVault(), 800);
            } catch (e) {
                Notifications.error('خطأ في الوصول');
                authState = 'UNAUTHORIZED';
                input.value = '';
            }
        };
    };

    const renderVault = async () => {
        let passwords = await VaultService.getPasswords();
        
        container.innerHTML = `
            <div class="vault-content">
                <div class="vault-header">
                    <div>
                        <h2 style="color: var(--vault-gold); font-family: 'Orbitron', sans-serif;">THE VAULT <span style="font-size: 0.6rem; opacity: 0.5; vertical-align: middle; margin-left: 10px;">ENCRYPTED</span></h2>
                        <p style="color: rgba(255,255,255,0.5);">إدارة آمنة لكلمات المرور</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-secondary" id="lock-vault-btn" title="قفل الخزنة">
                            <i class="fa-solid fa-lock"></i>
                        </button>
                        <button class="btn btn-primary" id="add-pass-btn">
                            <i class="fa-solid fa-plus"></i> إضافة
                        </button>
                    </div>
                </div>

                <div class="search-wrapper" style="margin-bottom: 2rem;">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" class="glass-input" id="vault-search" placeholder="ابحث في الخزنة المشفرة...">
                </div>

                <div class="password-list" id="pass-list-container"></div>
            </div>

            <div class="vault-modal-overlay" id="modal-overlay"></div>
            <div class="vault-modal" id="pass-modal">
                <h3 id="modal-title" style="color: var(--vault-gold); margin-bottom: 1.5rem;">إضافة كلمة مرور</h3>
                <input type="hidden" id="edit-id">
                
                <div class="vault-modal-grid">
                    <div class="vault-form-group" style="grid-column: span 2;">
                        <input type="text" class="glass-input elite-glow-input" id="input-name" placeholder="اسم الموقع / الخدمة">
                    </div>
                    <div class="vault-form-group">
                        <input type="text" class="glass-input" id="input-site" placeholder="رابط الموقع" style="direction: ltr; text-align: left;">
                    </div>
                    <div class="vault-form-group">
                        <input type="email" class="glass-input" id="input-email" placeholder="البريد الإلكتروني" style="direction: ltr; text-align: left;">
                    </div>
                    <div class="vault-form-group">
                        <input type="text" class="glass-input" id="input-user" placeholder="اسم المستخدم">
                    </div>
                    <div class="vault-form-group">
                        <div style="position: relative;">
                            <input type="password" class="glass-input" id="input-pass" placeholder="كلمة المرور" style="width: 100%; direction: ltr; text-align: left;">
                            <button type="button" id="toggle-input-pass" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: rgba(255,255,255,0.3);">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 1rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" id="cancel-pass-btn">إلغاء</button>
                    <button class="btn btn-primary" id="save-pass-btn">حفظ مشفر</button>
                </div>
            </div>
        `;

        const listContainer = container.querySelector('#pass-list-container');
        const modal = container.querySelector('#pass-modal');
        const overlay = container.querySelector('#modal-overlay');

        const renderListResult = (filter = '') => {
            const filtered = passwords.filter(p => 
                (p.name && p.name.toLowerCase().includes(filter.toLowerCase())) ||
                (p.site && p.site.toLowerCase().includes(filter.toLowerCase())) ||
                (p.username && p.username.toLowerCase().includes(filter.toLowerCase()))
            );

            if (filtered.length === 0) {
                listContainer.innerHTML = '<p style="text-align:center; padding: 3rem; color: rgba(255,255,255,0.2);">الخزنة فارغة...</p>';
                return;
            }

            listContainer.innerHTML = filtered.map(p => `
                <div class="password-item gaming-card" data-id="${p.id}" style="cursor: pointer;">
                    <div class="item-info" style="direction: ltr; text-align: left;">
                        <div class="card-accent-tag">
                            <i class="fa-solid fa-shield-halved" style="color: var(--vault-gold);"></i>
                            <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem; opacity: 0.5;"></i>
                        </div>
                        <h4 style="color: var(--vault-gold); margin: 0 0 5px 0;">${p.name || p.site}</h4>
                        <p class="vault-username" style="color: #fff; margin: 0;">${p.username || '-'}</p>
                        <p class="vault-email" style="color: rgba(255,255,255,0.4); margin: 0; font-size: 0.8rem;">${p.email || '-'}</p>
                    </div>
                    <div class="password-reveal-box">
                        <span class="hidden-pass" data-pass="${p.password}">••••••••</span>
                        <button class="action-btn toggle-visibility"><i class="fa-solid fa-eye"></i></button>
                        <button class="action-btn copy-btn"><i class="fa-solid fa-key"></i></button>
                        <button class="action-btn edit-pass-btn"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-btn delete-pass-btn"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `).join('');

            // Interaction listeners
            listContainer.querySelectorAll('.password-item').forEach(item => {
                item.onclick = (e) => {
                    if (e.target.closest('.password-reveal-box') || e.target.closest('.action-btn')) return;
                    const p = passwords.find(x => x.id == item.dataset.id);
                    if (p && p.site) {
                        const url = p.site.startsWith('http') ? p.site : `https://${p.site}`;
                        window.open(url, '_blank');
                    }
                };
            });

            listContainer.querySelectorAll('.toggle-visibility').forEach(btn => {
                btn.onclick = () => {
                    const span = btn.parentElement.querySelector('.hidden-pass');
                    const isHidden = span.innerText === '••••••••';
                    span.innerText = isHidden ? span.dataset.pass : '••••••••';
                    btn.querySelector('i').className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
                };
            });

            listContainer.querySelectorAll('.copy-btn').forEach(btn => {
                btn.onclick = () => {
                    const pass = btn.parentElement.querySelector('.hidden-pass').dataset.pass;
                    navigator.clipboard.writeText(pass);
                    Notifications.success('تم نسخ كلمة المرور');
                };
            });

            listContainer.querySelectorAll('.edit-pass-btn').forEach(btn => {
                btn.onclick = () => {
                    const p = passwords.find(x => x.id == btn.closest('.password-item').dataset.id);
                    if (p) showModal(p);
                };
            });

            listContainer.querySelectorAll('.delete-pass-btn').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm('هل أنت متأكد من حذف هذه البيانات؟')) {
                        const id = btn.closest('.password-item').dataset.id;
                        passwords = passwords.filter(x => x.id != id);
                        await VaultService.savePasswords(passwords);
                        renderListResult(container.querySelector('#vault-search').value);
                    }
                };
            });
        };

        const showModal = (data = null) => {
            const title = modal.querySelector('#modal-title');
            const editId = modal.querySelector('#edit-id');
            const inputs = {
                name: modal.querySelector('#input-name'),
                site: modal.querySelector('#input-site'),
                email: modal.querySelector('#input-email'),
                user: modal.querySelector('#input-user'),
                pass: modal.querySelector('#input-pass')
            };

            if (data) {
                title.innerText = 'تعديل البيانات';
                editId.value = data.id;
                Object.keys(inputs).forEach(k => inputs[k].value = data[k === 'user' ? 'username' : (k === 'pass' ? 'password' : k)] || '');
            } else {
                title.innerText = 'إضافة بيانات جديدة';
                editId.value = '';
                Object.values(inputs).forEach(i => i.value = '');
            }

            modal.classList.add('active');
            overlay.classList.add('active');
        };

        const hideModal = () => {
            modal.classList.remove('active');
            overlay.classList.remove('active');
        };

        container.querySelector('#vault-search').oninput = (e) => renderListResult(e.target.value);
        container.querySelector('#add-pass-btn').onclick = () => showModal();
        container.querySelector('#cancel-pass-btn').onclick = hideModal;
        container.querySelector('#lock-vault-btn').onclick = () => VaultService.lock();
        overlay.onclick = hideModal;

        container.querySelector('#toggle-input-pass').onclick = () => {
            const input = modal.querySelector('#input-pass');
            const icon = container.querySelector('#toggle-input-pass i');
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            icon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        };

        container.querySelector('#save-pass-btn').onclick = async () => {
            const id = modal.querySelector('#edit-id').value;
            const newData = {
                id: id || Date.now(),
                name: modal.querySelector('#input-name').value,
                site: modal.querySelector('#input-site').value,
                email: modal.querySelector('#input-email').value,
                username: modal.querySelector('#input-user').value,
                password: modal.querySelector('#input-pass').value
            };

            if (!newData.name || !newData.password) {
                Notifications.error('الاسم وكلمة المرور مطلوبان');
                return;
            }

            if (id) {
                const idx = passwords.findIndex(x => x.id == id);
                passwords[idx] = newData;
            } else {
                passwords.push(newData);
            }

            await VaultService.savePasswords(passwords);
            renderListResult(container.querySelector('#vault-search').value);
            hideModal();
            Notifications.success('تم التشفير والحفظ');
        };

        renderListResult();
    };

    renderAuth();
    return container;
}

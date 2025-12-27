import { Storage, Utils } from './core.js';
import { ShortcutsManager } from './shortcuts.js';
import { showHealthPopup, getHealthContent, saveHealthContent } from './health.js';

const createToggleHTML = (id, label) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
        <span style="display: flex; align-items: center; gap: 12px; font-weight: 500; color: #fff;">
            ${label}
        </span>
        <label class="switch">
            <input type="checkbox" id="toggle-${id}">
            <span class="slider"></span>
        </label>
    </div>
`;

export function renderSettings() {
    const defaults = { 
        volume: 0.5, 
        cursor: false, 
        lightning: false,
        trail: false,
        ripple: false,
        magnetic: false,
        glow: false,
        fontSize: 100,
        leads: true,
        almdrasa: true,
        messages: true,
        notes: true,
        links: true,
        calculator: true,
        reminders: true,
        calendar: true,
        articles: true,
        themeColor: '#FFD700',
        glassBlur: 20,
        borderRadius: 16
    };
    
    let loadedSettings = Storage.get('app_settings') || {};

    const settings = { ...defaults, ...loadedSettings };
    Storage.set('app_settings', settings);

    const container = document.createElement('div');
    
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `<h1 class="section-title">الإعدادات</h1>`;
    container.appendChild(header);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    grid.style.gap = '2rem';

    const modulesPanel = document.createElement('div');
    modulesPanel.className = 'glass-panel';
    modulesPanel.style.padding = '1.5rem';
    modulesPanel.style.borderRadius = '16px';
    modulesPanel.innerHTML = `
        <h3 style="margin-bottom: 1rem;">إدارة القائمة الجانبية</h3>
        <p style="color:var(--text-secondary); font-size:0.9rem; margin-bottom:1.5rem;">اختر الأقسام التي تود عرضها في القائمة الجانبية.</p>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${createToggleHTML('leads', 'العملاء')}
            ${createToggleHTML('almdrasa', 'المدرسة')}
            ${createToggleHTML('messages', 'الرسائل')}
            ${createToggleHTML('notes', 'الملاحظات')}
            ${createToggleHTML('links', 'الروابط')}
            ${createToggleHTML('calculator', 'الخصومات')}
            ${createToggleHTML('reminders', 'التذكيرات')}
            ${createToggleHTML('calendar', 'التقويم')}
            ${createToggleHTML('articles', 'المقالات')}
        </div>

        <div style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem;">
             <h4 style="margin-bottom: 0.8rem; display:flex; align-items:center; gap:8px;"><i class="fa-solid fa-heart-pulse"></i> صحتك يا حجوج</h4>
             <p style="color:var(--text-secondary); font-size:0.85rem; margin-bottom:1rem;"> نظام التنبيه الصحي الذكي يذكرك بأخذ استراحة كل 60 دقيقة عشان متتنيلش تشتكي من رقبتك بعد كدا.</p>
             <div style="display: flex; gap: 10px;">
                <button id="preview-health-btn" class="btn btn-secondary btn-sm" style="flex: 1;"><i class="fa-solid fa-eye"></i> معاينة</button>
                <button id="edit-health-btn" class="btn btn-secondary btn-sm" style="flex: 1;"><i class="fa-solid fa-pen"></i> المحتوى</button>
             </div>
        </div>
    `;
    grid.appendChild(modulesPanel);

    modulesPanel.querySelector('#preview-health-btn').onclick = () => showHealthPopup();
    modulesPanel.querySelector('#edit-health-btn').onclick = () => openHealthEditor();

    function openHealthEditor() {
        const content = getHealthContent();
        
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay glass-panel';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '3500';
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

        const modal = document.createElement('div');
        modal.className = 'glass-panel';
        modal.style.width = '600px';
        modal.style.padding = '2rem';
        modal.style.borderRadius = '16px';
        modal.style.background = '#151515';
        modal.style.maxHeight = '90vh';
        modal.style.overflowY = 'auto';

        modal.innerHTML = `
            <h2 style="margin-bottom: 1.5rem;">تعديل محتوى التنبيه الصحي</h2>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="display:block; color:var(--text-secondary); margin-bottom:0.5rem;">العنوان الرئيسي</label>
                    <input type="text" id="h-title" value="${content.title}" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">
                </div>
                <div>
                    <label style="display:block; color:var(--text-secondary); margin-bottom:0.5rem;">الرسالة التشجيعية (Cheery Word)</label>
                    <textarea id="h-cheery" rows="3" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">${content.cheeryWord}</textarea>
                </div>
                <div>
                    <label style="display:block; color:var(--text-secondary); margin-bottom:0.5rem;">النصائح الطبية (Painkilling Advice)</label>
                    <textarea id="h-advice" rows="4" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">${content.advice}</textarea>
                </div>
                <div>
                    <label style="display:block; color:var(--text-secondary); margin-bottom:0.5rem;">التمارين (كل تمرين في سطر جديد)</label>
                    <textarea id="h-exercises" rows="6" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">${content.exercises.join('\n')}</textarea>
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
                    <button id="cancel-health" class="btn btn-secondary">إلغاء</button>
                    <button id="save-health" class="btn btn-primary">حفظ التغييرات</button>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.querySelector('#cancel-health').onclick = () => overlay.remove();
        overlay.querySelector('#save-health').onclick = () => {
             const newContent = {
                 title: modal.querySelector('#h-title').value,
                 cheeryWord: modal.querySelector('#h-cheery').value,
                 advice: modal.querySelector('#h-advice').value,
                 exercises: modal.querySelector('#h-exercises').value.split('\n').filter(l => l.trim() !== '')
             };
             saveHealthContent(newContent);
             overlay.remove();
             alert('تم حفظ الإعدادات بنجاح!');
        };
    }

    const combinedPanel = document.createElement('div');
    combinedPanel.className = 'glass-panel';
    combinedPanel.style.padding = '1.5rem';
    combinedPanel.style.borderRadius = '16px';
    combinedPanel.innerHTML = `
        <h3 style="margin-bottom: 1.5rem;">التخصيص والاختصارات</h3>
        
        <div style="margin-bottom: 2rem;">
            <label style="display:block; margin-bottom:0.8rem; color:var(--text-secondary);">الوان النظام (Theme Color)</label>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div class="theme-circle" data-color="#FFD700" style="background:#FFD700; width:35px; height:35px; border-radius:50%; cursor:pointer; border:2px solid transparent; box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);"></div>
                <div class="theme-circle" data-color="#00d2ff" style="background:#00d2ff; width:35px; height:35px; border-radius:50%; cursor:pointer; border:2px solid transparent; box-shadow: 0 0 10px rgba(0, 210, 255, 0.3);"></div>
                <div class="theme-circle" data-color="#ff2d55" style="background:#ff2d55; width:35px; height:35px; border-radius:50%; cursor:pointer; border:2px solid transparent; box-shadow: 0 0 10px rgba(255, 45, 85, 0.3);"></div>
                <div class="theme-circle" data-color="#50ff7f" style="background:#50ff7f; width:35px; height:35px; border-radius:50%; cursor:pointer; border:2px solid transparent; box-shadow: 0 0 10px rgba(80, 255, 127, 0.3);"></div>
                <div class="theme-circle" data-color="#e67e22" style="background:#e67e22; width:35px; height:35px; border-radius:50%; cursor:pointer; border:2px solid transparent; box-shadow: 0 0 10px rgba(230, 126, 34, 0.3);"></div>
            </div>
        </div>

        <div style="margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <label style="color:var(--text-secondary);">حجم الخط</label>
                <span id="font-val" style="color:var(--metallic-gold); font-weight:bold;">100%</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button id="font-dec" class="btn btn-secondary" style="padding: 5px 12px;">A-</button>
                <div style="flex-grow: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;"></div>
                <button id="font-inc" class="btn btn-secondary" style="padding: 5px 12px;">A+</button>
            </div>
        </div>

        <div>
            <h4 style="margin-bottom: 1rem; color: #fff;">اختصارات لوحة المفاتيح</h4>
            <div style="margin-bottom: 1rem;">
                <label style="display:block; margin-bottom:0.8rem; color:var(--text-secondary);">نظام الاختصارات</label>
                <div class="custom-select-wrapper" id="scheme-dropdown">
                    <div class="custom-select-trigger">
                        <span id="scheme-label">اختر النظام</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </div>
                    <div class="custom-options">
                        <div class="custom-option" data-value="default">الافتراضي (Alt + أرقام)</div>
                        <div class="custom-option" data-value="alternative">البديل (Ctrl + Shift + أرقام)</div>
                        <div class="custom-option" data-value="custom">مخصص</div>
                    </div>
                </div>
            </div>
            <div id="custom-shortcuts-area" style="display: none; margin-top: 1rem;">
                <h4 style="margin-bottom: 0.5rem; color: var(--metallic-gold);">تخصيص الاختصارات</h4>
                <div id="shortcuts-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
            </div>
        </div>
    `;
    grid.appendChild(combinedPanel);

    const themeCircles = combinedPanel.querySelectorAll('.theme-circle');
    
    const hexToRgb = (hex) => {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 215, 0';
    };

    themeCircles.forEach(circle => {
        circle.onclick = () => {
             const color = circle.getAttribute('data-color');
             document.documentElement.style.setProperty('--metallic-gold', color);
             document.documentElement.style.setProperty('--gold-rgb', hexToRgb(color));
             
             settings.themeColor = color;
             Storage.set('app_settings', settings);
             
             themeCircles.forEach(c => c.style.border = '2px solid transparent');
             circle.style.border = '2px solid #fff';
        };
        if(settings.themeColor === circle.getAttribute('data-color')) {
             circle.style.border = '2px solid #fff';
        }
    });

    const shortcutsListContainer = combinedPanel.querySelector('#custom-shortcuts-area');
    const shortcutsList = combinedPanel.querySelector('#shortcuts-list');

    function initDropdown(wrapperId, initialValue, onChange) {
        const wrapper = combinedPanel.querySelector(`#${wrapperId}`);
        const trigger = wrapper.querySelector('.custom-select-trigger');
        const triggerLabel = wrapper.querySelector('span');
        const options = wrapper.querySelectorAll('.custom-option');
        
        const initialOption = Array.from(options).find(opt => opt.dataset.value === initialValue);
        if (initialOption) {
            triggerLabel.textContent = initialOption.textContent;
            initialOption.classList.add('selected');
        }

        trigger.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select-wrapper.open').forEach(el => {
                if(el !== wrapper) el.classList.remove('open');
            });
            wrapper.classList.toggle('open');
        };

        options.forEach(option => {
            option.onclick = (e) => {
                e.stopPropagation();
                wrapper.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                triggerLabel.textContent = option.textContent;
                wrapper.classList.remove('open');
                
                if (onChange) onChange(option.dataset.value);
            };
        });
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-select-wrapper.open').forEach(el => el.classList.remove('open'));
    });




    initDropdown('scheme-dropdown', ShortcutsManager.config.scheme, (val) => {
        ShortcutsManager.config.scheme = val;
        ShortcutsManager.saveSettings();
        
        shortcutsListContainer.style.display = val === 'custom' ? 'block' : 'none';
        
        if (val === 'custom') {
            renderCustomShortcuts();
        }
    });

    function renderCustomShortcuts() {
        shortcutsList.innerHTML = '';
        ShortcutsManager.modules.forEach(mod => {
            const rule = ShortcutsManager.config.customMap[mod] || {};
            const shortcutStr = rule.key ? ShortcutsManager.getShortcutString(mod) : 'غير معين';
            
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;';
            row.innerHTML = `
                <span>${getArabicModuleName(mod)}</span>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="code-badge" style="background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 4px; font-family: monospace;">${shortcutStr}</span>
                    <button class="btn btn-secondary btn-sm record-btn" data-mod="${mod}" style="padding: 4px 10px; font-size: 0.8rem;">تسجيل</button>
                </div>
            `;
            shortcutsList.appendChild(row);

            const btn = row.querySelector('.record-btn');
            btn.onclick = () => {
                btn.textContent = 'اضغط المفاتيح...';
                btn.classList.add('btn-primary');
                
                const handler = (e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    
                    if (['Control', 'Shift', 'Alt'].includes(e.key)) return; 

                    const keyEvent = {
                        key: e.key,
                        alt: e.altKey,
                        ctrl: e.ctrlKey,
                        shift: e.shiftKey
                    };

                    const validation = ShortcutsManager.validateShortcut(keyEvent);
                    if (!validation.valid) {
                        alert(`خطأ: ${validation.message}`);
                    } else {
                        ShortcutsManager.registerCustomShortcut(mod, keyEvent);
                        renderCustomShortcuts(); 
                    }
                    
                    document.removeEventListener('keydown', handler, true); 
                };

                document.addEventListener('keydown', handler, true); 
            };
        });
    }

    function getArabicModuleName(mod) {
        const names = {
            'dashboard': 'الـ HQ',
            'leads': 'العملاء',
            'almdrasa': 'المدرسة',
            'messages': 'الرسائل',
            'notes': 'الملاحظات',
            'links': 'الروابط',
            'calculator': 'الخصومات',
            'reminders': 'التذكيرات',
            'calendar': 'التقويم'
        };
        return names[mod] || mod;
    }

    if (ShortcutsManager.config.scheme === 'custom') renderCustomShortcuts();

    const modules = ['leads', 'almdrasa', 'messages', 'notes', 'links', 'calculator', 'reminders', 'calendar', 'articles'];
    const modTargets = {
        'leads': 'leads',
        'almdrasa': 'almdrasa',
        'messages': 'messages',
        'notes': 'notes',
        'links': 'links',
        'calculator': 'calculator',
        'reminders': 'reminders',
        'calendar': 'calendar',
        'articles': 'articles'
    };

    modules.forEach(mod => {
        const toggle = modulesPanel.querySelector(`#toggle-${mod}`);
        if(toggle) {
            toggle.checked = settings[mod] !== false; 

            toggle.onchange = (e) => {
                const isChecked = e.target.checked;
                settings[mod] = isChecked;
                Storage.set('app_settings', settings);
                
                const targetId = modTargets[mod];
                const navLink = document.querySelector(`a[data-target="${targetId}"]`);
                if (navLink && navLink.parentNode) {
                    navLink.parentNode.style.display = isChecked ? 'block' : 'none';
                    
                    if (isChecked) {
                        navLink.parentNode.style.animation = 'fadeInUp 0.3s ease forwards';
                    }
                }
            };
        }
    });

    const fontVal = combinedPanel.querySelector('#font-val');
    if(!settings.fontSize || isNaN(settings.fontSize)) settings.fontSize = 100;
    fontVal.textContent = settings.fontSize + '%';
    
    const updateFont = (val) => {
        settings.fontSize = val;
        fontVal.textContent = val + '%';
        Storage.set('app_settings', settings);
        document.documentElement.style.fontSize = (16 * (val / 100)) + 'px'; 
    };

    combinedPanel.querySelector('#font-dec').onclick = () => {
        if(settings.fontSize > 70) updateFont(settings.fontSize - 10);
    };
    combinedPanel.querySelector('#font-inc').onclick = () => {
        if(settings.fontSize < 150) updateFont(settings.fontSize + 10);
    };

    const bindToggle = (id, key, windowProp) => {
        const t = themePanel.querySelector(`#${id}`);
        if (t) {
            t.checked = settings[key] === true; 
            
            t.onchange = (e) => {
                settings[key] = e.target.checked;
                Storage.set('app_settings', settings);
                if (windowProp) window[windowProp] = e.target.checked;
                
                if (key === 'cursor' && window.updateCursorState) window.updateCursorState(e.target.checked);
            };
        }
    }


    const dataPanel = document.createElement('div');
    dataPanel.className = 'glass-panel';
    dataPanel.style.padding = '1.5rem';
    dataPanel.style.borderRadius = '16px';
    
    let totalBytes = 0;
    for(let key in localStorage) {
        if(localStorage.hasOwnProperty(key)) {
            totalBytes += (localStorage[key].length + key.length) * 2;
        }
    }
    const usageKB = (totalBytes / 1024).toFixed(2);
    const usagePercent = Math.min((totalBytes / (5 * 1024 * 1024)) * 100, 100);

    dataPanel.innerHTML = `
        <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-database"></i> إدارة البيانات</h3>
        
        <div style="background: rgba(255, 215, 0, 0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center; border: 1px solid rgba(255, 215, 0, 0.2);">
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">مدة الجلسة الحالية</div>
            <div id="session-timer-display" style="font-size: 2rem; font-weight: bold; color: var(--metallic-gold); font-family: monospace;">00:00:00</div>
        </div>

        <div style="margin-bottom: 1rem;">
            <p style="margin-bottom: 0.5rem;">استخدام التخزين: <span class="gold-text">${usageKB} KB</span></p>
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px;">
                <div style="width: ${usagePercent}%; height: 100%; background: var(--metallic-gold); border-radius: 3px;"></div>
            </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 0.8rem;">
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem; text-align: center;">
                للمزامنة بين الأجهزة (مثلاً من الهاتف للحاسوب)، قم بـ <b>تصدير</b> البيانات من الجهاز الأول ثم <b>استيرادها</b> في الجهاز الثاني.
            </p>
            <button id="export-data" class="btn btn-glass"><i class="fa-solid fa-download"></i> تصدير البيانات (Backup)</button>
            <button id="import-data-btn" class="btn btn-glass"><i class="fa-solid fa-upload"></i> استيراد البيانات (Restore)</button>
             <button id="cloud-sync-btn" class="btn btn-glass" style="border-color: var(--metallic-gold); color: var(--metallic-gold);"><i class="fa-solid fa-cloud"></i> مزامنة سحابية (Cloud Sync - قريباً)</button>
            <input type="file" id="import-file" style="display: none;" accept=".json">
            <button id="reset-data" class="btn" style="background: rgba(255, 77, 77, 0.2); color: #ff4d4d; border: 1px solid #ff4d4d;"><i class="fa-solid fa-triangle-exclamation"></i> إعادة تعيين جميع البيانات</button>
        </div>
    `;
    grid.appendChild(dataPanel);

    const timerDisplay = dataPanel.querySelector('#session-timer-display');
    const updateTimer = () => {
        if (!document.body.contains(timerDisplay)) return; 
        const now = Date.now();
        const diff = now - (window.sessionStartTime || now);
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        timerDisplay.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        requestAnimationFrame(updateTimer);
    };
    requestAnimationFrame(updateTimer);

    dataPanel.querySelector('#export-data').onclick = () => {
        const data = {};
        const keys = ['messages_data', 'notes_data', 'links_data', 'reminders_data', 'calc_history', 'calendar_events', 'canvas_elements', 'leads_data', 'message_categories', 'almdrasa_links'];
        keys.forEach(k => {
            data[k] = Storage.getList(k);
        });
        
        data['app_settings'] = Storage.get('app_settings') || {};

        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `productivity_hq_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const fileInput = dataPanel.querySelector('#import-file');
    dataPanel.querySelector('#import-data-btn').onclick = () => fileInput.click();
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (confirm('سيؤدي هذا إلى استبدال بياناتك الحالية. هل تريد المتابعة؟')) {
                    Object.keys(data).forEach(k => {
                        if (k === 'app_settings') Storage.set(k, data[k]);
                        else Storage.saveList(k, data[k]);
                    });
                    alert('تم استيراد البيانات بنجاح. جاري إعادة التحميل...');
                    location.reload();
                }
            } catch (err) {
                alert('ملف JSON غير صالح.');
            }
        };
        reader.readAsText(file);
    };

    dataPanel.querySelector('#cloud-sync-btn').onclick = () => {
        openCloudSyncSettings();
    };

    function openCloudSyncSettings() {
        const config = Storage.get('cloud_sync_config') || { url: '', key: '' };
        const syncId = Storage.get('sync_id_key') || '';
        const lastSync = Storage.get('last_sync_time') || 'لم يتم المزامنة بعد';

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay glass-panel';
        overlay.style.cssText = 'position:fixed; inset:0; z-index:3500; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center;';

        const modal = document.createElement('div');
        modal.className = 'glass-panel';
        modal.style.cssText = 'width:500px; padding:2rem; border-radius:16px; background:#151515;';

        modal.innerHTML = `
            <h2 style="margin-bottom: 1.5rem; display:flex; align-items:center; gap:12px;">
                <i class="fa-solid fa-cloud" style="color:var(--metallic-gold);"></i> 
                إعدادات المزامنة السحابية
            </h2>
            
            <div style="display: flex; flex-direction: column; gap: 1.2rem;">
                <div style="background: rgba(var(--gold-rgb), 0.1); padding: 1rem; border-radius: 12px; border: 1px solid rgba(var(--gold-rgb), 0.2);">
                    <p style="font-size: 0.85rem; color: #fff; margin-bottom: 5px;">أدخل "مفتاح المزامنة" لربط أجهزتك:</p>
                    <input type="text" id="sync-id-input" value="${syncId}" placeholder="مثلاً: adham-leads-2024" style="width:100%; padding:12px; background:rgba(0,0,0,0.3); border:1px solid var(--metallic-gold); border-radius:8px; color:#fff; font-family:monospace; text-align:center;">
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                    <h4 style="margin-bottom: 1rem; font-size: 0.9rem; opacity: 0.7;">إعدادات Supabase (للمطورين)</h4>
                    <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                        <div>
                            <label style="display:block; color:var(--text-secondary); margin-bottom:0.4rem; font-size:0.8rem;">Project URL</label>
                            <input type="text" id="sb-url" value="${config.url}" style="width:100%; padding:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-size:0.8rem;">
                        </div>
                        <div>
                            <label style="display:block; color:var(--text-secondary); margin-bottom:0.4rem; font-size:0.8rem;">Anon Key</label>
                            <input type="password" id="sb-key" value="${config.key}" style="width:100%; padding:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-size:0.8rem;">
                        </div>
                    </div>
                </div>

                <div style="font-size: 0.8rem; color: var(--text-secondary); text-align: center;">
                    آخر مزامنة ناجحة: <span style="color:var(--metallic-gold);">${lastSync}</span>
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 0.5rem;">
                    <button id="close-sync" class="btn btn-secondary">إغلاق</button>
                    <button id="save-sync" class="btn btn-primary">حفظ وتفعيل</button>
                </div>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.querySelector('#close-sync').onclick = () => overlay.remove();
        overlay.querySelector('#save-sync').onclick = async () => {
            const newUrl = modal.querySelector('#sb-url').value.trim();
            const newKey = modal.querySelector('#sb-key').value.trim();
            const newSyncId = modal.querySelector('#sync-id-input').value.trim();

            if (!newSyncId) {
                alert('يرجى إدخال مفتاح مزامنة');
                return;
            }

            Storage.set('cloud_sync_config', { url: newUrl, key: newKey });
            Storage.set('sync_id_key', newSyncId);
            
            alert('تم حفظ الإعدادات بنجاح. سيتم البدء في المزامنة تلقائياً.');
            overlay.remove();
            
            // Reload page to re-init sync with new credentials if they were changed
            if (confirm('يجب إعادة تحميل الصفحة لتفعيل المزامنة الجديدة. هل تريد إعادة التحميل الآن؟')) {
                location.reload();
            }
        };
    }

    dataPanel.querySelector('#reset-data').onclick = () => {
        if (confirm('تحذير: سيؤدي هذا إلى حذف جميع بياناتك نهائياً. هل أنت متأكد؟')) {
            localStorage.clear();
            alert('تمت إعادة تعيين التطبيق. جاري إعادة التحميل...');
            location.reload();
        }
    };

    container.appendChild(grid);
    return container;
}

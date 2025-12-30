import { Storage, Utils, Notifications } from './core.js';
import { fetchSalesData } from './sales-report.js';

export async function renderDashboard() {
    console.log('Rendering Dashboard...');
    try {
        const container = document.createElement('div');
        container.className = 'dashboard-animation';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.minHeight = '100%';

        const messages = Storage.getList('messages_data') || []; 
        const reminders = Storage.getList('reminders_data') || [];
        
        let lastMessage = null;
        if (messages.length > 0) {
            lastMessage = messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        }

        const now = new Date();
        let nextReminder = null;
        if (reminders.length > 0) {
            nextReminder = reminders
                .filter(r => new Date(r.dateTime) > now)
                .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))[0];
        }

        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let gregorianDate = '';
        try {
            gregorianDate = new Date().toLocaleDateString('ar-EG', dateOptions);
        } catch (e) {
            gregorianDate = new Date().toLocaleDateString();
        }
        
        let hijriDate = '';
        try {
            hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            }).format(new Date());
        } catch(e) { 
            console.warn('Hijri date error:', e);
            hijriDate = ''; 
        }

        const currentUserGreeting = sessionStorage.getItem('currentUser') || 'الـ HQ';
        const rawName = currentUserGreeting.includes(':') ? currentUserGreeting.split(':')[1].trim() : currentUserGreeting;
        const userInitial = rawName.charAt(0);
        const storedAvatar = localStorage.getItem('user_profile_image');

        const header = document.createElement('div');
        header.className = 'dashboard-header-container';
        header.innerHTML = `
            <div class="welcome-card">
                <div class="user-profile">
                    <div class="welcome-info">
                        <span class="welcome-label">مرحباً بك مجدداً</span>
                        <h1 class="user-name">${rawName}</h1>
                        <div class="date-badge-container">
                            <div class="date-badge gold-badge">
                                <i class="fa-solid fa-moon"></i>
                                <span>${hijriDate}</span>
                            </div>
                            <div class="date-badge">
                                <i class="fa-regular fa-calendar"></i>
                                <span>${gregorianDate}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="header-clock-section">
                    <div id="clock-display" class="digital-clock" style="direction: ltr;">
                        <span class="clock-part" id="clock-h">12</span><span class="clock-colon">:</span><span class="clock-part" id="clock-m">00</span>
                        <div class="clock-ampm" id="clock-p" style="margin-left: 10px;">PM</div>
                    </div>
                </div>
            </div>
        `;

        const updateTime = () => {
            if (!header.isConnected) return; 

            const d = new Date();
            let h = d.getHours();
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12; 
            h = h ? h : 12; 
            const m = d.getMinutes();

            const hStr = h.toString().padStart(2, '0');
            const mStr = m.toString().padStart(2, '0');

            const clockEl = header.querySelector('#clock-display');
            if(!clockEl) return;

            const elH = clockEl.querySelector('#clock-h');
            const elM = clockEl.querySelector('#clock-m');
            const elP = clockEl.querySelector('#clock-p');

            if (elH && elH.innerText !== hStr) { elH.innerText = hStr; elH.classList.add('flip'); setTimeout(()=>elH.classList.remove('flip'), 500); }
            if (elM && elM.innerText !== mStr) { elM.innerText = mStr; elM.classList.add('flip'); setTimeout(()=>elM.classList.remove('flip'), 500); }
            if (elP) elP.innerText = ampm;
        };
        
        const clockInterval = setInterval(() => {
            if (!header.isConnected) {
                clearInterval(clockInterval);
                return;
            }
            updateTime();
        }, 1000);
        
        try {
            const d = new Date();
            let h = d.getHours();
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12; h = h ? h : 12;
            const m = d.getMinutes();
            header.querySelector('#clock-h').innerText = h.toString().padStart(2, '0');
            header.querySelector('#clock-m').innerText = m.toString().padStart(2, '0');
            header.querySelector('#clock-p').innerText = ampm;
        } catch(e) { console.error('Clock init error', e); }

        const avatar = header.querySelector('#main-user-avatar');
        const avatarInput = header.querySelector('#avatar-input');

        if (avatar && avatarInput) {
            avatar.onclick = () => avatarInput.click();
            avatarInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target.result;
                        localStorage.setItem('user_profile_image', base64);
                        avatar.style.backgroundImage = `url(${base64})`;
                        avatar.style.backgroundSize = 'cover';
                        avatar.style.backgroundPosition = 'center';
                        avatar.style.fontSize = '0';
                        avatar.innerHTML = '<input type="file" id="avatar-input" style="display: none;" accept="image/*">';
                        
                        // Re-bind input after innerHTML wipe
                        const newInput = avatar.querySelector('#avatar-input');
                        newInput.onchange = avatarInput.onchange;
                        
                        import('./core.js').then(m => m.Notifications.success('تم تحديث الصورة الشخصية بنجاح'));
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        container.appendChild(header);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        grid.style.gap = '1.5rem';

        const msgCard = document.createElement('div');
        msgCard.className = 'glass-card';
        msgCard.innerHTML = `
            <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-clock-rotate-left gold-text"></i> آخر رسالة</h3>
            ${lastMessage 
                ? `
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px;">
                        <h4 style="color: var(--metallic-gold); margin-bottom: 0.5rem;">${lastMessage.title || 'Untitled'}</h4>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4;">${(lastMessage.body || '').substring(0, 100)}${(lastMessage.body || '').length > 100 ? '...' : ''}</p>
                        <div style="margin-top: 0.8rem; font-size: 0.8rem; opacity: 0.7;">
                            <i class="fa-solid fa-feather"></i> ${Utils.formatDate(lastMessage.timestamp)}
                        </div>
                    </div>
                    <button class="btn btn-glass" style="margin-top: 1rem; width: 100%;" onclick="location.hash='#messages'">فتح الرسائل</button>
                `
                : `<p style="color: var(--text-secondary);">لا توجد رسائل بعد.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="location.hash='#messages'">إنشاء أول رسالة</button>`
            }
        `;
        grid.appendChild(msgCard);

        const remCard = document.createElement('div');
        remCard.className = 'glass-card';
        remCard.innerHTML = `
            <h3 style="margin-bottom: 1rem;"><i class="fa-solid fa-bell gold-text"></i> التذكير القادم</h3>
            ${nextReminder
                ? `
                    <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--metallic-gold);">
                        <h4 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${nextReminder.title}</h4>
                        <p style="font-size: 1.2rem; font-weight: 700; color: var(--text-secondary);">
                            ${new Date(nextReminder.dateTime).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p style="font-size: 0.9rem; opacity: 0.8;">${new Date(nextReminder.dateTime).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <button class="btn btn-glass" style="margin-top: 1rem; width: 100%;" onclick="location.hash='#reminders'">إدارة التذكيرات</button>
                `
                : `<p style="color: var(--text-secondary);">لا توجد تذكيرات قادمة.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="location.hash='#reminders'">إضافة تذكير</button>`
            }
        `;
        grid.appendChild(remCard);

        const actionCard = document.createElement('div');
        actionCard.className = 'glass-card';
        
        const allPossibleActions = {
            leads: { label: 'عميل جديد', icon: 'fa-user-plus' },
            notes: { label: 'ملاحظة جديدة', icon: 'fa-plus' },
            calculator: { label: 'الخصومات', icon: 'fa-calculator' },
            calendar: { label: 'التقويم', icon: 'fa-calendar-days' },
            settings: { label: 'الإعدادات', icon: 'fa-gear' },
            messages: { label: 'الرسائل', icon: 'fa-comment-dots' },
            almdrasa: { label: 'المدرسة', icon: 'fa-school' },
            links: { label: 'الروابط', icon: 'fa-link' },
            reminders: { label: 'التذكيرات', icon: 'fa-bell' },
            articles: { label: 'المقالات', icon: 'fa-newspaper' },
            tvmode: { label: 'التلفاز', icon: 'fa-tv' },
            whatsapp: { label: 'واتساب', icon: 'fa-square-phone' },
            meetings: { label: 'الاجتماعات', icon: 'fa-handshake' },
            sales: { label: 'المبيعات', icon: 'fa-chart-pie' }
        };

        const externalLinks = [
            { label: 'الأوردرات', icon: 'fa-cart-shopping', url: 'https://almdrasa.com/wp-admin/edit.php?post_type=shop_order' },
            { label: 'الاشتراكات', icon: 'fa-repeat', url: 'https://almdrasa.com/wp-admin/edit.php?post_type=shop_subscription' },
            { label: 'الـoutsales', icon: 'fa-chart-line', url: 'https://almdrasa.com/wp-admin/admin.php?page=almdrasa-sales-outside-almdrasa' },
            { label: 'المستخدمين', icon: 'fa-user-gear', url: 'https://almdrasa.com/wp-admin/users.php' },
            { label: 'التسليمات', icon: 'fa-file-signature', url: 'https://almdrasa.com/wp-admin/edit.php?post_type=sfwd-assignment' }
        ];

        let showingExternal = false;
        const renderActions = () => {
            const savedActions = JSON.parse(localStorage.getItem('quick_actions') || '["leads", "notes", "calculator", "calendar", "settings"]');
            
            actionCard.innerHTML = `
                <div class="card-hint-overlay">
                    <div class="hint-text">
                        <i class="fa-solid fa-keyboard"></i> اضغط <span style="color:#fff; font-weight:bold;">R</span> للتبديل
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <h3 style="margin:0;"><i class="fa-solid fa-bolt gold-text"></i> إجراءات سريعة</h3>
                    </div>
                    <button class="radio-mini-btn edit-actions-btn" title="تعديل الإجراءات" style="width:30px; height:30px; margin:0!important; background:rgba(255,215,0,0.1); border-color:rgba(255,215,0,0.2);">
                        <i class="fa-solid fa-pen-to-square" style="font-size:0.8rem; color:var(--metallic-gold);"></i>
                    </button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; animation: fadeIn 0.3s ease;">
                    ${showingExternal 
                        ? externalLinks.map(link => `
                            <a href="${link.url}" target="_blank" class="btn btn-glass" style="text-decoration: none;">
                                <i class="fa-solid ${link.icon}"></i> ${link.label}
                            </a>
                        `).join('')
                        : savedActions.map(key => {
                            const action = allPossibleActions[key];
                            if (!action) return '';
                            return `<button class="btn btn-glass" onclick="location.hash='#${key}'">
                                <i class="fa-solid ${action.icon}"></i> ${action.label}
                            </button>`;
                        }).join('')
                    }
                </div>
            `;

            actionCard.querySelector('.edit-actions-btn').onclick = () => {
                const modal = document.createElement('div');
                modal.className = 'glass-panel reciter-modal';
                modal.style.cssText = `
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 90%; max-width: 450px; z-index: 10000;
                    padding: 2rem; display: flex; flex-direction: column;
                    animation: slideUp 0.3s ease; border: 1px solid rgba(255,215,0,0.3);
                `;

                const currentActions = JSON.parse(localStorage.getItem('quick_actions') || '["leads", "notes", "calculator", "calendar", "settings"]');

                modal.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                        <h3>تخصيص الإجراءات السريعة</h3>
                        <button class="btn btn-glass close-modal" style="padding:5px 10px;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; flex:1; overflow-y:auto; padding-right:5px;">
                        ${Object.keys(allPossibleActions).map(key => `
                            <div class="action-toggle-item ${currentActions.includes(key) ? 'active' : ''}" data-key="${key}" style="
                                padding:12px; background:rgba(255,255,255,0.05); border-radius:12px; 
                                border:1px solid ${currentActions.includes(key) ? 'var(--metallic-gold)' : 'rgba(255,255,255,0.1)'};
                                cursor:pointer; display:flex; align-items:center; gap:10px; transition:all 0.2s;
                            ">
                                <i class="fa-solid ${allPossibleActions[key].icon}" style="color:${currentActions.includes(key) ? 'var(--metallic-gold)' : 'rgba(255,255,255,0.4)'}"></i>
                                <span style="font-size:0.9rem; color:${currentActions.includes(key) ? '#fff' : 'rgba(255,255,255,0.6)'}">${allPossibleActions[key].label}</span>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary save-actions" style="margin-top:1.5rem; width:100%;">حفظ التغييرات</button>
                `;

                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; backdrop-filter:blur(8px);';
                
                const closeModal = () => { modal.remove(); overlay.remove(); };
                overlay.onclick = closeModal;
                modal.querySelector('.close-modal').onclick = closeModal;

                let selected = [...currentActions];
                modal.querySelectorAll('.action-toggle-item').forEach(item => {
                    item.onclick = () => {
                        const key = item.dataset.key;
                        if (selected.includes(key)) {
                            selected = selected.filter(k => k !== key);
                            item.style.borderColor = 'rgba(255,255,255,0.1)';
                            item.querySelector('i').style.color = 'rgba(255,255,255,0.4)';
                            item.querySelector('span').style.color = 'rgba(255,255,255,0.6)';
                        } else {
                            if (selected.length >= 8) {
                                import('./core.js').then(m => m.Notifications.warning('الحد الأقصى 8 إجراءات'));
                                return;
                            }
                            selected.push(key);
                            item.style.borderColor = 'var(--metallic-gold)';
                            item.querySelector('i').style.color = 'var(--metallic-gold)';
                            item.querySelector('span').style.color = '#fff';
                        }
                    };
                });

                modal.querySelector('.save-actions').onclick = () => {
                    localStorage.setItem('quick_actions', JSON.stringify(selected));
                    renderActions();
                    closeModal();
                    import('./core.js').then(m => m.Notifications.success('تم تحديث الإجراءات بنجاح'));
                };

                document.body.appendChild(overlay);
                document.body.appendChild(modal);
            };
        };

        renderActions();
        const salesCard = document.createElement('div');
        salesCard.className = 'glass-card sales-overview-card';
        const renderSalesCard = () => {
            const data = Storage.get('last_sales_data') || {};
            const today = data.today || { totalEgp: '---', orders: '---' };
            const total = data.totalSales || { totalEgp: '---' };
            
            const timestamp = localStorage.getItem('last_sales_update');
            const timeStr = timestamp ? new Date(parseInt(timestamp)).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '---';
            const isOld = timestamp && (Date.now() - parseInt(timestamp) > 5 * 60 * 1000);
            
            salesCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.2rem;">
                    <h3 style="margin:0;"><i class="fa-solid fa-chart-line gold-text"></i> ملخص المبيعات</h3>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <button class="dash-refresh-btn" id="dash-sales-refresh" title="تحديث البيانات">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                        <div class="live-indicator">
                            <span class="${isOld ? 'offline-dot' : 'live-pulse'}"></span>
                            <span style="font-size:0.75rem; color:rgba(255,255,255,0.4)" id="dash-sales-time">${isOld ? 'مخزنة: ' : 'مباشر: '}${timeStr}</span>
                        </div>
                    </div>
                </div>
                
                <div class="dashboard-sales-grid">
                    <div class="dashboard-sales-item">
                        <span class="dash-sales-label">مبيعات اليوم</span>
                        <span class="dash-sales-value">${today.totalEgp}</span>
                    </div>
                    <div class="dashboard-sales-item">
                        <span class="dash-sales-label">إجمالي المبيعات</span>
                        <span class="dash-sales-value">${total.totalEgp}</span>
                    </div>
                </div>

                <div style="margin-top: 1.2rem; display: flex; gap: 0.8rem;">
                    <div style="flex:1; background:rgba(255,215,0,0.05); padding:10px; border-radius:12px; border:1px solid rgba(255,215,0,0.1); text-align:center;">
                        <div style="font-size:0.7rem; color:rgba(255,255,255,0.4); margin-bottom:4px;">عدد طلبات اليوم</div>
                        <div style="font-size:1.1rem; font-weight:700; color:var(--metallic-gold);">${today.orders}</div>
                    </div>
                    <button class="btn btn-glass" style="flex:1;" onclick="location.hash='#sales'">
                        <i class="fa-solid fa-arrow-right"></i> التفاصيل
                    </button>
                </div>
            `;
            
            const isOldUI = timestamp && (Date.now() - parseInt(timestamp) > 5 * 60 * 1000);
            const timeEl = salesCard.querySelector('#dash-sales-time');
            if (timeEl) timeEl.innerText = `${isOldUI ? 'مخزنة: ' : 'مباشر: '}${timeStr}`;
            
            const pulseEl = salesCard.querySelector('.live-pulse, .offline-dot');
            if (pulseEl) {
                pulseEl.className = isOldUI ? 'offline-dot' : 'live-pulse';
            }
            
            const refreshBtn = salesCard.querySelector('#dash-sales-refresh');
            if (refreshBtn) {
                refreshBtn.onclick = (e) => {
                    e.stopPropagation();
                    const icon = refreshBtn.querySelector('i');
                    icon.classList.add('fa-spin');
                    updateSales().finally(() => icon.classList.remove('fa-spin'));
                };
            }
        };

        renderSalesCard();
        grid.appendChild(salesCard);

        // Background update for Sales
        const updateSales = async () => {
            try {
                const data = await fetchSalesData(true);
                Storage.set('last_sales_data', data);
                localStorage.setItem('last_sales_update', Date.now());
                renderSalesCard();
            } catch (e) {
                console.warn('Dashboard side sales sync failed', e);
            }
        };

        // Initial background sync
        updateSales();
        const salesSyncInterval = setInterval(() => {
            if (container.isConnected) updateSales();
            else clearInterval(salesSyncInterval);
        }, 3 * 60 * 1000); // 3 minutes for dashboard sync

        grid.appendChild(actionCard);

        container.appendChild(grid);

        const radioPlaceholder = document.createElement('div');
        radioPlaceholder.className = 'quran-radio-section';
        radioPlaceholder.style.width = '100%';
        radioPlaceholder.style.marginTop = '1.5rem';
        
        container.appendChild(radioPlaceholder);

        setTimeout(async () => {
             const { QuranRadio } = await import('./quran-radio.js');
             const radio = new QuranRadio();
             
             const radioContainer = document.createElement('div');
             radioContainer.className = 'glass-card premium-radio';
             radioContainer.innerHTML = `
                 <div class="radio-header">
                     <div class="radio-main-info">
                         <div class="radio-icon">
                             <i class="fa-solid fa-mosque"></i>
                         </div>
                         <div class="radio-text">
                             <span class="radio-label">البث المباشر</span>
                             <h3 class="radio-reciter-name">${radio.getCurrentReciter().name}</h3>
                         </div>
                     </div>
                     <div class="radio-status-tag">
                        <span class="status-dot"></span>
                        <span class="status-text">متصل</span>
                     </div>
                 </div>

                 <div class="radio-visualizer">
                      <div class="waveform" id="radio-waveform" style="display:flex; align-items:flex-end; gap:8px; height:100%;">
                          ${Array(24).fill(0).map(() => `
                              <div class="wave-bar-container" style="position:relative; height:100%; width:10px; display:flex; align-items:flex-end;">
                                  <div class="wave-bar"></div>
                                  <div class="peak-cap"></div>
                              </div>
                          `).join('')}
                      </div>
                 </div>

                 <div class="radio-controls-row">
                     <div class="volume-control">
                         <button class="radio-mini-btn mute-btn" title="كتم الصوت"><i class="fa-solid fa-volume-high"></i></button>
                         <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="${radio.volume}" style="--volume-percent: ${radio.volume * 100}%">
                     </div>
                     
                     <div class="main-btns">
                         <button class="radio-btn prev-btn" title="القارئ السابق"><i class="fa-solid fa-backward-step"></i></button>
                         <button class="radio-btn play-btn" id="radio-play-toggle">
                             <i class="fa-solid fa-play"></i>
                         </button>
                         <button class="radio-btn next-btn" title="القارئ التالي"><i class="fa-solid fa-forward-step"></i></button>
                     </div>

                     <div class="radio-actions">
                         <button class="radio-mini-btn mirror-btn" id="switch-mirror" title="تبديل السيرفر" style="display: none;"><i class="fa-solid fa-server"></i></button>
                         <button class="radio-mini-btn refresh-btn" id="refresh-stream" title="تحديث البث"><i class="fa-solid fa-arrows-rotate"></i></button>
                         <button class="radio-mini-btn" id="copy-stream" title="نسخ رابط البث"><i class="fa-solid fa-link"></i></button>
                         <button class="radio-mini-btn" id="search-reciter" title="بحث عن قارئ"><i class="fa-solid fa-magnifying-glass"></i></button>
                     </div>
                 </div>

             `;

             radioPlaceholder.appendChild(radioContainer);

             const playBtn = radioContainer.querySelector('#radio-play-toggle');
             const nextBtn = radioContainer.querySelector('.next-btn');
             const prevBtn = radioContainer.querySelector('.prev-btn');
             const volumeSlider = radioContainer.querySelector('.volume-slider');
             const reciterName = radioContainer.querySelector('.radio-reciter-name');
             const waveform = radioContainer.querySelector('#radio-waveform');
             const statusTag = radioContainer.querySelector('.radio-status-tag');

             const updateUI = (state, reciter) => {
                 const icon = playBtn.querySelector('i');
                 reciterName.innerText = reciter.name;
                 
                 const infoBox = radioContainer.querySelector('#reciter-info-box');
                 if (infoBox) {
                     infoBox.innerText = reciter.bio || 'استمتع بتلاوة القرآن الكريم من مختلف القراء والإذاعات.';
                     infoBox.style.animation = 'none';
                     infoBox.offsetHeight; 
                     infoBox.style.animation = null;
                 }

                 const mirrorBtn = radioContainer.querySelector('#switch-mirror');
                 if (mirrorBtn) {
                     mirrorBtn.style.display = (reciter.mirrors && reciter.mirrors.length > 1) ? 'flex' : 'none';
                 }

                 const muteBtnIcon = radioContainer.querySelector('.mute-btn i');
                 if (muteBtnIcon) {
                     muteBtnIcon.className = radio.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
                     muteBtnIcon.parentElement.style.color = radio.muted ? 'var(--error-color, #ff4d4d)' : '';
                 }
                 
                 if (reciter.name.includes('المنشاوي')) {
                     reciterName.style.color = 'var(--metallic-gold)';
                 } else {
                     reciterName.style.color = '';
                 }
                 
                 if (state === 'playing') {
                     radioContainer.classList.add('is-playing');
                     icon.className = 'fa-solid fa-pause';
                     statusTag.querySelector('.status-text').innerText = 'يتم التشغيل';
                     statusTag.classList.add('active');
                 } else if (state === 'loading') {
                     radioContainer.classList.remove('is-playing');
                     icon.className = 'fa-solid fa-spinner fa-spin';
                     statusTag.querySelector('.status-text').innerText = 'جاري التحميل...';
                     statusTag.classList.remove('active');
                 } else if (state === 'error') {
                     radioContainer.classList.remove('is-playing');
                     icon.className = 'fa-solid fa-circle-exclamation';
                     statusTag.querySelector('.status-text').innerText = 'خطأ في الاتصال';
                     statusTag.classList.remove('active');
                 } else {
                     radioContainer.classList.remove('is-playing');
                     icon.className = 'fa-solid fa-play';
                     statusTag.querySelector('.status-text').innerText = 'متصل';
                     statusTag.classList.remove('active');
                 }
             };

             playBtn.onclick = () => radio.togglePlay();
             nextBtn.onclick = () => radio.switchReciter(1);
             prevBtn.onclick = () => radio.switchReciter(-1);
             
             radioContainer.querySelector('.mute-btn').onclick = () => {
                 radio.toggleMute();
                 updateUI(radio.state, radio.getCurrentReciter());
             };
             radioContainer.querySelector('#refresh-stream').onclick = () => radio.refresh();
             radioContainer.querySelector('#switch-mirror').onclick = () => radio.nextMirror();

             volumeSlider.oninput = (e) => {
                 const val = e.target.value;
                 radio.setVolume(val);
                 e.target.style.setProperty('--volume-percent', (val * 100) + '%');
             };
             
             radioContainer.querySelector('#copy-stream').onclick = () => {
                 navigator.clipboard.writeText(radio.getCurrentUrl());
                 Notifications.success('تم نسخ رابط البث');
             };

             radioContainer.querySelector('#search-reciter').onclick = () => {
                 const modal = document.createElement('div');
                 modal.className = 'glass-panel reciter-modal';
                 modal.style.cssText = `
                     position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                     width: 90%; max-width: 500px; height: 80vh; z-index: 10000;
                     padding: 2rem; display: flex; flex-direction: column;
                     animation: slideUp 0.3s ease;
                 `;
                 
                 modal.innerHTML = `
                     <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                         <h3>اختر القارئ</h3>
                         <button class="btn btn-glass close-modal" style="padding:5px 10px;"><i class="fa-solid fa-xmark"></i></button>
                     </div>
                     <input type="text" class="search-input" placeholder="ابحث عن قارئ أو إذاعة..." style="
                         width:100%; padding:12px; background:rgba(255,255,255,0.05); 
                         border:1px solid rgba(255,255,255,0.1); border-radius:8px; 
                         color:white; margin-bottom:1rem;
                     ">
                     <div class="reciter-list" style="flex:1; overflow-y:auto; padding-right:5px;">
                         ${radio.reciters.map((r, idx) => `
                             <div class="reciter-item" data-idx="${idx}" style="
                                 padding:12px; margin-bottom:8px; background:rgba(0,0,0,0.2); 
                                 border-radius:8px; cursor:pointer; transition:all 0.2s;
                                 display:flex; align-items:center; justify-content:space-between;
                             ">
                                  <span>${r.name}</span>
                                  ${idx === radio.currentReciterIndex ? '<i class="fa-solid fa-check gold-text"></i>' : ''}
                             </div>
                         `).join('')}
                     </div>
                 `;

                 const overlay = document.createElement('div');
                 overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; backdrop-filter:blur(5px);';
                 
                 const closeModal = () => { modal.remove(); overlay.remove(); };
                 overlay.onclick = closeModal;
                 modal.querySelector('.close-modal').onclick = closeModal;

                 const searchInput = modal.querySelector('.search-input');
                 const list = modal.querySelector('.reciter-list');
                 
                 searchInput.oninput = (e) => {
                     const term = e.target.value.toLowerCase();
                     const items = list.querySelectorAll('.reciter-item');
                     items.forEach(item => {
                         const name = item.querySelector('span').innerText.toLowerCase();
                         item.style.display = name.includes(term) ? 'flex' : 'none';
                     });
                 };

                 list.onclick = (e) => {
                     const item = e.target.closest('.reciter-item');
                     if (item) {
                         const idx = parseInt(item.getAttribute('data-idx'));
                         radio.stop();
                         radio.currentReciterIndex = idx;
                         localStorage.setItem('quran_reciter_idx', idx);
                         radio.play();
                         closeModal();
                     }
                 };

                 document.body.appendChild(overlay);
                 document.body.appendChild(modal);
                 searchInput.focus();
             };

             radio.onStateChange = updateUI;
             updateUI(radio.state, radio.getCurrentReciter());

             const bars = waveform.querySelectorAll('.wave-bar');
             const peaks = waveform.querySelectorAll('.peak-cap');
             const barCount = 24;
             
             let peakValues = new Array(barCount).fill(0);
             let peakSpeeds = new Array(barCount).fill(0);
             let currentBarHeights = new Array(barCount).fill(0);
             let time = 0; 

             const gravity = 0.15; 
             const peakHoldTime = 12; 
             let peakHoldCounters = new Array(barCount).fill(0);

             const animateWave = () => {
                 if (!radioContainer.isConnected) return;
                 if (radio.state === 'playing') {
                     const freqData = radio.getFrequencyData();
                     time += 0.012; 
                     
                     if (freqData) {
                         const step = Math.floor(freqData.length / barCount);
                         
                         for (let i = 0; i < barCount; i++) {
                             let val = freqData[i * step] || 0;
                             
                             let wave1 = Math.sin(time + i * 0.4) * 12;
                             let wave2 = Math.sin(time * 0.5 + i * 0.2) * 8;
                             let baseWave = wave1 + wave2 + 25; 
                             
                             let audioInfluence = Math.pow(val / 255, 0.8) * 60;
                             
                             let targetH = Math.min(100, baseWave + audioInfluence);
                             
                             currentBarHeights[i] += (targetH - currentBarHeights[i]) * 0.12;
                             
                             const bar = bars[i];
                             const peak = peaks[i];
                             
                             if (bar) {
                                 bar.style.height = Math.max(8, currentBarHeights[i]) + '%';
                                 bar.style.opacity = 0.4 + (currentBarHeights[i] / 100) * 0.6;
                                 
                                 const hueShift = Math.floor((currentBarHeights[i] / 100) * 15);
                                 bar.style.filter = `hue-rotate(${hueShift}deg) brightness(${1 + currentBarHeights[i]/250})`;
                             }
                             
                             if (currentBarHeights[i] > peakValues[i]) {
                                 peakValues[i] = currentBarHeights[i];
                                 peakSpeeds[i] = 0;
                                 peakHoldCounters[i] = peakHoldTime;
                             } else {
                                 if (peakHoldCounters[i] > 0) {
                                     peakHoldCounters[i]--;
                                 } else {
                                     peakSpeeds[i] += gravity;
                                     peakValues[i] -= peakSpeeds[i];
                                     if (peakValues[i] < currentBarHeights[i]) {
                                         peakValues[i] = currentBarHeights[i];
                                         peakSpeeds[i] = 0;
                                     }
                                 }
                             }
                             
                             if (peak) {
                                 peak.style.transform = `translateY(${-peakValues[i]/2}px)`;
                             }
                         }
                     }
                 } else {
                     time += 0.004;
                     bars.forEach((bar, i) => {
                         let breathe = Math.sin(time + i * 0.4) * 5 + 10;
                         bar.style.height = breathe + 'px';
                         bar.style.opacity = '0.2';
                         bar.style.filter = 'none';
                     });
                     peakValues.fill(0);
                     peakSpeeds.fill(0);
                     currentBarHeights.fill(0);
                 }
                 
                 requestAnimationFrame(animateWave);
             };
             animateWave();

        }, 50);

        // Keyboard toggle for Quick Actions
        const handleKeyPress = (e) => {
            if (e.key.toLowerCase() === 'r') {
                if (!document.body.contains(container)) {
                    window.removeEventListener('keydown', handleKeyPress);
                    return;
                }
                // Only trigger if no input/textarea is focused
                if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
                
                showingExternal = !showingExternal;
                renderActions();
            }
        };
        window.addEventListener('keydown', handleKeyPress);

        return container;

    } catch (error) {
        console.error('CRITICAL: Error in renderDashboard', error);
        const errDiv = document.createElement('div');
        errDiv.innerHTML = `<h3 style="color:red">Dashboard Error: ${error.message}</h3>`;
        return errDiv;
    }
}

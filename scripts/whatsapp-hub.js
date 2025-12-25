import { Storage, Notifications } from './core.js';

const ARABIC_COUNTRIES = [
    { name: 'مصر', code: '20' },
    { name: 'السعودية', code: '966' },
    { name: 'الإمارات', code: '971' },
    { name: 'الكويت', code: '965' },
    { name: 'قطر', code: '974' },
    { name: 'عمان', code: '968' },
    { name: 'البحرين', code: '973' },
    { name: 'الأردن', code: '962' },
    { name: 'لبنان', code: '961' },
    { name: 'فلسطين', code: '970' },
    { name: 'سوريا', code: '963' },
    { name: 'العراق', code: '964' },
    { name: 'اليمن', code: '967' },
    { name: 'السودان', code: '249' },
    { name: 'ليبيا', code: '218' },
    { name: 'تونس', code: '216' },
    { name: 'الجزائر', code: '213' },
    { name: 'المغرب', code: '212' },
    { name: 'موريتانيا', code: '222' },
    { name: 'الصومال', code: '252' },
    { name: 'جيبوتي', code: '253' },
    { name: 'جزر القمر', code: '269' }
];

export async function renderWhatsAppHub() {
    const container = document.createElement('div');
    container.className = 'whatsapp-hub-page';

    const leads = Storage.getList('leads_data') || [];
    const contacts = Storage.getList('whatsapp_hub_contacts') || [
        { id: 1, name: 'خدمة العملاء', phone: '201000000000' }
    ];

    let selectedDialerCountry = ARABIC_COUNTRIES[0]; // Default to Egypt
    let selectedContactCountry = ARABIC_COUNTRIES[0];

    const renderDialerScreen = () => `
        <div class="dialer-screen">
            <div class="country-code" id="dialer-country-select" style="cursor: pointer;" title="اختر الدولة">
                +${selectedDialerCountry.code}
            </div>
            <input type="text" id="phone-display" placeholder="000 000 0000">
            <button id="clear-dialer"><i class="fa-solid fa-backspace"></i></button>
        </div>
    `;

    container.innerHTML = `
        <div class="whatsapp-layout">
            <div class="dialer-section">
                <div class="premium-dialer glass-panel">
                    <div id="dialer-screen-container">
                        ${renderDialerScreen()}
                    </div>
                    
                    <div class="dialer-grid">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map(n => `
                            <button class="dial-btn" data-val="${n}">${n}</button>
                        `).join('')}
                    </div>

                    <div class="dialer-actions">
                        <button id="send-whatsapp" class="btn-wa-main"><i class="fa-brands fa-whatsapp"></i> مراسلة عبر واتس آب</button>
                        <button id="send-whatsapp-business" class="btn-wa-main business"><i class="fa-brands fa-whatsapp"></i> مراسلة عبر واتس آب بيزنس</button>
                    </div>
                </div>
            </div>

            <div class="interaction-section">
                <div class="templates-hub glass-panel">
                    <div class="hub-header">
                        <h3><i class="fa-solid fa-address-book"></i> تسجيل جهة اتصال جديدة</h3>
                        <button class="btn-mini" id="add-contact"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div class="contacts-list">
                        ${contacts.map(c => `
                            <div class="contact-card-item" data-phone="${c.phone}">
                                <div class="contact-icon"><i class="fa-solid fa-user-tag"></i></div>
                                <div class="contact-info">
                                    <h4>${c.name}</h4>
                                    <p>${c.phone}</p>
                                </div>
                                <div class="chat-hint"><i class="fa-brands fa-whatsapp"></i></div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="leads-quick-pick glass-panel">
                    <div class="hub-header">
                        <h3><i class="fa-solid fa-users"></i> عملاء مسجلون</h3>
                    </div>
                    <div class="leads-list">
                        ${leads.length ? leads.map(l => `
                            <div class="lead-pick-item" data-phone="${l.phone}">
                                <div class="lead-avatar">${l.name.charAt(0)}</div>
                                <div class="lead-info">
                                    <span>${l.name}</span>
                                    <small>${l.phone}</small>
                                </div>
                            </div>
                        `).join('') : '<p class="empty-leads">لا يوجد عملاء مسجلون</p>'}
                    </div>
                </div>
            </div>
        </div>

        <div id="contact-modal" class="wa-modal" style="display:none;">
            <div class="wa-modal-content elite-modal glass-panel">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-user-plus"></i> إضافة جهة اتصال سريعة</h3>
                    <button class="modal-close" onclick="this.closest('.wa-modal').style.display='none'"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div class="modal-body">
                    <div class="elite-input-group">
                        <label><i class="fa-solid fa-signature"></i> اسم جهة الاتصال</label>
                        <div class="input-wrapper">
                            <input type="text" id="new-contact-name" placeholder="أدخل اسم الشخص...">
                        </div>
                    </div>
                    
                    <div class="elite-input-group">
                        <label><i class="fa-solid fa-phone-flip"></i> رقم الهاتف</label>
                        <div class="input-wrapper">
                            <input type="text" id="new-contact-phone" placeholder="01xxxxxxxxx">
                            <span class="country-hint" id="contact-country-select" style="cursor: pointer; pointer-events: all; border-right: 1px solid rgba(255,215,0,0.2); padding-right: 10px; margin-right: 10px;">
                                +${selectedContactCountry.code}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="wa-modal-btns">
                    <button class="btn btn-secondary" onclick="this.closest('.wa-modal').style.display='none'">إلغاء</button>
                    <button class="btn btn-primary" id="save-contact"><i class="fa-solid fa-check"></i> حفظ جهة الاتصال</button>
                </div>
            </div>
        </div>
    `;

    const openCountrySelector = (onSelect) => {
        const modal = document.createElement('div');
        modal.className = 'wa-modal';
        modal.style.cssText = 'z-index: 10001;';
        modal.innerHTML = `
            <div class="wa-modal-content elite-modal glass-panel" style="max-width: 400px;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-earth-africa"></i> اختر الدولة</h3>
                    <button class="modal-close" id="close-country-selector"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
                    ${ARABIC_COUNTRIES.map(c => `
                        <div class="country-item" data-code="${c.code}" style="
                            padding: 12px 15px; 
                            margin-bottom: 8px; 
                            background: rgba(255,255,255,0.03); 
                            border-radius: 12px; 
                            cursor: pointer; 
                            display: flex; 
                            justify-content: space-between;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='rgba(255,215,0,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                            <span>${c.name}</span>
                            <span style="color: var(--metallic-gold); font-weight: 700;">+${c.code}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const closeModal = () => modal.remove();
        modal.querySelector('#close-country-selector').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };

        modal.querySelectorAll('.country-item').forEach(item => {
            item.onclick = () => {
                const country = ARABIC_COUNTRIES.find(c => c.code === item.dataset.code);
                onSelect(country);
                closeModal();
            };
        });

        document.body.appendChild(modal);
    };

    const attachDialerEvents = (innerContainer) => {
        const display = innerContainer.querySelector('#phone-display');
        const clearBtn = innerContainer.querySelector('#clear-dialer');
        const countrySelect = innerContainer.querySelector('#dialer-country-select');

        innerContainer.querySelectorAll('.dial-btn').forEach(btn => {
            btn.onclick = () => {
                display.value += btn.dataset.val;
            };
        });

        clearBtn.onclick = () => {
            display.value = display.value.slice(0, -1);
        };

        countrySelect.onclick = () => {
            openCountrySelector((country) => {
                selectedDialerCountry = country;
                innerContainer.querySelector('#dialer-screen-container').innerHTML = renderDialerScreen();
                // Re-attach events for new display
                attachDialerEvents(innerContainer);
            });
        };
    };

    attachDialerEvents(container);

    container.querySelectorAll('.contact-card-item').forEach(item => {
        item.onclick = () => {
            const phone = item.dataset.phone;
            const display = container.querySelector('#phone-display');
            display.value = phone;
            const formattedPhone = phone.startsWith('+') ? phone.slice(1) : (phone.startsWith('0') ? '2' + phone : phone);
            const url = `https://wa.me/${formattedPhone}`;
            window.open(url, '_blank');
            Notifications.success(`جاري مراسلة ${item.querySelector('h4').innerText}`);
        };
    });

    container.querySelectorAll('.lead-pick-item').forEach(item => {
        item.onclick = () => {
            container.querySelector('#phone-display').value = item.dataset.phone;
            Notifications.success('تم اختيار العميل');
        };
    });

    const sendWhatsApp = (isBusiness = false) => {
        const display = container.querySelector('#phone-display');
        let phone = display.value.replace(/\s/g, '');
        if (!phone) return Notifications.error('يرجى إدخال رقم هاتف');
        
        let finalPhone = phone;
        if (!phone.startsWith('+')) {
            // Remove leading zero if present
            if (phone.startsWith('0')) phone = phone.slice(1);
            finalPhone = selectedDialerCountry.code + phone;
        } else {
            finalPhone = phone.slice(1);
        }

        const baseUrl = isBusiness ? 'https://api.whatsapp.com/send' : 'https://wa.me';
        const url = isBusiness ? `${baseUrl}?phone=${finalPhone}` : `${baseUrl}/${finalPhone}`;
        
        window.open(url, '_blank');
        Notifications.success(isBusiness ? 'جاري فتح واتساب بيزنس...' : 'جاري فتح واتساب...');
    };

    container.querySelector('#send-whatsapp').onclick = () => sendWhatsApp(false);
    container.querySelector('#send-whatsapp-business').onclick = () => sendWhatsApp(true);

    container.querySelector('#add-contact').onclick = () => {
        container.querySelector('#contact-modal').style.display = 'flex';
    };

    container.querySelector('#contact-country-select').onclick = () => {
        openCountrySelector((country) => {
            selectedContactCountry = country;
            container.querySelector('#contact-country-select').innerText = `+${country.code}`;
            container.querySelector('#new-contact-phone').placeholder = country.code === '20' ? '01xxxxxxxxx' : 'رقم الهاتف...';
        });
    };

    container.querySelector('#save-contact').onclick = () => {
        const name = container.querySelector('#new-contact-name').value;
        let phone = container.querySelector('#new-contact-phone').value;
        if (name && phone) {
            if (phone.startsWith('0')) phone = phone.slice(1);
            const fullPhone = '+' + selectedContactCountry.code + phone;
            contacts.push({ id: Date.now(), name, phone: fullPhone });
            Storage.set('whatsapp_hub_contacts', contacts);
            renderWhatsAppHub().then(newCont => {
                container.replaceWith(newCont);
            });
            Notifications.success('تم حفظ جهة الاتصال');
        } else {
            Notifications.error('يرجى ملء جميع الحقول');
        }
    };

    return container;
}

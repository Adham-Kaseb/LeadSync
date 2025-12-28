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

    let selectedDialerCountry = ARABIC_COUNTRIES[0]; 
    let selectedContactCountry = ARABIC_COUNTRIES[0];
    let editingContactId = null;

    const renderDialerScreen = () => `
        <div class="dialer-screen">
            <div class="country-code" id="dialer-country-select" style="cursor: pointer;" title="اختر الدولة">
                +${selectedDialerCountry.code}
            </div>
            <input type="text" id="phone-display" placeholder="000 000 0000">
            <button id="clear-dialer" title="مسح"><i class="fa-solid fa-delete-left"></i></button>
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
                        <button id="send-whatsapp" class="btn-wa-main"><i class="fa-brands fa-whatsapp"></i> مراسلة واتساب</button>
                        <button id="send-whatsapp-business" class="btn-wa-main business"><i class="fa-brands fa-whatsapp"></i> واتساب بيزنس</button>
                    </div>
                </div>
            </div>

            <div class="interaction-section">
                <div class="templates-hub glass-panel">
                    <div class="hub-header">
                        <h3><i class="fa-solid fa-address-book"></i> جهات اتصال سريعة</h3>
                        <button class="btn-mini" id="add-contact" title="إضافة جديد"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div class="contacts-list">
                        ${contacts.map(c => `
                            <div class="contact-card-item" data-id="${c.id}" data-phone="${c.phone}">
                                <div class="contact-icon"><i class="fa-solid fa-user-tie"></i></div>
                                <div class="contact-info">
                                    <h4>${c.name}</h4>
                                    <p>${c.phone}</p>
                                </div>
                                <div class="contact-actions">
                                    <button class="action-btn edit-contact" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>
                                    <button class="action-btn delete-contact" title="حذف"><i class="fa-solid fa-trash-can"></i></button>
                                </div>
                                <div class="chat-hint"><i class="fa-brands fa-whatsapp"></i></div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="leads-quick-pick glass-panel">
                    <div class="hub-header">
                        <h3><i class="fa-solid fa-users-viewfinder"></i> عملاء مسجلون</h3>
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
                        `).join('') : '<p class="empty-leads">لا يوجد عملاء متاحون حالياً</p>'}
                    </div>
                </div>
            </div>
        </div>

        <div id="contact-modal" class="wa-modal" style="display:none;">
            <div class="wa-modal-content elite-modal glass-panel">
                <div class="modal-header">
                    <h3 id="modal-title"><i class="fa-solid fa-user-plus"></i> إضافة جهة اتصال</h3>
                    <button class="modal-close"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div class="modal-body">
                    <div class="elite-input-group">
                        <label><i class="fa-solid fa-id-card"></i> الاسم</label>
                        <div class="input-wrapper">
                            <input type="text" id="new-contact-name" placeholder="أدخل الاسم">
                        </div>
                    </div>
                    
                    <div class="elite-input-group">
                        <label><i class="fa-solid fa-phone"></i> رقم الهاتف</label>
                        <div class="input-wrapper">
                            <input type="text" id="new-contact-phone" placeholder="01xxxxxxxxx">
                            <span class="country-hint" id="contact-country-select" style="cursor: pointer; pointer-events: all; z-index: 10;">
                                +${selectedContactCountry.code}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="wa-modal-btns">
                    <button class="btn btn-secondary" id="cancel-contact">إلغاء</button>
                    <button class="btn btn-primary" id="save-contact"><i class="fa-solid fa-check"></i> حفظ التغييرات</button>
                </div>
            </div>
        </div>
    `;

    const openCountrySelector = (onSelect) => {
        const modal = document.createElement('div');
        modal.className = 'wa-modal';
        modal.style.cssText = 'z-index: 10001;';
        modal.innerHTML = `
            <div class="wa-modal-content elite-modal glass-panel" style="max-width: 400px; height: 500px; display: flex; flex-direction: column;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-earth-africa"></i> اختر الدولة</h3>
                    <button class="modal-close" id="close-country-selector"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="modal-body" style="overflow-y: auto; flex: 1; padding: 1rem;">
                    ${ARABIC_COUNTRIES.map(c => `
                        <div class="country-item" data-code="${c.code}" style="
                            padding: 12px 20px; 
                            margin-bottom: 8px; 
                            background: rgba(255,255,255,0.03); 
                            border-radius: 14px; 
                            cursor: pointer; 
                            display: flex; 
                            justify-content: space-between;
                            align-items: center;
                            transition: all 0.2s;
                            border: 1px solid rgba(255,255,255,0.05);
                        " onmouseover="this.style.background='rgba(255,215,0,0.1)'; this.style.borderColor='rgba(255,215,0,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='rgba(255,255,255,0.05)'">
                            <span style="font-weight: 600;">${c.name}</span>
                            <span style="color: var(--metallic-gold); font-weight: 800; font-family: 'Orbitron', sans-serif;">+${c.code}</span>
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

        if (countrySelect) {
            countrySelect.onclick = () => {
                openCountrySelector((country) => {
                    selectedDialerCountry = country;
                    innerContainer.querySelector('#dialer-screen-container').innerHTML = renderDialerScreen();
                    attachDialerEvents(innerContainer);
                });
            };
        }
    };

    attachDialerEvents(container);

    // Contact List Actions
    container.querySelectorAll('.contact-card-item').forEach(item => {
        item.onclick = (e) => {
            if (e.target.closest('.action-btn')) return; // Ignore if clicking actions
            const phone = item.dataset.phone;
            const display = container.querySelector('#phone-display');
            display.value = phone;
            const formattedPhone = phone.startsWith('+') ? phone.slice(1) : (phone.startsWith('0') ? '2' + phone : phone);
            window.open(`https://wa.me/${formattedPhone}`, '_blank');
            Notifications.success(`فتح محادثة ${item.querySelector('h4').innerText}`);
        };

        item.querySelector('.edit-contact').onclick = (e) => {
            e.stopPropagation();
            const id = parseInt(item.dataset.id);
            const contact = contacts.find(c => c.id === id);
            if (contact) {
                editingContactId = id;
                container.querySelector('#modal-title').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل جهة اتصال`;
                container.querySelector('#new-contact-name').value = contact.name;
                
                // Try to separate country code
                let phone = contact.phone;
                if (phone.startsWith('+')) {
                    const country = ARABIC_COUNTRIES.find(c => phone.startsWith('+' + c.code));
                    if (country) {
                        selectedContactCountry = country;
                        phone = phone.replace('+' + country.code, '');
                        container.querySelector('#contact-country-select').innerText = `+${country.code}`;
                    }
                }
                container.querySelector('#new-contact-phone').value = phone;
                container.querySelector('#contact-modal').style.display = 'flex';
            }
        };

        item.querySelector('.delete-contact').onclick = (e) => {
            e.stopPropagation();
            if (confirm('هل أنت متأكد من حذف هذه الجهة؟')) {
                const id = parseInt(item.dataset.id);
                const idx = contacts.findIndex(c => c.id === id);
                if (idx > -1) {
                    contacts.splice(idx, 1);
                    Storage.set('whatsapp_hub_contacts', contacts);
                    renderWhatsAppHub().then(newCont => container.replaceWith(newCont));
                    Notifications.success('تم الحذف بنجاح');
                }
            }
        };
    });

    container.querySelectorAll('.lead-pick-item').forEach(item => {
        item.onclick = () => {
            container.querySelector('#phone-display').value = item.dataset.phone;
            Notifications.success('تم اختيار العميل للاتصال');
        };
    });

    const sendWhatsApp = (isBusiness = false) => {
        const display = container.querySelector('#phone-display');
        let phone = display.value.replace(/\D/g, ''); // Simplified cleaning
        if (!phone) return Notifications.error('يرجى إدخال رقم هاتف');
        
        let finalPhone = phone;
        if (!display.value.startsWith('+')) {
            if (phone.startsWith('0')) phone = phone.slice(1);
            finalPhone = selectedDialerCountry.code + phone;
        }

        const baseUrl = isBusiness ? 'https://api.whatsapp.com/send' : 'https://wa.me';
        const url = `${baseUrl}/${finalPhone}`;
        
        window.open(url, '_blank');
        Notifications.success(isBusiness ? 'جاري التحويل لواتساب بيزنس...' : 'جاري التحويل لواتساب...');
    };

    container.querySelector('#send-whatsapp').onclick = () => sendWhatsApp(false);
    container.querySelector('#send-whatsapp-business').onclick = () => sendWhatsApp(true);

    // Modal Actions
    const closeModal = () => {
        container.querySelector('#contact-modal').style.display = 'none';
        editingContactId = null;
        container.querySelector('#new-contact-name').value = '';
        container.querySelector('#new-contact-phone').value = '';
    };

    container.querySelector('#add-contact').onclick = () => {
        editingContactId = null;
        container.querySelector('#modal-title').innerHTML = `<i class="fa-solid fa-user-plus"></i> إضافة جهة اتصال`;
        container.querySelector('#new-contact-name').value = '';
        container.querySelector('#new-contact-phone').value = '';
        container.querySelector('#contact-modal').style.display = 'flex';
    };

    container.querySelector('.modal-close').onclick = closeModal;
    container.querySelector('#cancel-contact').onclick = closeModal;

    container.querySelector('#contact-country-select').onclick = () => {
        openCountrySelector((country) => {
            selectedContactCountry = country;
            container.querySelector('#contact-country-select').innerText = `+${country.code}`;
        });
    };

    container.querySelector('#save-contact').onclick = () => {
        const name = container.querySelector('#new-contact-name').value.trim();
        let phone = container.querySelector('#new-contact-phone').value.trim();
        
        if (name && phone) {
            if (phone.startsWith('0')) phone = phone.slice(1);
            const fullPhone = '+' + selectedContactCountry.code + phone;

            if (editingContactId) {
                const idx = contacts.findIndex(c => c.id === editingContactId);
                if (idx > -1) contacts[idx] = { ...contacts[idx], name, phone: fullPhone };
            } else {
                contacts.push({ id: Date.now(), name, phone: fullPhone });
            }

            Storage.set('whatsapp_hub_contacts', contacts);
            renderWhatsAppHub().then(newCont => container.replaceWith(newCont));
            Notifications.success(editingContactId ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح');
            closeModal();
        } else {
            Notifications.error('يرجى التأكد من ادخال البيانات');
        }
    };

    return container;
}

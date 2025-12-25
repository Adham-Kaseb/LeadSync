import { Storage, Utils, Notifications, EventBus } from './core.js';

const State = {
    leads: [],
    loaded: false,
    filter: '',
    
    load() {
        this.leads = Storage.getList('leads_data') || [];
        this.loaded = true;
    },
    
    save() {
        const success = Storage.saveList('leads_data', this.leads);
        if (!success) {
            this.load();
            return false;
        }
        return true;
    },

    getFiltered() {
        if (!this.filter) return [...this.leads].reverse();
        const term = this.filter.toLowerCase();
        return this.leads.filter(l => 
            l.name.toLowerCase().includes(term) || 
            (l.phone && l.phone.includes(term)) ||
            (l.id && l.id.toLowerCase().includes(term))
        ).reverse();
    },

    add(lead) {
        if (!this.loaded) this.load();
        this.leads.push(lead);
        if (this.save()) {
            Notifications.success('تم إضافة العميل بنجاح');
            return true;
        } else {
            return false;
        }
    },

    update(lead) {
        if (!this.loaded) this.load();
        const index = this.leads.findIndex(l => l.id === lead.id);
        if (index > -1) {
            const oldLead = this.leads[index];
            this.leads[index] = lead;
            if (this.save()) {
                Notifications.success('تم تعديل بيانات العميل');
                return true;
            } else {
                this.leads[index] = oldLead; 
                return false;
            }
        }
        return false;
    },

    delete(id) {
        if (!this.loaded) this.load();
        const oldList = this.leads;
        this.leads = this.leads.filter(l => l.id !== id);
        if (this.save()) {
            Notifications.warning('تم حذف العميل');
            return true;
        } else {
            this.leads = oldList;
            return false;
        }
    }
};

const DOM = {
    injectStyles() {
        // Styles moved to leads.css
    },

    renderAnalytics() {
        const leads = State.leads;
        const total = leads.length;
        const purchased = leads.filter(l => l.status === 'purchased').length;
        const followup = leads.filter(l => l.status === 'followup').length;
        const lost = leads.filter(l => l.status === 'lost').length;
        const convRate = total > 0 ? ((purchased / total) * 100).toFixed(1) : 0;

        return `
            <div class="leads-analytics-bar">
                <div class="analytic-card">
                    <div class="analytic-icon"><i class="fa-solid fa-users"></i></div>
                    <div class="analytic-info">
                        <span class="value">${total}</span>
                        <span class="label">إجمالي العملاء</span>
                    </div>
                </div>
                <div class="analytic-card">
                    <div class="analytic-icon" style="background:rgba(46, 204, 113, 0.1); color:#2ecc71;"><i class="fa-solid fa-chart-line"></i></div>
                    <div class="analytic-info">
                        <span class="value">${convRate}%</span>
                        <span class="label">معدل التحويل</span>
                    </div>
                </div>
                <div class="analytic-card">
                    <div class="analytic-icon" style="background:rgba(241, 196, 15, 0.1); color:#f1c40f;"><i class="fa-solid fa-hourglass-half"></i></div>
                    <div class="analytic-info">
                        <span class="value">${followup}</span>
                        <span class="label">في المتابعة</span>
                    </div>
                </div>
                <div class="analytic-card">
                    <div class="analytic-icon" style="background:rgba(231, 76, 60, 0.1); color:#e74c3c;"><i class="fa-solid fa-user-xmark"></i></div>
                    <div class="analytic-info">
                        <span class="value">${lost}</span>
                        <span class="label">خسارة</span>
                    </div>
                </div>
            </div>
        `;
    },

    createCard(lead) {
        const card = document.createElement('div');
        card.className = 'lead-card glass-panel';
        card.dataset.id = lead.id;
        
        const statusBadge = this.getStatusBadge(lead.status);
        const sourceIcon = this.getSourceIcon(lead.source);
        const dateStr = Utils.formatDate(lead.timestamp);

        const avatar = lead.image 
            ? `<img src="${lead.image}" style="width:100%; height:100%; object-fit:cover;">` 
            : `<h2 style="margin:0; color:var(--metallic-gold); font-size: 1.8rem; font-weight:800;">${lead.name.charAt(0).toUpperCase()}</h2>`;

        card.innerHTML = `
            <div class="card-actions">
                <div class="action-btn-circle edit" data-action="edit" title="تعديل"><i class="fa-solid fa-pen"></i></div>
                <div class="action-btn-circle delete" data-action="delete" title="حذف"><i class="fa-solid fa-trash"></i></div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                 <div style="display:flex; gap:0.5rem; align-items:center;">${statusBadge}</div>
                 <div style="font-size: 0.7rem; color: var(--text-secondary); opacity: 0.6;">
                    <i class="fa-regular fa-id-badge"></i> #${lead.id.slice(-4)}
                 </div>
            </div>

            <div style="display:flex; align-items:center; gap:1.2rem; margin-bottom:1.8rem;">
                <div style="position:relative;">
                    <div style="width:85px; height:85px; border-radius:20px; background:#111; display:flex; justify-content:center; align-items:center; border:2px solid var(--metallic-gold); overflow:hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.5); transform: rotate(-3deg);">
                        <div style="width:100%; height:100%; transform: rotate(3deg); display:flex; justify-content:center; align-items:center;">
                            ${avatar}
                        </div>
                    </div>
                </div>
                <div style="flex:1;">
                    <h3 style="margin:0; font-size:1.3rem; font-weight:800; color:#fff; letter-spacing: -0.5px;">${lead.name}</h3>
                    <div style="font-size: 0.75rem; color: var(--metallic-gold); margin-top: 6px; display:flex; align-items:center; gap:6px; opacity:0.8;">
                        <i class="fa-regular fa-calendar-check" style="font-size:0.85rem;"></i> ${dateStr}
                    </div>
                </div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div class="info-row"><i class="fa-solid fa-graduation-cap"></i> <span>${lead.course || 'غير محدد'}</span></div>
                <div class="info-row"><i class="fa-solid fa-phone"></i> <span style="direction:ltr; font-family:monospace; font-weight:700;">${lead.phone || '-'}</span></div>
                <div class="info-row"><i class="${sourceIcon}"></i> <span>${lead.source || 'غير محدد'}</span></div>
                ${lead.email ? `<div class="info-row"><i class="fa-solid fa-envelope"></i> <span style="font-size:0.8rem; opacity:0.8;">${lead.email}</span></div>` : ''}
            </div>

            ${lead.notes ? `
                <div class="lead-notes-preview">
                     <i class="fa-solid fa-quote-right" style="position:absolute; top:8px; left:10px; opacity:0.1; font-size:1.5rem;"></i>
                     <span style="position:relative; z-index:1;">${lead.notes}</span>
                </div>
            ` : ''}

            <div class="direct-actions">
                <button class="direct-btn wa" data-action="whatsapp" data-phone="${lead.phone}">
                    <i class="fa-brands fa-whatsapp"></i> واتساب
                </button>
                <button class="direct-btn wb" data-action="whatsapp-biz" data-phone="${lead.phone}">
                    <i class="fa-solid fa-briefcase"></i> بيزنس
                </button>
            </div>
        `;
        return card;
    },

    getStatusBadge(status) {
        const config = {
            'purchased': { color: '#2ecc71', text: 'تم الشراء', icon: 'fa-check-circle' },
            'lost': { color: '#e74c3c', text: 'لم يشتري', icon: 'fa-times-circle' },
            'followup': { color: '#f1c40f', text: 'متابعة', icon: 'fa-spinner' },
            'default': { color: '#3498db', text: 'جديد', icon: 'fa-star' }
        };
        const s = config[status] || config['default'];
        return `<span style="background:${s.color}20; color:${s.color}; padding:2px 8px; border-radius:12px; font-size:0.7rem; border:1px solid ${s.color}40; display:flex; align-items:center; gap:4px;">
                <i class="fa-solid ${s.icon}"></i> ${s.text}</span>`;
    },

    getSourceIcon(source) {
        if(!source) return 'fa-solid fa-circle';
        const s = source.toLowerCase();
        if(s.includes('facebook') || s.includes('فيسبوك')) return 'fa-brands fa-facebook';
        if(s.includes('twitter') || s.includes('x')) return 'fa-brands fa-twitter';
        if(s.includes('instagram')) return 'fa-brands fa-instagram';
        if(s.includes('whatsapp')) return 'fa-brands fa-whatsapp';
        if(s.includes('linkedin')) return 'fa-brands fa-linkedin';
        return 'fa-solid fa-globe';
    },

    renderGrid(containerRef, leads) {
        const grid = typeof containerRef === 'string' 
            ? document.getElementById(containerRef) 
            : containerRef;
        if(!grid) return;
        
        // Update analytics if they exist
        const analyticsContainer = document.getElementById('leads-analytics-container');
        if (analyticsContainer) {
            analyticsContainer.innerHTML = this.renderAnalytics();
        }

        grid.innerHTML = '';
        if (leads.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-users-slash" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>لا يوجد عملاء مطابقين للبحث</p>
                </div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        leads.forEach(lead => fragment.appendChild(this.createCard(lead)));
        grid.appendChild(fragment);
    },

    openModal(editingLead = null) {
        const existing = document.querySelector('.modal-overlay');
        if(existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const currentImage = editingLead ? editingLead.image : '';

        overlay.innerHTML = `
            <div class="modal-container glass-panel">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fa-solid fa-user-plus"></i>
                        <span>${editingLead ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</span>
                    </h2>
                </div>
                
                <div style="text-align:center; margin-bottom:2rem; position:relative;">
                    <div style="width:100px; height:100px; margin:0 auto 1rem; border-radius:24px; background:rgba(255,255,255,0.03); border:2px dashed rgba(255,215,0,0.3); display:flex; justify-content:center; align-items:center; overflow:hidden;">
                        <img id="preview-img" src="${currentImage || ''}" style="${currentImage ? 'width:100%; height:100%; object-fit:cover;' : 'display:none;'}">
                        ${!currentImage ? '<i class="fa-solid fa-user" style="font-size:2.5rem; color:rgba(255,255,255,0.1);"></i>' : ''}
                    </div>
                    <label for="l-image-file" class="btn btn-glass" style="cursor:pointer; font-size: 0.85rem; padding: 8px 16px; border-radius: 10px;">
                        <i class="fa-solid fa-camera"></i> ${currentImage ? 'تغيير الصورة' : 'رفع صورة'}
                    </label>
                    <input type="file" id="l-image-file" accept="image/*" style="display:none;">
                    <p id="img-processing-status" style="font-size:0.7rem; color:var(--metallic-gold); margin-top:5px; display:none;">جاري معالجة الصورة...</p>
                </div>

                <form id="lead-form" style="display:grid; gap:1.2rem;">
                    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.2rem;">
                        <input id="l-name" class="glass-input" placeholder="الاسم *" required value="${editingLead ? editingLead.name : ''}">
                        <select id="l-status" class="glass-input">
                            <option value="new" ${(!editingLead || editingLead.status === 'new') ? 'selected' : ''}>🔵 جديد</option>
                            <option value="followup" ${editingLead?.status === 'followup' ? 'selected' : ''}>🟡 متابعة</option>
                            <option value="purchased" ${editingLead?.status === 'purchased' ? 'selected' : ''}>🟢 تم الشراء</option>
                            <option value="lost" ${editingLead?.status === 'lost' ? 'selected' : ''}>🔴 لم يشتري</option>
                        </select>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.2rem;">
                         <input id="l-phone" class="glass-input" placeholder="رقم الهاتف" value="${editingLead ? editingLead.phone || '' : ''}">
                         <input id="l-email" class="glass-input" placeholder="البريد الإلكتروني" value="${editingLead ? editingLead.email || '' : ''}">
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.2rem;">
                        <input id="l-course" class="glass-input" placeholder="الكورس / المسار" value="${editingLead ? editingLead.course || '' : ''}">
                        <select id="l-source" class="glass-input">
                            <option value="الفيسبوك" ${editingLead?.source === 'الفيسبوك' ? 'selected' : ''}>الفيسبوك</option>
                            <option value="لينكد إن" ${editingLead?.source === 'لينكد إن' ? 'selected' : ''}>لينكد إن</option>
                            <option value="واتساب" ${editingLead?.source === 'واتساب' ? 'selected' : ''}>واتساب</option>
                            <option value="انستجرام" ${editingLead?.source === 'انستجرام' ? 'selected' : ''}>انستجرام</option>
                            <option value="آخر" ${(!editingLead || editingLead.source === 'آخر') ? 'selected' : ''}>آخر</option>
                        </select>
                    </div>

                    <textarea id="l-notes" class="glass-input" rows="3" placeholder="ملاحظات..." style="resize:none;">${editingLead ? editingLead.notes || '' : ''}</textarea>
                    
                    <div style="display:flex; justify-content:center; gap:1rem; margin-top:1.5rem;">
                        <button type="submit" id="save-btn" class="btn btn-primary" style="width:140px; height:48px; font-size:1.1rem;">حفظ</button>
                        <button type="button" id="cancel-btn" class="btn btn-secondary" style="width:140px; height:48px; background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); font-size:1.1rem;">إلغاء</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        Utils.initCustomSelect(overlay.querySelector('#l-status'));
        Utils.initCustomSelect(overlay.querySelector('#l-source'));

        const form = overlay.querySelector('#lead-form');
        const preview = overlay.querySelector('#preview-img');
        const processingStatus = overlay.querySelector('#img-processing-status');
        const saveBtn = overlay.querySelector('#save-btn');
        let imgData = currentImage;
        let isProcessing = false;

        overlay.querySelector('#l-image-file').onchange = (e) => {
            const file = e.target.files[0];
            if(file) {
                isProcessing = true;
                saveBtn.disabled = true;
                processingStatus.style.display = 'block';
                processingStatus.textContent = 'جاري ضغط الصورة...';

                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const elem = document.createElement('canvas');
                        const maxWidth = 128; 
                        const maxHeight = 128;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > maxWidth) {
                                height *= maxWidth / width;
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width *= maxHeight / height;
                                height = maxHeight;
                            }
                        }

                        elem.width = width;
                        elem.height = height;
                        const ctx = elem.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        imgData = elem.toDataURL('image/jpeg', 0.7);
                        preview.src = imgData;
                        preview.style.display = 'block';
                        isProcessing = false;
                        saveBtn.disabled = false;
                        processingStatus.style.display = 'none';
                    };
                };
            }
        };

        overlay.querySelector('#cancel-btn').onclick = () => overlay.remove();

        form.onsubmit = (e) => {
            e.preventDefault();
            if (isProcessing) {
                Notifications.warning('يرجى انتظار معالجة الصورة');
                return;
            }

            const name = overlay.querySelector('#l-name').value;
            if(!name) { Notifications.warning('الاسم مطلوب'); return; }

            const leadData = {
                id: editingLead ? editingLead.id : Utils.generateId(),
                name,
                status: overlay.querySelector('#l-status').value,
                phone: overlay.querySelector('#l-phone').value,
                email: overlay.querySelector('#l-email').value,
                course: overlay.querySelector('#l-course').value,
                source: overlay.querySelector('#l-source').value,
                image: imgData,
                notes: overlay.querySelector('#l-notes').value,
                timestamp: editingLead ? editingLead.timestamp : new Date().toISOString()
            };

            let success = false;
            if(editingLead) {
                success = State.update(leadData);
            } else {
                success = State.add(leadData);
            }

            if (success) {
                overlay.remove();
                DOM.renderGrid('leads-grid-container', State.getFiltered());
            }
        };
    }
};

export function renderLeads() {
    DOM.injectStyles();
    State.load(); 

    const container = document.createElement('div');
    
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h1 class="section-title">إدارة العملاء</h1>
        <button id="add-lead-btn" class="btn btn-primary"><i class="fa-solid fa-user-plus"></i> عميل جديد</button>
    `;
    container.appendChild(header);

    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex; gap:1rem; margin-bottom:2rem; flex-wrap:wrap;';
    
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'search-wrapper';
    searchWrapper.innerHTML = `
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" id="lead-search" class="glass-input" placeholder="بحث بالاسم، الهاتف، أو الـ ID (#abcd)...">
    `;
    
    const searchInput = searchWrapper.querySelector('input');
    toolbar.appendChild(searchWrapper);
    container.appendChild(toolbar);

    const analyticsRow = document.createElement('div');
    analyticsRow.id = 'leads-analytics-container';
    analyticsRow.innerHTML = DOM.renderAnalytics();
    container.appendChild(analyticsRow);

    const grid = document.createElement('div');
    grid.className = 'leads-grid';
    grid.id = 'leads-grid-container';
    container.appendChild(grid);

    DOM.renderGrid(grid, State.getFiltered());

    searchInput.addEventListener('input', Utils.debounce((e) => {
        State.filter = e.target.value;
        DOM.renderGrid('leads-grid-container', State.getFiltered());
    }, 300));

    header.querySelector('#add-lead-btn').onclick = () => DOM.openModal();

    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.action-btn-circle, .direct-btn');
        if(!btn) return;
        
        const card = btn.closest('.lead-card');
        if(!card) return;
        
        const id = card.dataset.id;
        const action = btn.dataset.action;
        const lead = State.leads.find(l => l.id === id);

        if (action === 'delete') {
            if(confirm('حذف هذا العميل؟')) {
                State.delete(id);
                DOM.renderGrid('leads-grid-container', State.getFiltered());
            }
        } else if (action === 'edit') {
            if (lead) DOM.openModal(lead);
        } else if (action === 'whatsapp' || action === 'whatsapp-biz') {
            const phone = btn.dataset.phone;
            if (!phone) { Notifications.warning('رقم الهاتف غير موجود'); return; }
            const cleanPhone = phone.replace(/\D/g, '');
            const baseUrl = action === 'whatsapp-biz' ? 'https://api.whatsapp.com/send' : 'https://wa.me';
            window.open(`${baseUrl}/${cleanPhone}`, '_blank');
        }
    });

    return container;
}

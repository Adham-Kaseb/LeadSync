import { Storage, Utils } from './core.js';

export function renderMessages() {
        const container = document.createElement('div');
        
        let isDragLocked = Storage.get('message_drag_locked') === true; 
        let currentHeight = Storage.get('message_card_height') || 'auto'; 

        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <h1 class="section-title">قوالب الرسائل</h1>
            <div style="display:flex; gap:10px; align-items: center;">
                <div class="view-controls" style="display:flex; gap:4px; background:rgba(0,0,0,0.2); padding:4px; border-radius:30px; border:1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);">
                    <button id="height-160" title="صغير (160px)" class="btn-icon" style="width:30px; height:30px; border-radius:50%; border:none; background:transparent; color:rgba(255,255,255,0.5); cursor:pointer; display:flex; align-items:center; justify-content:center; transition: all 0.2s;"><i class="fa-solid fa-compress" style="font-size: 0.85rem;"></i></button>
                    <button id="height-260" title="متوسط (260px)" class="btn-icon" style="width:30px; height:30px; border-radius:50%; border:none; background:transparent; color:rgba(255,255,255,0.5); cursor:pointer; display:flex; align-items:center; justify-content:center; transition: all 0.2s;"><i class="fa-solid fa-expand" style="font-size: 0.85rem;"></i></button>
                    <button id="height-auto" title="كامل" class="btn-icon active" style="width:30px; height:30px; border-radius:50%; border:none; background:var(--metallic-gold); color:#000; cursor:pointer; display:flex; align-items:center; justify-content:center; transition: all 0.2s;"><i class="fa-solid fa-maximize" style="font-size: 0.85rem;"></i></button>
                </div>
                
                <div style="width: 1px; height: 25px; background: rgba(255,255,255,0.1); margin: 0 5px;"></div>

                <button id="lock-drag-btn" class="btn btn-secondary" title="قفل السحب" style="border-radius:50%; width:40px; height:40px; padding:0; display:flex; align-items:center; justify-content:center;">
                    <i class="fa-solid fa-lock-open"></i>
                </button>
                <button id="add-template-btn" class="btn btn-primary"><i class="fa-solid fa-plus"></i>رسالة جديدة</button>
            </div>
        `;
        container.appendChild(header);

        const heightBtns = {
            '160': header.querySelector('#height-160'),
            '260': header.querySelector('#height-260'),
            'auto': header.querySelector('#height-auto')
        };

        const updateHeight = (h) => {
            currentHeight = h;
            Storage.set('message_card_height', h);
            Object.values(heightBtns).forEach(btn => {
                btn.style.background = 'transparent';
                btn.style.color = 'rgba(255,255,255,0.5)';
                btn.classList.remove('active');
            });
            const activeBtn = heightBtns[h === 'full' ? 'auto' : h]; 
            if(activeBtn) {
                activeBtn.style.background = 'var(--metallic-gold)';
                activeBtn.style.color = '#000';
                activeBtn.classList.add('active');
            }

            const val = h === 'auto' ? 'none' : h + 'px';
            document.querySelectorAll('.message-body-content').forEach(el => {
                el.style.maxHeight = val;
                el.style.height = h === 'auto' ? 'auto' : val;
                el.style.overflowY = h === 'auto' ? 'visible' : 'auto';
            });
        };

        heightBtns['160'].onclick = () => updateHeight('160');
        heightBtns['260'].onclick = () => updateHeight('260');
        heightBtns['auto'].onclick = () => updateHeight('auto');

        // Apply initial height style to buttons and existing elements
        setTimeout(() => updateHeight(currentHeight), 0);

        const lockBtn = header.querySelector('#lock-drag-btn');
        const updateLockUI = () => {
            lockBtn.innerHTML = isDragLocked ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>';
            lockBtn.style.color = isDragLocked ? '#ff4d4d' : 'inherit';
            lockBtn.style.borderColor = isDragLocked ? '#ff4d4d' : 'rgba(255,255,255,0.1)';
            
            document.querySelectorAll('.message-card').forEach(card => {
                card.setAttribute('draggable', !isDragLocked);
                card.style.cursor = isDragLocked ? 'default' : 'grab';
            });
        };

        lockBtn.onclick = () => {
            isDragLocked = !isDragLocked;
            Storage.set('message_drag_locked', isDragLocked);
            updateLockUI();
        };

        // Apply initial lock state
        setTimeout(() => updateLockUI(), 0);

        const catSidebar = document.createElement('div');
        catSidebar.className = 'categories-nav';
        catSidebar.style.display = 'flex';
        catSidebar.style.alignItems = 'center';
        catSidebar.style.gap = '12px';
        catSidebar.style.overflowX = 'auto';
        catSidebar.style.padding = '10px 0';
        catSidebar.style.marginBottom = '2rem';
        catSidebar.style.scrollbarWidth = 'none'; // Firefox
        catSidebar.style.msOverflowStyle = 'none'; // IE/Edge
        catSidebar.style.width = '100%';
        catSidebar.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

        const defaultCategories = [
            { id: 'all', name: 'الكل', icon: 'fa-folder' },
            { id: 'replies', name: 'ردود العملاء', icon: 'fa-user-group' },
            { id: 'offers', name: 'العروض', icon: 'fa-tags' },
            { id: 'alerts', name: 'تنبيهات', icon: 'fa-bell' },
            { id: 'evening', name: 'بعد الرابعة مساءََ', icon: 'fa-moon' },
            { id: 'notes', name: 'ملاحظات', icon: 'fa-note-sticky' },
            { id: 'followup', name: 'متابعة', icon: 'fa-list-check' },
            { id: 'motivational', name: 'ردود تشجيعية', icon: 'fa-thumbs-up' },
            { id: 'haram', name: 'حرام بلير', icon: 'fa-ban' }
        ];

        let categories = Storage.getList('message_categories');
        if(categories.length === 0) {
            categories = defaultCategories;
            Storage.saveList('message_categories', categories);
        }

        let activeCategory = Storage.get('active_message_category') || 'الكل'; 
        // Ensure the active category still exists in the categories list
        if (activeCategory !== 'الكل' && categories.length > 0 && !categories.find(c => c.name === activeCategory)) {
            activeCategory = 'الكل';
            Storage.set('active_message_category', 'الكل');
        }

        const templatesGrid = document.createElement('div');
        templatesGrid.style.display = 'grid';
        templatesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        templatesGrid.style.gap = '1.5rem';
        templatesGrid.style.alignContent = 'start';

        function renderCategories() {
            catSidebar.innerHTML = `
                <button id="manage-cats-btn" class="btn-icon" title="إدارة التصنيفات" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:var(--text-secondary); cursor:pointer; min-width: 40px; height: 40px; border-radius: 10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="fa-solid fa-cog"></i>
                </button>
            `;
            
            const allBtn = document.createElement('div');
            allBtn.setAttribute('draggable', 'true');
            allBtn.dataset.name = 'الكل';
            allBtn.style.padding = '8px 20px';
            allBtn.style.borderRadius = '30px';
            allBtn.style.cursor = 'grab';
            allBtn.style.fontWeight = 'bold';
            allBtn.style.fontSize = '0.95rem';
            allBtn.style.whiteSpace = 'nowrap';
            allBtn.style.flexShrink = '0';
            allBtn.style.transition = 'all 0.3s ease';
            allBtn.style.border = '1px solid transparent';
            
            if (activeCategory === 'الكل') {
                allBtn.style.background = 'var(--metallic-gold)';
                allBtn.style.color = '#000';
                allBtn.innerHTML = `<i class="fa-solid fa-folder-open"></i> الكل`;
            } else {
                allBtn.style.background = 'rgba(255,255,255,0.05)';
                allBtn.style.color = 'var(--text-primary)';
                allBtn.style.borderColor = 'rgba(255,255,255,0.1)';
                allBtn.innerHTML = `الكل`;
            }
            allBtn.onclick = () => { 
                activeCategory = 'الكل'; 
                Storage.set('active_message_category', 'الكل');
                renderCategories(); 
                renderTemplates(); 
            };
            
            // Drag Events for "All"
            allBtn.addEventListener('dragstart', (e) => {
                allBtn.classList.add('dragging-cat');
                e.dataTransfer.setData('text/plain', 'الكل');
                // Prevent children from intercepting events
                allBtn.querySelectorAll('*').forEach(child => child.style.pointerEvents = 'none');
                setTimeout(() => allBtn.style.opacity = '0.4', 0);
            });
            allBtn.addEventListener('dragend', () => {
                allBtn.classList.remove('dragging-cat');
                allBtn.style.opacity = '1';
                allBtn.querySelectorAll('*').forEach(child => child.style.pointerEvents = 'auto');
            });

            catSidebar.appendChild(allBtn);

            // Directly append other categories as siblings to allBtn
            categories.filter(c => c.name !== 'الكل').forEach(cat => {
                const li = document.createElement('div');
                li.className = 'cat-pill';
                li.setAttribute('draggable', 'true');
                li.dataset.id = cat.id;
                li.dataset.name = cat.name;
                li.style.padding = '8px 20px';
                li.style.cursor = 'grab';
                li.style.borderRadius = '30px';
                li.style.transition = 'all 0.3s ease';
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.gap = '10px';
                li.style.fontSize = '0.95rem';
                li.style.whiteSpace = 'nowrap';
                li.style.flexShrink = '0';
                li.style.border = '1px solid transparent';
                
                const isActive = activeCategory === cat.name;
                li.style.color = isActive ? 'var(--metallic-gold)' : 'var(--text-secondary)';
                li.style.background = isActive ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.05)';
                li.style.borderColor = isActive ? 'var(--metallic-gold)' : 'rgba(255,255,255,0.1)';
                li.style.fontWeight = isActive ? 'bold' : 'normal';
                
                li.innerHTML = `
                    <i class="fa-solid ${cat.icon || 'fa-folder'}"></i>
                    <span>${cat.name}</span>
                `;
                
                li.onclick = () => {
                    activeCategory = cat.name;
                    Storage.set('active_message_category', cat.name);
                    renderCategories();
                    renderTemplates();
                };

                // Drag Events
                li.addEventListener('dragstart', (e) => {
                    li.classList.add('dragging-cat');
                    e.dataTransfer.setData('text/plain', cat.id);
                    // Prevent children from intercepting events
                    li.querySelectorAll('*').forEach(child => child.style.pointerEvents = 'none');
                    setTimeout(() => li.style.opacity = '0.4', 0);
                });

                li.addEventListener('dragend', () => {
                    li.classList.remove('dragging-cat');
                    li.style.opacity = '1';
                    li.querySelectorAll('*').forEach(child => child.style.pointerEvents = 'auto');
                });
                
                if(!isActive) {
                    li.onmouseover = () => { 
                        li.style.background = 'rgba(255,255,255,0.1)'; 
                        li.style.color = '#fff'; 
                        li.style.borderColor = 'rgba(255,255,255,0.2)';
                    };
                    li.onmouseout = () => { 
                        li.style.background = 'rgba(255,255,255,0.05)'; 
                        li.style.color = 'var(--text-secondary)'; 
                        li.style.borderColor = 'rgba(255,255,255,0.1)';
                    };
                }

                catSidebar.appendChild(li);
            });

            // Container Drag Over
            catSidebar.ondragover = (e) => {
                e.preventDefault();
                const dragging = document.querySelector('.dragging-cat');
                if (!dragging) return;

                // Auto-scroll logic for horizontal container
                const rect = catSidebar.getBoundingClientRect();
                const x = e.clientX;
                const threshold = 60;
                const scrollSpeed = 15;
                
                if (x < rect.left + threshold) {
                    catSidebar.scrollLeft -= scrollSpeed;
                } else if (x > rect.right - threshold) {
                    catSidebar.scrollLeft += scrollSpeed;
                }

                const afterElement = getDragAfterElementHorizontal(catSidebar, e.clientX);
                if (afterElement == null) {
                    catSidebar.appendChild(dragging);
                } else {
                    catSidebar.insertBefore(dragging, afterElement);
                }
            };

            catSidebar.ondrop = (e) => {
                e.preventDefault();
                // Get the current order from the DOM
                const currentOrderNames = [...catSidebar.querySelectorAll('[data-name]')].map(el => el.dataset.name);
                
                // Reconstruct the categories array based on the DOM order
                const newOrder = currentOrderNames.map(name => {
                    if (name === 'الكل') return { id: 'all', name: 'الكل', icon: 'fa-folder' };
                    return categories.find(c => c.name === name);
                }).filter(Boolean);

                categories = newOrder;
                Storage.saveList('message_categories', categories);
                // No need to re-render everything, we just re-sync the memory
                // but we call renderCategories to clear the dragging styles safely
                renderCategories();
            };

            catSidebar.querySelector('#manage-cats-btn').onclick = () => openCategoryManager();
        }

        function getDragAfterElementHorizontal(container, x) {
            const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging-cat)')];

            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const center = box.left + box.width / 2;
                const offset = x - center;

                // RTL Logic: We want the element that is logically "after" the cursor.
                // In RTL flex, logically "after" means visually to the LEFT.
                // So we look for elements whose center is to the LEFT of the cursor (offset > 0).
                if (offset > 0 && offset < closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.POSITIVE_INFINITY }).element;
        }

        function openCategoryManager() {
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
            modal.style.width = '500px';
            modal.style.padding = '2rem';
            modal.style.borderRadius = '16px';
            modal.style.background = '#151515';

            const renderManagerList = () => {
                const listHtml = categories.filter(c => c.name !== 'الكل').map(cat => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.05); margin-bottom:8px; border-radius:8px;">
                        <div style="display:flex; align-items:center; gap:10px; flex-grow: 1;">
                            <i class="fa-solid ${cat.icon}" style="color:var(--metallic-gold);"></i>
                            <div style="position: relative; flex-grow: 1;">
                                <input type="text" 
                                    class="cat-name-input" 
                                    data-id="${cat.id}" 
                                    data-original-name="${cat.name}" 
                                    value="${cat.name}" 
                                    style="
                                        background: rgba(0,0,0,0.2); 
                                        border: 1px solid rgba(255,255,255,0.1); 
                                        color: #fff; 
                                        font-family: inherit; 
                                        font-size: 0.95rem; 
                                        width: 100%; 
                                        outline: none; 
                                        border-radius: 6px;
                                        padding: 6px 10px 6px 30px; 
                                        transition: all 0.2s;
                                    "
                                    onfocus="this.style.borderColor='var(--metallic-gold)'; this.style.boxShadow='0 0 5px rgba(227, 185, 56, 0.2)'"
                                    onblur="this.style.borderColor='rgba(255,255,255,0.1)'; this.style.boxShadow='none'"
                                >
                                <i class="fa-solid fa-pen" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: rgba(255,255,255,0.3); pointer-events: none;"></i>
                            </div>
                        </div>
                        <button class="btn-icon delete-cat" data-id="${cat.id}" style="color:#ff4d4d; background:none; border:none; cursor:pointer; margin-right: 10px;"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `).join('');
                
                modal.innerHTML = `
                    <h2 style="margin-bottom:1.5rem;">إدارة التصنيفات</h2>
                    
                    <style>
                        .cat-list-scroll::-webkit-scrollbar { display: none; }
                        .cat-list-scroll { -ms-overflow-style: none; scrollbar-width: none; }
                    </style>

                    <div class="cat-list-scroll" style="max-height:300px; overflow-y:auto; margin-bottom:1.5rem;">
                        ${listHtml}
                    </div>
                    
                    <h3 style="margin-bottom:1rem; font-size:1rem;">إضافة تصنيف جديد</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr auto; gap:10px; align-items:center;">
                        <input type="text" id="new-cat-name" placeholder="اسم التصنيف" style="padding:10px; border-radius:8px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.05); color:#fff;">
                        <div class="custom-select-wrapper" id="icon-select-wrapper">
                            <div class="custom-select-trigger">
                                <span id="selected-icon-display"><i class="fa-solid fa-folder"></i> أيقونة</span>
                                <i class="fa-solid fa-chevron-down" style="font-size:0.8rem;"></i>
                            </div>
                            <div class="custom-options">
                                ${['fa-folder', 'fa-star', 'fa-heart', 'fa-bell', 'fa-check', 'fa-user', 'fa-tag', 'fa-layer-group', 'fa-briefcase', 'fa-bullhorn'].map(icon => `
                                    <div class="custom-option" data-value="${icon}"><i class="fa-solid ${icon}"></i></div>
                                `).join('')}
                            </div>
                        </div>
                        <button id="add-cat-btn" class="btn btn-primary" style="padding:10px 15px;"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div style="margin-top:2rem; text-align:right;">
                        <button id="close-manager" class="btn btn-secondary">إغلاق</button>
                    </div>
                `;

                const wrapper = modal.querySelector('#icon-select-wrapper');
                const trigger = modal.querySelector('.custom-select-trigger');
                const display = modal.querySelector('#selected-icon-display');
                let selectedIcon = 'fa-folder';

                trigger.onclick = () => wrapper.classList.toggle('open');
                modal.querySelectorAll('.custom-option').forEach(opt => {
                    opt.onclick = () => {
                        selectedIcon = opt.dataset.value;
                        display.innerHTML = `<i class="fa-solid ${selectedIcon}"></i>`;
                        wrapper.classList.remove('open');
                    };
                });

                modal.querySelectorAll('.delete-cat').forEach(btn => {
                    btn.onclick = () => {
                        if(confirm('حذف هذا التصنيف؟')) {
                            categories = categories.filter(c => c.id !== btn.dataset.id);
                            Storage.saveList('message_categories', categories);
                            renderManagerList();
                            renderCategories();
                        }
                    };
                });

                modal.querySelectorAll('.cat-name-input').forEach(input => {
                    input.onchange = (e) => {
                        const newName = e.target.value.trim();
                        const catId = e.target.dataset.id;
                        const oldName = e.target.dataset.originalName;

                        if (!newName || newName === oldName) {
                            e.target.value = oldName; 
                            return;
                        }

                        const catIndex = categories.findIndex(c => c.id === catId);
                        if (catIndex > -1) {
                            categories[catIndex].name = newName;
                            Storage.saveList('message_categories', categories);

                            const allMessages = Storage.getList('messages_data');
                            let updatedCount = 0;
                            const updatedMessages = allMessages.map(msg => {
                                if (msg.category === oldName) {
                                    updatedCount++;
                                    return { ...msg, category: newName };
                                }
                                return msg;
                            });
                            
                            if(updatedCount > 0) {
                                Storage.saveList('messages_data', updatedMessages);
                            }

                            if (activeCategory === oldName) {
                                activeCategory = newName;
                            }

                            renderCategories();
                            renderTemplates();
                            renderManagerList();
                        }
                    };
                });

                modal.querySelector('#add-cat-btn').onclick = () => {
                    const name = modal.querySelector('#new-cat-name').value;
                    if(!name) return;
                    categories.push({ id: Utils.generateId(), name, icon: selectedIcon });
                    Storage.saveList('message_categories', categories);
                    renderManagerList();
                    renderCategories();
                };
                
                modal.querySelector('#close-manager').onclick = () => overlay.remove();
            };

            renderManagerList();
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        }

        function renderTemplates() {
            templatesGrid.innerHTML = '';
            const allMessages = Storage.getList('messages_data');
            
            const filtered = activeCategory === 'الكل' 
                ? allMessages 
                : allMessages.filter(m => m.category === activeCategory);
                
            filtered.forEach((msg, idx) => { if (typeof msg.order === 'undefined') msg.order = idx; });
            
            filtered.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return a.order - b.order;
            });

            if (filtered.length === 0) {
                templatesGrid.innerHTML = `
                    <div style="column-span: all; text-align: center; padding: 4rem 2rem; color: var(--text-secondary); background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.1);">
                        <i class="fa-solid fa-feather" style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.3;"></i>
                        <p style="font-size: 1.1rem;">لا توجد قوالب في "${activeCategory}"</p>
                        <button class="btn btn-glass" style="margin-top: 1rem;" onclick="document.getElementById('add-template-btn').click()">إضافة رسالة جديدة</button>
                    </div>
                `;
                templatesGrid.style.display = 'block'; 
                return;
            } else {
                templatesGrid.style.display = 'grid'; 
                templatesGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
            }

            filtered.forEach((msg, index) => {
                const card = document.createElement('div');
                card.className = 'glass-card message-card';
                card.setAttribute('draggable', !isDragLocked);
                card.dataset.id = msg.id;
                
                if (msg.isPinned) {
                    card.style.border = '1px solid var(--metallic-gold)';
                    card.style.background = 'linear-gradient(145deg, rgba(255, 215, 0, 0.05) 0%, rgba(255,255,255,0.02) 100%)';
                } else {
                    card.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)';
                    card.style.border = '1px solid rgba(255,255,255,0.05)';
                }
                
                card.style.height = 'fit-content';
                card.style.marginBottom = '0';
                card.style.position = 'relative';
                card.style.transition = 'transform 0.2s, box-shadow 0.2s, background 0.2s';
                card.style.cursor = 'grab';

                card.innerHTML = `
                    <div class="card-drag-handle" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.8rem; opacity: 1;">
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span style="font-size: 0.8rem; color: rgba(255,255,255,0.3); font-family: monospace;">#${index + 1}</span>
                            <span style="font-size: 0.75rem; background: rgba(227, 185, 56, 0.15); color: var(--metallic-gold); padding: 3px 10px; border-radius: 20px; font-weight: bold; letter-spacing: 0.5px;">${msg.category}</span>
                        </div>
                        <div class="action-group" style="display:flex; gap:5px;">
                            <button class="action-btn pin ${msg.isPinned ? 'active' : ''} pin-msg" title="تثبيت" style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:var(--text-secondary); cursor:pointer; transition:all 0.2s; ${msg.isPinned ? 'color:var(--metallic-gold); border-color:rgba(227, 185, 56, 0.5); background:rgba(227, 185, 56, 0.15);' : ''}"><i class="fa-solid fa-thumbtack"></i></button>
                            <button class="action-btn edit edit-msg" title="تعديل" style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:var(--text-secondary); cursor:pointer; transition:all 0.2s;"><i class="fa-solid fa-pen"></i></button>
                            <button class="action-btn delete delete-msg" title="حذف" style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid rgba(255,77,77,0.3); background:rgba(255,77,77,0.05); color:#ff4d4d; cursor:pointer; transition:all 0.2s;"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    
                    <h3 style="margin-bottom: 0.8rem; font-size: 1.1rem; line-height: 1.4;">${msg.title} ${msg.isPinned ? '<i class="fa-solid fa-star gold-text" style="font-size:0.8rem; margin-right:5px;"></i>' : ''}</h3>
                    
                    <div class="message-body-content" style="
                        background: rgba(0,0,0,0.2); 
                        padding: 1rem; 
                        border-radius: 8px; 
                        font-size: 0.95rem; 
                        color: rgba(255,255,255,0.8); 
                        margin-bottom: 1.2rem; 
                        white-space: pre-wrap; 
                        line-height: 1.6;
                        border-right: 3px solid rgba(255,255,255,0.1);
                        overflow-wrap: break-word;
                        word-break: break-word;
                        height: ${currentHeight === 'auto' ? 'auto' : currentHeight + 'px'};
                        overflow-y: ${currentHeight === 'auto' ? 'visible' : 'auto'};
                    ">${msg.body}</div>
                    
                    <button class="btn btn-glass copy-btn" data-text="${encodeURIComponent(msg.body)}" style="width: 100%; font-size: 0.9rem; justify-content: center;">
                        <i class="fa-regular fa-copy"></i> نسخ النص
                    </button>
                `;

                card.onmouseenter = () => {
                    if(!msg.isPinned) {
                        card.style.transform = 'translateY(-3px)';
                        card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
                        card.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)';
                    } else {
                        card.style.transform = 'translateY(-3px)';
                        card.style.boxShadow = '0 10px 20px rgba(227, 185, 56, 0.1)';
                    }
                };
                card.onmouseleave = () => {
                    card.style.transform = 'none';
                    card.style.boxShadow = 'none';
                    if(!msg.isPinned) {
                        card.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)';
                    }
                };

                card.querySelector('.copy-btn').onclick = (e) => {
                    const btn = e.currentTarget;
                    const text = decodeURIComponent(btn.dataset.text);
                    navigator.clipboard.writeText(text).then(() => {
                        const originalContent = btn.innerHTML;
                        btn.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ!';
                        btn.style.color = '#4caf50';
                        btn.style.borderColor = '#4caf50';
                        btn.style.background = 'rgba(76, 175, 80, 0.1)';
                        setTimeout(() => {
                            btn.innerHTML = originalContent;
                            btn.style.color = '';
                            btn.style.borderColor = '';
                            btn.style.background = '';
                        }, 2000);
                    });
                };

                card.querySelector('.pin-msg').onclick = (e) => {
                    e.stopPropagation();
                    const list = Storage.getList('messages_data');
                    const item = list.find(m => m.id === msg.id);
                    if(item) {
                        item.isPinned = !item.isPinned;
                        Storage.saveList('messages_data', list);
                        renderTemplates();
                    }
                };

                card.querySelector('.delete-msg').onclick = (e) => {
                    e.stopPropagation();
                    if(confirm('هل أنت متأكد من حذف هذا القالب؟')) {
                        const list = Storage.getList('messages_data');
                        const newList = list.filter(m => m.id !== msg.id);
                        Storage.saveList('messages_data', newList);
                        renderTemplates();
                    }
                };

                card.querySelector('.edit-msg').onclick = (e) => {
                    e.stopPropagation();
                    openModal(msg);
                };

                card.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', msg.id);
                    e.dataTransfer.effectAllowed = 'move';
                    card.classList.add('dragging');
                    setTimeout(() => card.style.opacity = '0.5', 0);
                });

                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                    card.style.opacity = '1';
                    document.querySelectorAll('.message-card').forEach(c => {
                        if(!msg.isPinned) c.style.borderTop = '1px solid rgba(255,255,255,0.05)';
                    });
                });

                templatesGrid.appendChild(card);
            });

            templatesGrid.ondragover = (e) => {
                e.preventDefault(); 
                document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
                const afterElement = getDragAfterElement(templatesGrid, e.clientX, e.clientY);
                if (afterElement) {
                    afterElement.classList.add('drop-target');
                }
            };
            
            templatesGrid.ondrop = (e) => {
                e.preventDefault();
                const dragging = document.querySelector('.dragging');
                const afterElement = getDragAfterElement(templatesGrid, e.clientX, e.clientY);
                
                if (afterElement == null) {
                    templatesGrid.appendChild(dragging);
                } else {
                    templatesGrid.insertBefore(dragging, afterElement);
                }

                document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));

                const ids = [...templatesGrid.querySelectorAll('.message-card')].map(c => c.dataset.id);
                const allMessages = Storage.getList('messages_data');
                
                const newOrderMap = {};
                ids.forEach((id, index) => newOrderMap[id] = index);
                
                allMessages.forEach(m => {
                    if(newOrderMap[m.id] !== undefined) {
                        m.order = newOrderMap[m.id];
                    }
                });
                
                Storage.saveList('messages_data', allMessages);
                renderTemplates(); 
            };
        }
        
        function getDragAfterElement(container, x, y) {
            const draggableElements = [...container.querySelectorAll('.message-card:not(.dragging)')];

            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const boxCenterX = box.left + box.width / 2;
                const boxCenterY = box.top + box.height / 2;
                const dist = Math.hypot(x - boxCenterX, y - boxCenterY);
                
                if (dist < closest.dist) {
                    return { dist: dist, element: child };
                } else {
                    return closest;
                }
            }, { dist: Number.POSITIVE_INFINITY }).element;
        }

    function openModal(editingMsg = null) {
        const existing = document.querySelector('.modal-overlay');
        if(existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        overlay.innerHTML = `
            <div class="modal-container glass-panel">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fa-solid fa-feather"></i>
                        <span>${editingMsg ? 'تعديل مسودة' : 'إنشاء مسودة جديدة'}</span>
                    </h2>
                </div>

                <form id="msg-form" style="display:grid; gap:1.2rem;">
                    <div>
                        <input id="m-title" class="glass-input" style="width:100%;" placeholder="عنوان الرسالة (مثال: رسالة الترحيب)" required value="${editingMsg ? editingMsg.title : ''}">
                    </div>
                    
                    <div>
                        <select id="m-category" class="glass-input" style="width:100%;">
                            ${(Storage.getList('message_categories') || ['عام']).map(cat => `
                                <option value="${cat.name}" ${editingMsg && editingMsg.category === cat.name ? 'selected' : ''}>${cat.name}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div>
                        <textarea id="m-body" class="glass-input" style="width:100%; min-height:200px; resize:none;" placeholder="محتوى الرسالة..." required>${editingMsg ? editingMsg.body : ''}</textarea>
                    </div>

                    <div style="display:flex; justify-content:center; gap:1rem; margin-top:1.5rem;">
                        <button type="submit" class="btn btn-primary" style="width:140px; height:48px; font-size:1.1rem;">حفظ</button>
                        <button type="button" id="m-cancel" class="btn btn-secondary" style="width:140px; height:48px; background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); font-size:1.1rem;">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(overlay);

        Utils.initCustomSelect(overlay.querySelector('#m-category'));

        const form = overlay.querySelector('#msg-form');
        const cancel = overlay.querySelector('#m-cancel');

        const close = () => overlay.remove();
        cancel.onclick = close;

        form.onsubmit = (e) => {
            e.preventDefault();
            const title = overlay.querySelector('#m-title').value;
            const category = overlay.querySelector('#m-category').value;
            const body = overlay.querySelector('#m-body').value;

            const messages = Storage.getList('messages_data');
            if (editingMsg) {
                const idx = messages.findIndex(m => m.id === editingMsg.id);
                if (idx > -1) {
                    messages[idx] = { ...editingMsg, title, category, body, timestamp: new Date().toISOString() };
                }
            } else {
                messages.push({
                    id: Utils.generateId(),
                    title,
                    category,
                    body,
                    pinned: false,
                    timestamp: new Date().toISOString()
                });
            }
            Storage.saveList('messages_data', messages);
            close();
            renderTemplates();
        };
    }

        const addBtn = header.querySelector('#add-template-btn');
        addBtn.onclick = () => openModal();

        container.appendChild(catSidebar);
        container.appendChild(templatesGrid);
        
        renderCategories();
        renderTemplates();

        return container;
    };

import { Storage, Utils } from './core.js';

export function renderAlmdrasa() {
    const container = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h1 class="section-title">المدرسة</h1>
        <button id="add-link-btn" class="btn btn-primary"><i class="fa-solid fa-plus"></i> إضافة صفحة</button>
    `;
    container.appendChild(header);

    const sectionsContainer = document.createElement('div');
    sectionsContainer.style.display = 'flex';
    sectionsContainer.style.flexDirection = 'column';
    sectionsContainer.style.gap = '2rem';

    function render() {
        sectionsContainer.innerHTML = '';
        let links = Storage.getList('almdrasa_links');
        
        if (links.length === 0) {
            links = [
                { id: 'def_1', title: 'لوحة التحكم', url: '#', category: 'main', icon: 'fa-solid fa-chart-pie', timestamp: new Date().toISOString() },
                { id: 'def_2', title: 'الدورات التدريبية', url: '#', category: 'courses', icon: 'fa-solid fa-graduation-cap', timestamp: new Date().toISOString() },
                { id: 'def_3', title: 'المجتمع', url: '#', category: 'other', icon: 'fa-solid fa-users', timestamp: new Date().toISOString() },
                { id: 'def_4', title: 'المكتبة', url: '#', category: 'other', icon: 'fa-solid fa-book', timestamp: new Date().toISOString() },
                { id: 'def_5', title: 'التقويم الدراسي', url: '#', category: 'main', icon: 'fa-solid fa-calendar', timestamp: new Date().toISOString() },
                { id: 'def_6', title: 'المسار التعليمي', url: '#', category: 'courses', icon: 'fa-solid fa-road', timestamp: new Date().toISOString() }
            ];
            Storage.saveList('almdrasa_links', links);
        }

        let globalShortcutIndex = 0;
        
        const categories = [
            { id: 'main', title: 'الصفحات الرئيسية', icon: 'fa-solid fa-star' },
            { id: 'courses', title: 'الدورات', icon: 'fa-solid fa-laptop-code' },
            { id: 'other', title: 'صفحات أخرى', icon: 'fa-solid fa-layer-group' }
        ];

        categories.forEach(cat => {
            const catLinks = links.filter(l => l.category === cat.id || (!l.category && cat.id === 'other'));
            
            // Create Section Header
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'category-header';
            sectionHeader.innerHTML = `
                <div class="category-title">
                    <i class="${cat.icon}"></i>
                    <span>${cat.title}</span>
                    <span class="category-count">(${catLinks.length})</span>
                </div>
                <div class="category-toggle">
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
            `;
            
            // Grid Container
            const grid = document.createElement('div');
            grid.className = 'almdrasa-grid';
            grid.dataset.category = cat.id;

            // Toggle Logic
            let isCollapsed = false;
            sectionHeader.onclick = () => {
                isCollapsed = !isCollapsed;
                grid.style.display = isCollapsed ? 'none' : 'grid';
                sectionHeader.querySelector('.fa-chevron-down').style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0)';
                sectionHeader.style.opacity = isCollapsed ? '0.7' : '1';
            };

            // Create Cards
            catLinks.forEach(link => {
                globalShortcutIndex++;
                const card = createCard(link, globalShortcutIndex);
                grid.appendChild(card);
            });

            setupDragAndDrop(grid);

            sectionsContainer.appendChild(sectionHeader);
            sectionsContainer.appendChild(grid);
        });
    }

    function createCard(link, index) {
        const card = document.createElement('div');
        card.className = 'almdrasa-card';
        card.draggable = true;
        card.dataset.id = link.id; 

        // Drag Events
        card.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', link.id);
            card.classList.add('dragging');
        };
        card.ondragend = () => {
             card.classList.remove('dragging');
        };

        // Click Event (Open Link)
        card.onclick = (e) => {
            if (e.target.closest('.card-action-btn')) return;
            window.open(link.url, '_blank');
        };

        // Card HTML Structure
        card.innerHTML = `
            <div class="card-actions">
                <button class="card-action-btn copy-link" title="نسخ الرابط">
                    <i class="fa-solid fa-copy"></i>
                </button>
                <button class="card-action-btn edit-link" title="تعديل">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="card-action-btn delete" title="حذف">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>

            <div class="card-icon-container">
                <i class="card-icon ${link.icon || 'fa-solid fa-link'}"></i>
            </div>
            
            <div class="card-content">
                <h3 class="card-title">${link.title}</h3>
            </div>
            
            <span class="card-id">#${index}</span>
        `;

        // Action Buttons Events
        card.querySelector('.copy-link').onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(link.url).then(() => {
                const icon = e.currentTarget.querySelector('i');
                icon.className = 'fa-solid fa-check';
                setTimeout(() => icon.className = 'fa-solid fa-copy', 1500);
            });
        };

        card.querySelector('.delete').onclick = (e) => {
            e.stopPropagation();
            if(confirm('هل أنت متأكد من حذف هذا الرابط؟')) {
                const newList = Storage.getList('almdrasa_links').filter(l => l.id !== link.id);
                Storage.saveList('almdrasa_links', newList);
                render();
            }
        };

        card.querySelector('.edit-link').onclick = (e) => {
            e.stopPropagation();
            openModal(link);
        };

        return card;
    }

    function setupDragAndDrop(grid) {
        grid.ondragover = (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(grid, e.clientX, e.clientY);
            const dragging = document.querySelector('.dragging');
            if (afterElement == null) {
                grid.appendChild(dragging);
            } else {
                grid.insertBefore(dragging, afterElement);
            }
        };

        grid.ondrop = (e) => {
            e.preventDefault();
            const category = grid.dataset.category;
            const currentIds = Array.from(grid.children).map(c => c.dataset.id);
            const allLinks = Storage.getList('almdrasa_links');
            
            // Update categories based on drop target
            currentIds.forEach(id => {
                const link = allLinks.find(l => l.id === id);
                if (link) link.category = category;
            });
            
            saveAllSectionsOrder(); 
        };
    }

    function saveAllSectionsOrder() {
        const allLinks = Storage.getList('almdrasa_links'); 
        const newMasterList = [];
        
        document.querySelectorAll('.almdrasa-grid').forEach(grid => {
            const cat = grid.dataset.category;
            Array.from(grid.children).forEach(card => {
                const id = card.dataset.id;
                const link = allLinks.find(l => l.id === id);
                if (link) {
                    link.category = cat; 
                    newMasterList.push(link);
                }
            });
        });
        
        Storage.saveList('almdrasa_links', newMasterList);
    }

    function getDragAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.almdrasa-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
             if (x > box.left && x < box.right && y > box.top && y < box.bottom) {
                 return { element: child };
             }
             return closest;
        }, { element: null }).element;
    }

    function openModal(editingLink = null) {
        const existing = document.querySelector('.modal-overlay');
        if(existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay glass-panel';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.zIndex = '3000';
        
        const ALL_ICONS = [
            'fa-solid fa-link', 'fa-solid fa-globe', 'fa-solid fa-star', 'fa-solid fa-heart',
            'fa-solid fa-house', 'fa-solid fa-user', 'fa-solid fa-gear', 'fa-solid fa-bell',
            'fa-solid fa-magnifying-glass', 'fa-solid fa-bars', 'fa-solid fa-xmark', 'fa-solid fa-check',
            'fa-brands fa-google', 'fa-brands fa-youtube', 'fa-brands fa-facebook', 'fa-brands fa-instagram',
            'fa-brands fa-linkedin', 'fa-brands fa-whatsapp', 'fa-brands fa-twitter', 'fa-brands fa-tiktok',
            'fa-brands fa-snapchat', 'fa-brands fa-telegram', 'fa-brands fa-discord', 'fa-brands fa-github',
            'fa-brands fa-behance', 'fa-brands fa-dribbble', 'fa-brands fa-pinterest', 'fa-brands fa-reddit',
            'fa-brands fa-spotify', 'fa-brands fa-soundcloud', 'fa-brands fa-twitch', 'fa-brands fa-medium',
            'fa-brands fa-figma', 'fa-brands fa-dropbox', 'fa-brands fa-google-drive', 'fa-brands fa-slack',
            'fa-brands fa-trello', 'fa-brands fa-shopify', 'fa-brands fa-wordpress', 'fa-brands fa-wix',
            'fa-brands fa-microsoft', 'fa-brands fa-apple', 'fa-brands fa-android', 'fa-brands fa-aws',
            'fa-brands fa-paypal', 'fa-brands fa-stripe', 'fa-brands fa-btc', 'fa-brands fa-ethereum',
            'fa-solid fa-briefcase', 'fa-solid fa-folder', 'fa-solid fa-file', 'fa-solid fa-file-pdf',
            'fa-solid fa-file-word', 'fa-solid fa-file-excel', 'fa-solid fa-envelope', 'fa-solid fa-inbox',
            'fa-solid fa-calendar', 'fa-solid fa-clock', 'fa-solid fa-stopwatch', 'fa-solid fa-chart-pie',
            'fa-solid fa-chart-line', 'fa-solid fa-chart-bar', 'fa-solid fa-calculator', 'fa-solid fa-list',
            'fa-solid fa-pen', 'fa-solid fa-marker', 'fa-solid fa-trash', 'fa-solid fa-tag',
            'fa-solid fa-paperclip', 'fa-solid fa-print', 'fa-solid fa-cloud', 'fa-solid fa-cloud-arrow-up',
            'fa-solid fa-database', 'fa-solid fa-server', 'fa-solid fa-wifi', 'fa-solid fa-signal',
            'fa-solid fa-graduation-cap', 'fa-solid fa-school', 'fa-solid fa-book', 'fa-solid fa-bookmark',
            'fa-solid fa-pencil', 'fa-solid fa-flask', 'fa-solid fa-microscope', 'fa-solid fa-code',
            'fa-solid fa-laptop-code', 'fa-solid fa-robot', 'fa-solid fa-brain', 'fa-solid fa-lightbulb',
            'fa-solid fa-palette', 'fa-solid fa-camera', 'fa-solid fa-video', 'fa-solid fa-microphone',
            'fa-solid fa-headphones', 'fa-solid fa-music', 'fa-solid fa-gamepad', 'fa-solid fa-puzzle-piece',
            'fa-solid fa-shop', 'fa-solid fa-cart-shopping', 'fa-solid fa-basket-shopping', 'fa-solid fa-bag-shopping',
            'fa-solid fa-credit-card', 'fa-solid fa-wallet', 'fa-solid fa-money-bill', 'fa-solid fa-coins',
            'fa-solid fa-piggy-bank', 'fa-solid fa-receipt', 'fa-solid fa-barcode', 'fa-solid fa-truck',
            'fa-solid fa-box', 'fa-solid fa-gift', 'fa-solid fa-percent', 'fa-solid fa-dollar-sign',
            'fa-solid fa-circle-info', 'fa-solid fa-circle-question', 'fa-solid fa-circle-exclamation', 'fa-solid fa-circle-check',
            'fa-solid fa-triangle-exclamation', 'fa-solid fa-lock', 'fa-solid fa-unlock', 'fa-solid fa-key',
            'fa-solid fa-shield', 'fa-solid fa-eye', 'fa-solid fa-eye-slash', 'fa-solid fa-share',
            'fa-solid fa-share-nodes', 'fa-solid fa-download', 'fa-solid fa-upload', 'fa-solid fa-rotate',
            'fa-solid fa-arrow-right', 'fa-solid fa-arrow-left', 'fa-solid fa-chevron-down', 'fa-solid fa-chevron-up',
            'fa-solid fa-location-dot', 'fa-solid fa-map', 'fa-solid fa-compass', 'fa-solid fa-flag',
            'fa-solid fa-fire', 'fa-solid fa-bolt', 'fa-solid fa-droplet', 'fa-solid fa-snowflake',
            'fa-solid fa-sun', 'fa-solid fa-moon', 'fa-solid fa-umbrella', 'fa-solid fa-plane',
            'fa-solid fa-car', 'fa-solid fa-bus', 'fa-solid fa-train', 'fa-solid fa-bicycle',
            'fa-solid fa-hotel', 'fa-solid fa-utensils', 'fa-solid fa-mug-hot', 'fa-solid fa-wine-glass',
            'fa-solid fa-burger', 'fa-solid fa-pizza-slice', 'fa-solid fa-baby', 'fa-solid fa-paw',
            'fa-solid fa-tree', 'fa-solid fa-leaf', 'fa-solid fa-seedling', 'fa-solid fa-recycle',
            'fa-solid fa-hospital', 'fa-solid fa-heart-pulse', 'fa-solid fa-stethoscope', 'fa-solid fa-pills',
            'fa-solid fa-user-doctor', 'fa-solid fa-user-nurse', 'fa-solid fa-mask', 'fa-solid fa-virus',
            'fa-solid fa-handshake', 'fa-solid fa-users', 'fa-solid fa-user-group', 'fa-solid fa-user-plus',
            'fa-solid fa-comments', 'fa-solid fa-comment-dots', 'fa-solid fa-phone', 'fa-solid fa-mobile',
            'fa-solid fa-tablet', 'fa-solid fa-desktop', 'fa-solid fa-tv', 'fa-solid fa-keyboard',
            'fa-solid fa-mouse', 'fa-solid fa-plug', 'fa-solid fa-battery-full', 'fa-solid fa-wifi',
        ];
        
        let selectedIcon = editingLink ? editingLink.icon : 'fa-solid fa-link';

        overlay.innerHTML = `
            <div class="modal-container almdrasa-modal">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fa-solid fa-graduation-cap gold-text"></i>
                        <span>${editingLink ? 'تعديل الرابط' : 'إضافة رابط جديد'}</span>
                    </h2>
                </div>

                <form id="link-form" class="modal-form">
                    <div class="form-group">
                        <label>العنوان</label>
                        <input id="l-name" class="glass-input" placeholder="مثال: لوحة التحكم" required value="${editingLink ? editingLink.title : ''}">
                    </div>
                    
                    <div class="form-group">
                        <label>الرابط (URL)</label>
                        <input id="l-url" class="glass-input" placeholder="https://..." required value="${editingLink ? editingLink.url : ''}">
                    </div>

                    <div class="form-row">
                         <div class="form-group">
                             <label>القسم</label>
                             <select id="l-category" class="glass-input">
                                <option value="main" ${editingLink && editingLink.category === 'main' ? 'selected' : ''}>أساسي</option>
                                <option value="courses" ${editingLink && editingLink.category === 'courses' ? 'selected' : ''}>كورسات</option>
                                <option value="other" ${editingLink && editingLink.category === 'other' ? 'selected' : ''}>أخرى</option>
                             </select>
                         </div>
                         <div class="form-group">
                            <label>الأيقونة</label>
                            <div id="icon-preview-btn" class="glass-input icon-picker-btn">
                                <i id="current-icon" class="${selectedIcon}"></i>
                                <span>تغيير</span>
                            </div>
                         </div>
                    </div>

                    <div id="icon-selector" class="icon-selector-panel">
                        <div id="icons-grid" class="icons-grid"></div>
                        <button type="button" id="load-more-icons" class="btn btn-sm btn-glass load-more-btn">تحميل المزيد...</button>
                    </div>

                    <div class="modal-actions">
                        <button type="submit" class="btn btn-primary">حفظ</button>
                        <button type="button" id="l-cancel" class="btn btn-secondary">إلغاء</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(overlay);

        Utils.initCustomSelect(overlay.querySelector('#l-category'));

        const form = overlay.querySelector('#link-form');
        const cancel = overlay.querySelector('#l-cancel');
        const iconBtn = overlay.querySelector('#icon-preview-btn');
        const iconSelector = overlay.querySelector('#icon-selector');
        const iconsGrid = overlay.querySelector('#icons-grid');
        const currentIconEl = overlay.querySelector('#current-icon');

        const allIcons = ALL_ICONS;
        let displayLimit = 30;

        function renderIcons(limit) {
            iconsGrid.innerHTML = '';
            allIcons.slice(0, limit).forEach(icon => {
                const el = document.createElement('div');
                el.className = 'icon-item';
                if (icon === selectedIcon) el.classList.add('active');
                
                el.innerHTML = `<i class="${icon}"></i>`;
                
                el.onclick = () => {
                    selectedIcon = icon;
                    currentIconEl.className = icon;
                    iconSelector.classList.remove('active');
                    
                    // Update Active State
                    overlay.querySelectorAll('.icon-item').forEach(i => i.classList.remove('active'));
                    el.classList.add('active');
                };
                iconsGrid.appendChild(el);
            });
        }

        iconBtn.onclick = () => {
            iconSelector.classList.toggle('active');
            if (iconSelector.classList.contains('active')) renderIcons(displayLimit);
        };

        overlay.querySelector('#load-more-icons').onclick = () => {
            displayLimit += 18;
            renderIcons(displayLimit);
        };

        const close = () => overlay.remove();
        cancel.onclick = close;

        form.onsubmit = (e) => {
            e.preventDefault();

            const title = overlay.querySelector('#l-name').value;
            const url = overlay.querySelector('#l-url').value;
            const category = overlay.querySelector('#l-category').value;
            const icon = selectedIcon;

            if(!title || !url) return alert('الرجاء ملء جميع الحقول');

            const list = Storage.getList('almdrasa_links');
            
            if(editingLink) {
                const index = list.findIndex(l => l.id === editingLink.id);
                if(index > -1) {
                    list[index] = { ...list[index], title, url, icon, category, timestamp: new Date().toISOString() };
                }
            } else {
                list.push({
                    id: Utils.generateId(),
                    title,
                    url,
                    icon,
                    category,
                    timestamp: new Date().toISOString()
                });
            }
            
            Storage.saveList('almdrasa_links', list);
            close();
            render();
        };
    }

    header.querySelector('#add-link-btn').onclick = () => openModal();

    render();
    container.appendChild(sectionsContainer);
    return container;
}

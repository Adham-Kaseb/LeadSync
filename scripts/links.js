import { Storage, Utils } from './core.js';

export function renderLinks() {
    const container = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h1 class="section-title">روابط منصات المتابعة</h1>
        <button id="add-link-btn" class="btn btn-primary"><i class="fa-solid fa-plus"></i> إضافة رابط</button>
    `;
    container.appendChild(header);

    let links = Storage.getList('links_data');
    if (links.length === 0) {
        links = [
            { id: '1', title: 'ميتا بيزنس', url: 'https://business.facebook.com', icon: 'fa-brands fa-meta', category: 'haramblur', timestamp: new Date().toISOString() },
            { id: '2', title: 'واتساب ويب', url: 'https://web.whatsapp.com', icon: 'fa-brands fa-whatsapp', category: 'haramblur', timestamp: new Date().toISOString() },
            { id: '3', title: 'لينكد إن', url: 'https://www.linkedin.com', icon: 'fa-brands fa-linkedin', category: 'almdrasa', timestamp: new Date().toISOString() },
        ];
        Storage.saveList('links_data', links);
    }
    
    const sectionsContainer = document.createElement('div');
    sectionsContainer.style.display = 'flex';
    sectionsContainer.style.flexDirection = 'column';
    sectionsContainer.style.gap = '2rem';

    function render() {
        sectionsContainer.innerHTML = '';
        const currentLinks = Storage.getList('links_data');
        
        const categories = [
            { id: 'almdrasa', title: 'روابط المدرسة', icon: 'fa-solid fa-school' },
            { id: 'haramblur', title: 'روابط حرام بلير', icon: 'fa-solid fa-briefcase' }
        ];

        categories.forEach(cat => {
            const catLinks = currentLinks.filter(l => l.category === cat.id || (!l.category && cat.id === 'haramblur'));
            
            const section = document.createElement('div');
            section.className = 'glass-panel';
            section.style.padding = '1.5rem';
            section.style.borderRadius = '16px';
            
            const sectionHeader = document.createElement('div');
            sectionHeader.style.display = 'flex';
            sectionHeader.style.justifyContent = 'space-between';
            sectionHeader.style.alignItems = 'center';
            sectionHeader.style.cursor = 'pointer';
            sectionHeader.style.marginBottom = '1rem';
            
            sectionHeader.innerHTML = `
                <h2 style="font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem; margin:0;">
                    <i class="${cat.icon} gold-text"></i> ${cat.title}
                    <span style="font-size: 0.8rem; opacity: 0.6; margin-right: 0.5rem;">(${catLinks.length})</span>
                </h2>
                <i class="fa-solid fa-chevron-down toggle-icon" style="transition: transform 0.3s; color: var(--text-secondary);"></i>
            `;
            section.appendChild(sectionHeader);

            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
            grid.style.gap = '1.5rem';
            grid.style.transition = 'all 0.3s ease';
            
            catLinks.forEach(link => {
                const card = createCard(link);
                grid.appendChild(card);
            });

            let isCollapsed = false;
            sectionHeader.onclick = () => {
                isCollapsed = !isCollapsed;
                grid.style.display = isCollapsed ? 'none' : 'grid';
                sectionHeader.querySelector('.toggle-icon').style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0)';
            };

            section.appendChild(grid);
            sectionsContainer.appendChild(section);
        });
    }

    function createCard(link) {
        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.cssText = `
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            text-align: center; 
            position: relative; 
            padding: 2rem 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: linear-gradient(145deg, rgba(255, 255, 255, 0.03) 0%, rgba(0, 0, 0, 0.2) 100%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
        `;

        card.onmouseenter = () => {
            card.style.transform = 'translateY(-5px)';
            card.style.borderColor = 'rgba(227, 185, 56, 0.3)';
            card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 15px rgba(227, 185, 56, 0.1)';
            card.querySelector('.icon-wrapper').style.transform = 'scale(1.1) rotate(5deg)';
            card.querySelector('.action-group').style.opacity = '1';
        };
        card.onmouseleave = () => {
            card.style.transform = 'none';
            card.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            card.style.boxShadow = 'none';
            card.querySelector('.icon-wrapper').style.transform = 'none';
            card.querySelector('.action-group').style.opacity = '0';
        };

        card.innerHTML = `
            <div style="
                position: absolute; 
                top: 0; 
                left: 0; 
                right: 0; 
                height: 2px; 
                background: linear-gradient(90deg, transparent, var(--metallic-gold), transparent); 
                opacity: 0.5;">
            </div>

            <div class="action-group" style="position: absolute; top: 10px; left: 10px; display: flex; gap: 5px; opacity: 0; transition: opacity 0.2s; z-index: 10;">
                <button class="action-btn edit edit-link" data-id="${link.id}" style="width:28px; height:28px; background:rgba(255,255,255,0.05); color:var(--text-secondary); border:1px solid rgba(255,255,255,0.1); border-radius:6px; cursor:pointer;">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="action-btn delete delete-link" data-id="${link.id}" style="width:28px; height:28px; background:rgba(255,77,77,0.1); color:#ff4d4d; border:1px solid rgba(255,77,77,0.2); border-radius:6px; cursor:pointer;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>

            <div class="icon-wrapper" style="
                width: 80px; 
                height: 80px; 
                border-radius: 50%; 
                background: rgba(0, 0, 0, 0.3); 
                border: 1px solid var(--metallic-gold); 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 2.5rem; 
                color: var(--metallic-gold); 
                margin-bottom: 1.5rem; 
                box-shadow: 0 0 20px rgba(227, 185, 56, 0.1);
                transition: transform 0.4s ease;
            ">
                <i class="${link.icon || 'fa-solid fa-link'}"></i>
            </div>

            <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; font-weight: 700; color: #fff;">${link.title}</h3>
            
            <a href="${link.url}" target="_blank" class="btn" style="
                margin-top: auto; 
                width: 100%; 
                justify-content: center; 
                background: rgba(227, 185, 56, 0.1); 
                color: var(--metallic-gold); 
                border: 1px solid rgba(227, 185, 56, 0.3);
                border-radius: 8px;
                padding: 10px;
                font-weight: 600;
                transition: all 0.2s;
            " onmouseover="this.style.background='var(--metallic-gold)'; this.style.color='#000';" onmouseout="this.style.background='rgba(227, 185, 56, 0.1)'; this.style.color='var(--metallic-gold)';">
                <i class="fa-solid fa-external-link-alt" style="margin-left: 8px;"></i> فتح الرابط
            </a>
        `;

        card.querySelector('.delete-link').onclick = (e) => {
            e.stopPropagation();
            if(confirm('هل أنت متأكد من حذف الرابط؟')) {
                const newList = Storage.getList('links_data').filter(l => l.id !== link.id);
                Storage.saveList('links_data', newList);
                render();
            }
        };

        card.querySelector('.edit-link').onclick = (e) => {
            e.stopPropagation();
            openModal(link);
        };

        return card;
    }

    function openModal(editingLink = null) {
        const existing = document.querySelector('.modal-overlay');
        if(existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay glass-panel';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '2000';

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
            'fa-solid fa-network-wired', 'fa-solid fa-sitemap', 'fa-solid fa-layer-group', 'fa-solid fa-cube',
            'fa-solid fa-cubes', 'fa-solid fa-dice', 'fa-solid fa-ghost', 'fa-solid fa-dragon'
        ];

        overlay.innerHTML = `
            <div class="glass-panel" style="background:#1a1a1a; padding:2rem; border-radius:16px; width:90%; max-width:500px; display:flex; flex-direction:column; gap:1.2rem; max-height: 90vh; overflow-y: auto;">
                <h2>${editingLink ? 'تعديل الرابط' : 'إضافة رابط'}</h2>
                
                <div>
                    <label style="display:block; margin-bottom:0.5rem; color:var(--text-secondary);">العنوان</label>
                    <input type="text" id="link-title" value="${editingLink ? editingLink.title : ''}" placeholder="مثال: فيسبوك" style="width:100%;">
                </div>
                
                <div>
                    <label style="display:block; margin-bottom:0.5rem; color:var(--text-secondary);">القسم</label>
                    <select id="link-category" style="width:100%;">
                        <option value="almdrasa" ${editingLink && editingLink.category === 'almdrasa' ? 'selected' : ''}>روابط المدرسة</option>
                        <option value="haramblur" ${editingLink && (editingLink.category === 'haramblur' || !editingLink.category) ? 'selected' : ''}>روابط حرام بلير</option>
                    </select>
                </div>

                <div>
                    <label style="display:block; margin-bottom:0.5rem; color:var(--text-secondary);">الرابط (URL)</label>
                    <input type="text" id="link-url" value="${editingLink ? editingLink.url : ''}" placeholder="https://..." style="width:100%; direction:ltr; text-align:right;">
                </div>

                <div>
                    <label style="display:block; margin-bottom:0.5rem; color:var(--text-secondary);">الأيقونة</label>
                    <div id="icon-grid-container" class="icon-grid" style="display:grid; grid-template-columns:repeat(6, 1fr); gap:10px; margin-bottom: 10px;">
                    </div>
                    <button id="load-more-icons" class="btn btn-secondary" style="width: 100%; padding: 0.5rem;">عرض المزيد من الأيقونات (200+)</button>
                    <input type="hidden" id="selected-icon" value="${editingLink ? editingLink.icon : ALL_ICONS[0]}">
                </div>

                <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1rem;">
                    <button id="cancel-link" class="btn btn-glass">إلغاء</button>
                    <button id="save-link" class="btn btn-primary">${editingLink ? 'حفظ التعديلات' : 'إضافة'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const gridContainer = overlay.querySelector('#icon-grid-container');
        const loadMoreBtn = overlay.querySelector('#load-more-icons');
        let displayedCount = 12;

        const renderIcons = (limit) => {
            gridContainer.innerHTML = ''; 
            const iconsToShow = ALL_ICONS.slice(0, limit);
            
            iconsToShow.forEach(icon => {
                const div = document.createElement('div');
                div.className = `icon-option ${overlay.querySelector('#selected-icon').value === icon ? 'selected' : ''}`;
                div.dataset.icon = icon;
                div.style.cursor = 'pointer';
                div.style.padding = '10px';
                div.style.borderRadius = '8px';
                div.style.textAlign = 'center';
                div.style.background = overlay.querySelector('#selected-icon').value === icon ? 'var(--metallic-gold)' : 'rgba(255,255,255,0.05)';
                div.style.color = overlay.querySelector('#selected-icon').value === icon ? '#000' : 'var(--text-primary)';
                div.innerHTML = `<i class="${icon}"></i>`;
                
                div.onclick = () => {
                   overlay.querySelectorAll('.icon-option').forEach(o => {
                        o.style.background = 'rgba(255,255,255,0.05)';
                        o.style.color = 'var(--text-primary)';
                        o.classList.remove('selected');
                   });
                   div.style.background = 'var(--metallic-gold)';
                   div.style.color = '#000';
                   div.classList.add('selected');
                   overlay.querySelector('#selected-icon').value = icon;
                };
                gridContainer.appendChild(div);
            });
        };

        renderIcons(displayedCount);

        loadMoreBtn.onclick = () => {
            displayedCount = ALL_ICONS.length; 
            renderIcons(displayedCount);
            loadMoreBtn.style.display = 'none'; 
        };

        overlay.querySelector('#cancel-link').onclick = () => overlay.remove();
        overlay.querySelector('#save-link').onclick = () => {
            const title = overlay.querySelector('#link-title').value;
            const url = overlay.querySelector('#link-url').value;
            const icon = overlay.querySelector('#selected-icon').value;
            const category = overlay.querySelector('#link-category').value;

            if(!title || !url) return alert('الرجاء ملء جميع الحقول');

            const list = Storage.getList('links_data');
            
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
            
            Storage.saveList('links_data', list);
            overlay.remove();
            render();
        };
    }

    header.querySelector('#add-link-btn').onclick = () => openModal();

    render();
    container.appendChild(sectionsContainer);
    return container;
}

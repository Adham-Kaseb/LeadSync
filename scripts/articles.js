import { Storage, Utils } from './core.js';

let articles = Storage.get('articles_data') || [];
let currentArticleId = null;
let quill = null; 

export async function renderArticles() {
    const container = document.createElement('div');
    container.className = 'articles-layout page-enter';
    
    container.innerHTML = `
        <div class="articles-sidebar glass-panel">
            <div class="articles-header">
                <button id="new-article-btn" class="btn">
                    <i class="fa-solid fa-plus"></i> &nbsp; مقال جديد
                </button>
            </div>
            <div class="articles-list" id="articles-list">
            </div>
        </div>
        
        <div class="editor-container glass-panel">
            <div class="article-meta-bar">
                <input type="text" id="article-title-input" placeholder="عنوان المقال...">
                
                <div class="meta-actions">
                    <button class="btn-icon-action" id="focus-mode-btn" title="وضع التركيز (Focus Mode)">
                        <i class="fa-solid fa-expand"></i>
                    </button>
                    <button class="btn-icon-action" id="voice-type-btn" title="الكتابة الصوتية">
                        <i class="fa-solid fa-microphone"></i>
                    </button>
                    <button class="btn-icon-action" id="save-article-btn" title="حفظ">
                        <i class="fa-solid fa-floppy-disk"></i>
                    </button>
                    <button class="btn-icon-action" id="assets-manager-btn" title="مدير الصور (Assets)">
                        <i class="fa-solid fa-images"></i>
                    </button>
                    <button class="btn-icon-action" id="export-gdocs-btn" title="نسخ وتصدير">
                        <i class="fa-brands fa-google-drive"></i>
                    </button>
                </div>
            </div>

            <div class="article-content-wrapper" style="display:flex; flex-direction:column; flex-grow:1; overflow:hidden;">
                <div id="quill-editor"></div>
            </div>

            <div class="editor-footer">
                <div class="stat-item" id="word-count">
                    <i class="fa-solid fa-align-left"></i> <span>0 كلمات</span>
                </div>
                <div class="stat-item" id="image-count" title="عدد الصور المستخدمة في المقال">
                    <i class="fa-regular fa-image"></i> <span>0 صور</span>
                </div>
                 <div class="stat-item" id="read-time">
                    <i class="fa-regular fa-clock"></i> <span>0 دقيقة قراءة</span>
                </div>
                <div class="stat-item">
                    <span id="save-status" style="opacity:0.6; font-size: 0.8rem; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px;">حالة الحفظ: <span id="save-status-text">تم الحفظ</span></span>
                </div>
            </div>
        </div>

        <div id="asset-modal" class="custom-modal" style="display:none;">
            <div class="modal-content glass-panel" style="width: 600px; max-width: 90vw;">
                <div class="modal-header">
                    <h3><i class="fa-solid fa-layer-group"></i> مكتبة الصور</h3>
                    <button class="close-modal-btn"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="asset-actions">
                    <input type="file" id="asset-upload-input" accept="image/*" style="display:none;">
                    <button id="upload-asset-btn" class="btn primary-btn" style="width:100%;">
                        <i class="fa-solid fa-cloud-arrow-up"></i> رفع صورة جديدة
                    </button>
                </div>
                <div id="assets-grid" class="assets-grid-container">
                </div>
                <div class="storage-info" style="font-size:0.8rem; color:var(--text-secondary); margin-top:10px; text-align:center;">
                    <span id="storage-usage">0%</span> من المساحة المستخدمة
                </div>
            </div>
        </div>
    `;

    const listContainer = container.querySelector('#articles-list');
    const titleInput = container.querySelector('#article-title-input');
    const newBtn = container.querySelector('#new-article-btn');
    const saveBtn = container.querySelector('#save-article-btn');
    const focusBtn = container.querySelector('#focus-mode-btn');
    const assetsBtn = container.querySelector('#assets-manager-btn'); 
    const wordCountEl = container.querySelector('#word-count span');
    const imageCountEl = container.querySelector('#image-count span'); 
    const readTimeEl = container.querySelector('#read-time span');
    const saveStatusText = container.querySelector('#save-status-text');
    const assetModal = container.querySelector('#asset-modal'); 
    const assetsGrid = container.querySelector('#assets-grid'); 
    const uploadInput = container.querySelector('#asset-upload-input'); 

    const AssetManager = {
        data: Storage.get('article_assets') || [],
        
        init() {
            assetsBtn.onclick = () => this.open();
            container.querySelector('.close-modal-btn').onclick = () => this.close();
            container.querySelector('#upload-asset-btn').onclick = () => uploadInput.click();
            
            uploadInput.onchange = (e) => {
                if(e.target.files.length > 0) this.handleUpload(e.target.files[0]);
            };
            
            assetModal.onclick = (e) => {
                if(e.target === assetModal) this.close();
            };
        },

        open() {
            this.render();
            assetModal.style.display = 'flex';
            setTimeout(() => assetModal.classList.add('active'), 10);
        },

        close() {
            assetModal.classList.remove('active');
            setTimeout(() => assetModal.style.display = 'none', 300);
        },

        render() {
            assetsGrid.innerHTML = '';
            if(this.data.length === 0) {
                assetsGrid.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary);">لا توجد صور محفوظة</div>`;
            } else {
                this.data.forEach(img => {
                    const item = document.createElement('div');
                    item.className = 'asset-item';
                    item.innerHTML = `
                        <img src="${img.data}" alt="Asset">
                        <div class="asset-overlay">
                            <button class="insert-btn" title="إدراج"><i class="fa-solid fa-plus"></i></button>
                            <button class="delete-btn" title="حذف"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    `;
                    
                    item.querySelector('.insert-btn').onclick = () => {
                        this.insertToEditor(img.data);
                        this.close();
                    };
                    
                    item.querySelector('.delete-btn').onclick = (e) => {
                        e.stopPropagation();
                        if(confirm('حذف هذه الصورة؟')) {
                            this.delete(img.id);
                        }
                    };
                    
                    assetsGrid.appendChild(item);
                });
            }
            this.updateStorageStats();
        },

        handleUpload(file) {
            if(!file.type.startsWith('image/')) return alert('يرجى اختيار صورة فقط');
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                   const compressed = this.compress(img);
                   this.add(compressed);
                   uploadInput.value = ''; 
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },

        compress(img) {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxSize = 800;
            
            if (width > height) {
                if (width > maxSize) {
                    height *= maxSize / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width *= maxSize / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            return canvas.toDataURL('image/jpeg', 0.7);
        },

        add(base64) {
            try {
                this.data.unshift({
                    id: Date.now(),
                    data: base64,
                    date: Date.now()
                });
                Storage.saveList('article_assets', this.data);
                this.render();
            } catch (e) {
                alert('عذراً، المساحة ممتلئة. يرجى حذف بعض الصور القديمة.');
            }
        },

        delete(id) {
            this.data = this.data.filter(i => i.id !== id);
            Storage.saveList('article_assets', this.data);
            this.render();
        },

        insertToEditor(base64) {
             const range = quill.getSelection(true);
             quill.insertEmbed(range.index, 'image', base64);
             quill.setSelection(range.index + 1);
        },
        
        updateStorageStats() {
            const used = JSON.stringify(this.data).length;
            const percent = Math.min(100, (used / (5 * 1024 * 1024)) * 100).toFixed(1);
            container.querySelector('#storage-usage').textContent = percent + '%';
        }
    };

    const updateStats = () => {
        if (!quill) return;
        const text = quill.getText().trim();
        const words = text.length > 0 ? text.split(/\s+/).length : 0;
        const time = Math.ceil(words / 200); 
        const images = quill.root.querySelectorAll('img').length;
        
        wordCountEl.textContent = `${words} كلمات`;
        imageCountEl.textContent = `${images} صور`;
        readTimeEl.textContent = `${time} دقيقة قراءة`;
    };

    setTimeout(() => {
        AssetManager.init();
        const Font = Quill.import('formats/font');
        const arabicFonts = [
            'Cairo', 'Tajawal', 'Amiri', 'Almarai', 'Lateef', 'Scheherazade New', 
            'Markazi Text', 'Mirza', 'El Messiri', 'Changa', 'Lalezar', 'Reem Kufi',
            'Harmattan', 'Rakkas', 'Katibeh', 'Aref Ruqaa', 'Vibes', 'Lemonada',
            'Mada', 'Kufam', 'Gulzar', 'Noto Naskh Arabic', 'Noto Kufi Arabic',
            'Noto Sans Arabic', 'IBM Plex Sans Arabic', 'Readex Pro', 'Alexandria',
            'Marhey', 'Blaka', 'Alanis', 'Alkalami', 'Ruqaa', 'Koulen', 'Cairo Play',
            'Zain', 'Bareq', 'Qahiri', 'Lanzhou', 'Sukar', 'Uthmanic' 
        ];
        Font.whitelist = arabicFonts;
        Quill.register(Font, true);

        const gFonts = arabicFonts.filter(f => !['Uthmanic', 'Lanzhou', 'Sukar', 'Bareq'].includes(f));
        const families = gFonts.map(f => f.trim().replace(/ /g, '+') + ':wght@400;700').join('&family=');
        
        if(!document.querySelector('#arabic-fonts-loader')) {
            const link = document.createElement('link');
            link.id = 'arabic-fonts-loader';
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
            document.head.appendChild(link);
        }

        const styleId = 'quill-font-mappings';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            let rules = '';
            Font.whitelist.forEach(font => {
                const fontName = font.replace(/"/g, "'");
                rules += `.ql-font-${font.replace(/\s+/g, '-')} { font-family: '${fontName}', sans-serif !important; }\n`;
                rules += `.ql-snow .ql-picker.ql-font .ql-picker-label[data-value="${font}"]::before, .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="${font}"]::before { content: '${font}'; font-family: '${fontName}', sans-serif; }\n`;
            });
            style.innerHTML = rules;
            document.head.appendChild(style);
        }

        quill = new Quill(container.querySelector('#quill-editor'), {
            theme: 'snow',
            placeholder: 'اكتب أفكارك الرائعة هنا...',
            modules: {
                toolbar: [
                    [{ 'font': Font.whitelist }], 
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'], 
                    [{ 'direction': 'rtl' }, { 'align': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['blockquote', 'code-block', 'link', 'image'],
                    ['clean']
                ]
            }
        });
        
        window.quillInstance = quill;
        
        quill.format('direction', 'rtl');
        quill.format('align', 'right');
        quill.format('font', 'Cairo'); 
        
        const tooltip = quill.theme.tooltip.root;
        const closeBtn = document.createElement('div'); 
        closeBtn.className = 'tooltip-close-btn';
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeBtn.title = 'إغلاق';
        closeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation(); 
            quill.theme.tooltip.hide();
            tooltip.classList.add('ql-hidden'); // Force hide
        };
        tooltip.appendChild(closeBtn);

        // Translate tooltip input and buttons
        const input = tooltip.querySelector('input[type=text]');
        if (input) input.placeholder = 'أدخل الرابط هنا...';

        // Add Escape key listener to close tooltip
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !tooltip.classList.contains('ql-hidden')) {
                quill.theme.tooltip.hide();
                tooltip.classList.add('ql-hidden');
            }
        });

        document.addEventListener('click', (e) => {
            if (!tooltip.classList.contains('ql-hidden')) {
                if (!tooltip.contains(e.target) && !e.target.closest('.ql-toolbar')) {
                    quill.theme.tooltip.hide();
                }
            }
        });
        
        if(currentArticleId) loadArticle(currentArticleId);

        quill.on('text-change', () => {
            updateStats();
            if (saveStatusText) {
                saveStatusText.textContent = 'جاري الحفظ...';
                saveStatusText.style.color = 'var(--metallic-gold)';
            }
            
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                saveArticle(false); 
            }, 3000); 
        });

        // Add Ctrl+S shortcut
        container.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                saveArticle(true);
            }
        });

        // Ensure tooltip is hidden on load
        quill.theme.tooltip.hide();

    }, 0);

    const updateList = () => {
        listContainer.innerHTML = '';
        if (articles.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align:center; padding:40px 20px; color:var(--text-secondary); display:flex; flex-direction:column; align-items:center; gap:10px;">
                    <i class="fa-solid fa-feather" style="font-size:2rem; opacity:0.3;"></i>
                    <p>لا توجد مقالات بعد.<br>ابدأ كتابة تحفتك الفنية!</p>
                </div>`;
            return;
        }

        articles.sort((a,b) => b.updatedAt - a.updatedAt).forEach(art => {
            const el = document.createElement('div');
            el.className = `article-item ${art.id === currentArticleId ? 'active' : ''}`;
            el.innerHTML = `
                <div class="article-title">${art.title || 'بدون عنوان'}</div>
                <div class="article-meta">
                    <span><i class="fa-regular fa-clock"></i> ${Utils.formatDate(art.updatedAt).split(',')[0]}</span>
                    <button class="btn-icon delete-art" style="color:#ff4d4d; opacity:0.6; background:none; border:none; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            
            el.onclick = (e) => {
                if(e.target.closest('.delete-art')) {
                     if(confirm('حذف هذا المقال نهائياً؟')) {
                         articles = articles.filter(a => a.id !== art.id);
                         Storage.saveList('articles_data', articles);
                         if(currentArticleId === art.id) {
                             currentArticleId = null;
                             quill.setText('');
                             titleInput.value = '';
                         }
                         updateList();
                     }
                     return;
                }
                loadArticle(art.id);
            };
            
            listContainer.appendChild(el);
        });
    };

    const loadArticle = (id) => {
        currentArticleId = id;
        const art = articles.find(a => a.id === id);
        if (art && quill) {
            titleInput.value = art.title;
            quill.root.innerHTML = art.content; 
            updateStats();
            updateList(); 
        }
    };

    const saveArticle = (showFeedback = true) => {
        if(!quill) return;
        
        const content = quill.root.innerHTML;
        const title = titleInput.value.trim() || 'مقال جديد';
        const delta = quill.getContents();
        
        if (!currentArticleId) {
            currentArticleId = Utils.generateId();
            articles.push({
                id: currentArticleId,
                title,
                content,
                delta,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        } else {
            const idx = articles.findIndex(a => a.id === currentArticleId);
            if(idx !== -1) {
                articles[idx].title = title;
                articles[idx].content = content;
                articles[idx].delta = delta;
                articles[idx].updatedAt = Date.now();
            }
        }
        
        Storage.saveList('articles_data', articles);
        if(currentArticleId) updateList(); 
        
        saveStatusText.textContent = 'تم الحفظ';
        saveStatusText.style.color = 'inherit';
        
        if (showFeedback) {
            const originalIcon = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--metallic-gold)"></i>';
            createConfetti(saveBtn);
            setTimeout(() => saveBtn.innerHTML = originalIcon, 1000);
        }
    };

    const createConfetti = (element) => {
        const rect = element.getBoundingClientRect();
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        
        for(let i=0; i<30; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = center.x + 'px';
            confetti.style.top = center.y + 'px';
            confetti.style.width = '6px';
            confetti.style.height = '6px';
            confetti.style.backgroundColor = ['#FFD700', '#FF4D4D', '#4DFF4D', '#4D4DFF', '#FFFFFF'][Math.floor(Math.random() * 5)];
            confetti.style.borderRadius = '50%';
            confetti.style.zIndex = '9999';
            confetti.style.pointerEvents = 'none';
            document.body.appendChild(confetti);

            const angle = Math.random() * Math.PI * 2;
            const velocity = 2 + Math.random() * 4;
            let x = 0, y = 0;
            let opacity = 1;

            const anim = setInterval(() => {
                x += Math.cos(angle) * velocity;
                y += Math.sin(angle) * velocity + 1; 
                opacity -= 0.02;
                
                confetti.style.transform = `translate(${x}px, ${y}px)`;
                confetti.style.opacity = opacity;

                if(opacity <= 0) {
                    clearInterval(anim);
                    confetti.remove();
                }
            }, 16);
        }
    };
    
    let autoSaveTimeout;

    saveBtn.onclick = () => saveArticle(true);
    
    newBtn.onclick = () => {
        currentArticleId = null;
        if(quill) {
            quill.setText('');
            quill.format('direction', 'rtl'); 
            quill.format('align', 'right');
        }
        titleInput.value = '';
        updateStats();
        updateList(); 
        titleInput.focus();
    };

    focusBtn.onclick = () => {
        document.body.classList.toggle('focus-mode');
        const isActive = document.body.classList.contains('focus-mode');
        focusBtn.innerHTML = isActive ? '<i class="fa-solid fa-compress"></i>' : '<i class="fa-solid fa-expand"></i>';
        focusBtn.classList.toggle('active-mode', isActive);
        
        if(isActive) {
            quill.focus();
        }
    };

    let voiceHandler = null;
    if ('webkitSpeechRecognition' in window) {
        const { VoiceInput } = await import('./voice-input.js');
        
        voiceHandler = new VoiceInput((finalText, interim) => {
            const range = quill.getSelection(true);
            if (finalText) {
                quill.insertText(range.index, finalText + ' ');
                quill.setSelection(range.index + finalText.length + 1);
            }
        }, (status) => {
            const btn = container.querySelector('#voice-type-btn');
            if(status === 'start') {
                btn.classList.add('pulse-active');
            } else {
                btn.classList.remove('pulse-active');
            }
        });

        const voiceBtn = container.querySelector('#voice-type-btn');
        voiceBtn.onclick = () => voiceHandler.toggle();
    } else {
        container.querySelector('#voice-type-btn').style.display = 'none';
    }

    const exportBtn = container.querySelector('#export-gdocs-btn');
    exportBtn.onclick = () => {
        const html = quill.root.innerHTML;
        const blob = new Blob([html], { type: 'text/html' });
        const clipboardItem = new ClipboardItem({ 'text/html': blob });
        
        navigator.clipboard.write([clipboardItem]).then(() => {
             if(confirm('تم نسخ النص المنسق والصور للحافظة.\nهل تريد فتح مستند Google Doc جديد لصق المحتوى؟')) {
                 window.open('https://docs.google.com/document/create', '_blank');
             }
        }).catch(err => {
             console.error(err);
             alert('فشل النسخ التلقائي. يرجى التحديد والنسخ يدوياً (Browser Limit).');
        });
    };

    updateList();

    return container;
}
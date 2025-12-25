import { VideoEngine } from './video-engine.js';
import { Notifications } from './core.js';

export async function renderTVMode() {
    const container = document.createElement('div');
    container.className = 'tv-mode-page';
    
    // Clear persistent player if we are in TV Mode page
    if (window.videoEngine) window.videoEngine.container.innerHTML = '';

    container.innerHTML = `
        <div class="tv-mode-scroll-container">
            <div class="tv-hero-section">
                <div class="tv-top-nav">
                    <div class="tv-logo">
                        <i class="fa-solid fa-crown gold-text"></i>
                        <span>Premium <span class="gold-text">TV Mode</span></span>
                    </div>
                    <div class="tv-search-wrapper">
                        <div class="tv-input-box">
                            <i class="fa-solid fa-link"></i>
                            <input type="text" id="youtube-url" placeholder="ضع رابط فيديو يوتيوب هنا وانطلق...">
                            <button id="play-custom-video" class="tv-play-btn">
                                <span>تشغيل</span>
                                <i class="fa-solid fa-play"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="tv-main-stage">
                    <div class="tv-screen-bezel">
                        <div class="tv-screen-frame">
                            <div id="main-player-viewer" class="main-viewer-empty">
                                <div class="empty-state">
                                    <div class="pulse-icon">
                                        <i class="fa-solid fa-tv"></i>
                                    </div>
                                    <h3>جاهز للمشاهدة</h3>
                                    <p>أدخل رابط الفيديو في الأعلى للبدء بتجربة سينمائية فريدة</p>
                                </div>
                            </div>
                        </div>
                        <div class="tv-stand"></div>
                    </div>

                    <div class="tv-controls-bar" id="player-controls" style="display: none;">
                        <div class="control-group">
                            <button class="ctrl-btn" id="ctrl-mute" title="كتم الصوت"><i class="fa-solid fa-volume-high"></i></button>
                            <button class="ctrl-btn" id="ctrl-pause" title="إيقاف مؤقت"><i class="fa-solid fa-pause"></i></button>
                            <button class="ctrl-btn" id="ctrl-next" title="الفيديو التالي"><i class="fa-solid fa-forward-step"></i></button>
                        </div>
                        <div class="control-divider"></div>
                        <div class="control-group">
                            <button class="ctrl-btn" id="ctrl-pip" title="وضع صورة داخل صورة"><i class="fa-solid fa-window-restore"></i></button>
                            <button class="ctrl-btn" id="ctrl-add-playlist" title="إضافة لقائمة التشغيل"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                    
                    <div class="video-meta-glass" id="video-info" style="display: none;">
                        <h2 id="video-title">العنوان يظهر هنا</h2>
                        <div class="meta-tags">
                            <div id="video-author" class="tv-label">
                                <i class="fa-solid fa-user"></i>
                                <span>الناشر</span>
                            </div>
                            <div class="tv-label gold-theme premium-tag">
                                <i class="fa-solid fa-star"></i>
                                <span>جودة عالية</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="tv-content-grid">
                    <section class="tv-section" id="tv-history-container" style="display: none;">
                        <div class="section-header">
                            <h3><i class="fa-solid fa-clock-rotate-left gold-text"></i> شوهد مؤخراً</h3>
                            <button class="clear-history-btn" id="clear-history">مسح الكل</button>
                        </div>
                        <div class="tv-grid-scroll" id="tv-history-grid"></div>
                    </section>

                    <section class="tv-section" id="playlist-repository">
                        <div class="section-header">
                            <h3><i class="fa-solid fa-layer-group gold-text"></i> مستودع قوائم التشغيل</h3>
                            <button class="add-playlist-btn" id="create-playlist"><i class="fa-solid fa-plus"></i> قائمة جديدة</button>
                        </div>
                        <div class="playlists-container" id="playlists-grid">
                            <!-- Playlists will be rendered here -->
                        </div>
                    </section>
                </div>
            </div>
        </div>
    `;

    const input = container.querySelector('#youtube-url');
    const playBtn = container.querySelector('#play-custom-video');
    const viewer = container.querySelector('#main-player-viewer');
    const infoArea = container.querySelector('#video-info');
    const controlsBar = container.querySelector('#player-controls');

    const historyContainer = container.querySelector('#tv-history-container');
    const historyGrid = container.querySelector('#tv-history-grid');
    const clearHistoryBtn = container.querySelector('#clear-history');

    const playlistsGrid = container.querySelector('#playlists-grid');
    const createPlaylistBtn = container.querySelector('#create-playlist');

    // Playlist Management
    const PlaylistManager = {
        getPlaylists() {
            return JSON.parse(localStorage.getItem('tv_playlists') || '[]');
        },
        savePlaylists(playlists) {
            localStorage.setItem('tv_playlists', JSON.stringify(playlists));
            this.render();
        },
        create(name) {
            const playlists = this.getPlaylists();
            playlists.unshift({ id: Date.now(), name, videos: [] });
            this.savePlaylists(playlists);
        },
        delete(id) {
            const playlists = this.getPlaylists().filter(p => p.id !== id);
            this.savePlaylists(playlists);
        },
        addVideo(playlistId, video) {
            const playlists = this.getPlaylists();
            const playlist = playlists.find(p => p.id === playlistId);
            if (playlist && !playlist.videos.find(v => v.id === video.id)) {
                const now = new Date();
                const day = now.getDate();
                const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                const addedAt = `${day} ${months[now.getMonth()]}`;
                
                playlist.videos.push({ ...video, done: false, addedAt });
                this.savePlaylists(playlists);
                Notifications.success(`تمت الإضافة إلى ${playlist.name}`);
            }
        },
        toggleDone(playlistId, videoId) {
            const playlists = this.getPlaylists();
            const playlist = playlists.find(p => p.id === playlistId);
            const video = playlist?.videos.find(v => v.id === videoId);
            if (video) {
                video.done = !video.done;
                this.savePlaylists(playlists);
            }
        },
        removeVideo(playlistId, videoId) {
            const playlists = this.getPlaylists();
            const playlist = playlists.find(p => p.id === playlistId);
            if (playlist) {
                playlist.videos = playlist.videos.filter(v => v.id !== videoId);
                this.savePlaylists(playlists);
            }
        },
        render() {
            const playlists = this.getPlaylists();
            if (playlists.length === 0) {
                playlistsGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: rgba(255,255,255,0.1);">
                        <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        <p>لا توجد قوائم تشغيل بعد، ابدأ بإنشاء واحدة!</p>
                    </div>
                `;
                return;
            }

            playlistsGrid.innerHTML = playlists.map(p => {
                const playlistId = VideoEngine.extractPlaylistId(p.name);
                return `
                <div class="playlist-card" data-id="${p.id}">
                    <div class="playlist-header">
                        <div class="playlist-title-label" title="${p.name}">
                            <i class="fa-solid fa-list-ul"></i>
                            <span>${p.name}</span>
                        </div>
                        <div class="playlist-actions">
                            ${playlistId ? `
                                <button onclick="window.loadTVVideo('${playlistId}')" title="تشغيل قائمة اليوتيوب" style="color: var(--metallic-gold);">
                                    <i class="fa-solid fa-play"></i>
                                </button>
                            ` : ''}
                            <button onclick="window.deletePlaylist('${p.id}')" title="حذف القائمة">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                    <div class="playlist-videos">
                        ${p.videos.length === 0 ? 
                            (playlistId ? 
                                '<p style="color:var(--metallic-gold); font-size:0.75rem; text-align:center; padding: 1rem; opacity: 0.6;">هذه القائمة مرتبطة برابط يوتيوب خارجي. استخدم زر التشغيل في الأعلى لمشاهدتها.</p>' :
                                '<p style="color:rgba(255,255,255,0.15); font-size:0.8rem; text-align:center; padding: 1rem;">القائمة فارغة</p>'
                            ) : 
                            p.videos.map(v => `
                            <div class="playlist-video-item ${v.done ? 'is-done' : ''}" onclick="window.loadTVVideo('${v.id}')">
                                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                                    <i class="fa-solid ${v.done ? 'fa-check-circle done-check' : 'fa-circle-play'}" 
                                       onclick="event.stopPropagation(); window.toggleVideoDone('${p.id}', '${v.id}')"></i>
                                    <div style="display: flex; flex-direction: column;">
                                        <span class="video-text" title="${v.title}">${v.title}</span>
                                        ${v.addedAt ? `<span class="video-date"><i class="fa-solid fa-calendar-day" style="font-size: 0.65rem; margin-right: 4px; opacity: 0.5;"></i>${v.addedAt}</span>` : ''}
                                    </div>
                                </div>
                                <i class="fa-solid fa-xmark remove-vid-btn" title="إزالة من القائمة"
                                   onclick="event.stopPropagation(); window.removeVideoFromPlaylist('${p.id}', '${v.id}')"></i>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;}).join('');
        }
    };

    window.deletePlaylist = (id) => {
        if (confirm('هل أنت متأكد من حذف هذه القائمة؟')) {
            PlaylistManager.delete(Number(id));
            Notifications.info('تم حذف قائمة التشغيل');
        }
    };
    window.toggleVideoDone = (pid, vid) => PlaylistManager.toggleDone(Number(pid), vid);
    window.removeVideoFromPlaylist = (pid, vid) => {
        PlaylistManager.removeVideo(Number(pid), vid);
        Notifications.info('تم حذف الفيديو من القائمة');
    };
    window.addToPlaylist = (playlistId) => {
        if (!window.currentTVVideo) {
            Notifications.warning('يرجى تشغيل فيديو أولاً');
            return;
        }
        PlaylistManager.addVideo(Number(playlistId), window.currentTVVideo);
    };

    createPlaylistBtn.onclick = () => {
        let name = prompt('أدخل اسم قائمة التشغيل الجديدة:');
        if (name) {
            name = name.trim();
            if (name.length > 50) name = name.substring(0, 47) + '...';
            PlaylistManager.create(name);
            Notifications.success('تم إنشاء القائمة بنجاح');
        }
    };

    const saveToHistory = (video) => {
        let history = JSON.parse(localStorage.getItem('tv_history') || '[]');
        history = history.filter(v => v.id !== video.id);
        history.unshift(video);
        history = history.slice(0, 15);
        localStorage.setItem('tv_history', JSON.stringify(history));
    };

    const renderHistory = () => {
        const history = JSON.parse(localStorage.getItem('tv_history') || '[]');
        if (history.length === 0) {
            historyContainer.style.display = 'none';
            return;
        }
        
        historyContainer.style.display = 'block';
        historyGrid.innerHTML = history.map(v => `
            <div class="video-card" onclick="window.loadTVVideo('${v.id}')">
                <img src="${v.thumbnail}" alt="${v.title}">
                <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                <div class="video-card-info">
                    <p>${v.title}</p>
                    <span>${v.author}</span>
                </div>
            </div>
        `).join('');
    };

    clearHistoryBtn.onclick = () => {
        if (confirm('هل أنت متأكد من مسح سجل المشاهدة؟')) {
            localStorage.removeItem('tv_history');
            renderHistory();
        }
    };

    window.loadTVVideo = async (idOrPlaylistId) => {
        if (!idOrPlaylistId) return;
        const isPlaylist = idOrPlaylistId.length > 11 || idOrPlaylistId.startsWith('PL');
        
        viewer.innerHTML = window.videoEngine.renderPlayer(idOrPlaylistId, 'full');
        viewer.classList.remove('main-viewer-empty');
        
        infoArea.style.display = 'block';
        controlsBar.style.display = 'flex';
        
        if (isPlaylist) {
            container.querySelector('#video-title').innerText = 'قائمة تشغيل يوتيوب';
            container.querySelector('#video-author').innerHTML = `<i class="fa-solid fa-list-ul"></i> <span>YouTube Playlist</span>`;
            Notifications.info('تم تحميل قائمة التشغيل');
        } else {
            const data = await window.videoEngine.getVideoData(idOrPlaylistId);
            window.currentTVVideo = { id: idOrPlaylistId, title: data.title, author: data.author, thumbnail: data.thumbnail };
            
            container.querySelector('#video-title').innerText = data.title;
            container.querySelector('#video-author').innerHTML = `<i class="fa-solid fa-user"></i> <span>${data.author}</span>`;
            
            saveToHistory(window.currentTVVideo);
            renderHistory();
        }
        
        // Scroll to player
        viewer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const sendPlayerCommand = (func, args = []) => {
        const iframe = container.querySelector('#youtube-player-iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: func,
                args: args
            }), '*');
        }
    };

    let isMuted = false;
    let isPaused = false;

    // Controls Logic
    container.querySelector('#ctrl-mute').onclick = (e) => {
        isMuted = !isMuted;
        sendPlayerCommand(isMuted ? 'mute' : 'unMute');
        e.currentTarget.innerHTML = `<i class="fa-solid fa-volume-${isMuted ? 'xmark' : 'high'}"></i>`;
        Notifications.info(isMuted ? 'تم كتم الصوت' : 'تم تفعيل الصوت');
    };

    container.querySelector('#ctrl-pause').onclick = (e) => {
        isPaused = !isPaused;
        sendPlayerCommand(isPaused ? 'pauseVideo' : 'playVideo');
        e.currentTarget.innerHTML = `<i class="fa-solid fa-${isPaused ? 'play' : 'pause'}"></i>`;
    };

    container.querySelector('#ctrl-next').onclick = () => {
        const history = JSON.parse(localStorage.getItem('tv_history') || '[]');
        if (history.length > 1) {
            // Find current index and play next or random
            const currentIndex = history.findIndex(v => v.id === window.videoEngine.currentVideoId);
            const nextVideo = history[(currentIndex + 1) % history.length];
            window.loadTVVideo(nextVideo.id);
        } else {
            Notifications.warning('لا يوجد فيديوهات تالية في السجل');
        }
    };

    container.querySelector('#ctrl-pip').onclick = () => {
        if (window.videoEngine.currentVideoId) {
            window.videoEngine.minimize();
            Notifications.success('تم تفعيل وضع الصورة داخل صورة');
        }
    };

    container.querySelector('#ctrl-add-playlist').onclick = (e) => {
        e.stopPropagation();
        if (!window.currentTVVideo) {
            Notifications.warning('لا يمكن إضافة قوائم التشغيل إلى المستودع حالياً، فقط الفيديوهات');
            return;
        }
        const playlists = PlaylistManager.getPlaylists();
        if (playlists.length === 0) {
            Notifications.warning('يرجى إنشاء قائمة تشغيل أولاً من الأسفل');
            return;
        }
        
        // Remove existing menu if any
        const existingMenu = controlsBar.querySelector('.floating-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const menu = document.createElement('div');
        menu.className = 'glass-panel floating-menu';
        menu.style.position = 'absolute';
        menu.style.bottom = '60px';
        menu.style.right = '0';
        menu.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.75rem; color: rgba(255,255,255,0.4); text-align: center;">إضافة إلى القائمة</div>
            ${playlists.map(p => `
                <div class="menu-item" onclick="window.addToPlaylist('${p.id}'); this.parentElement.remove();">
                    <i class="fa-solid fa-list-ul"></i> ${p.name}
                </div>
            `).join('')}
        `;
        controlsBar.appendChild(menu);
        
        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    };
    
    renderHistory();
    PlaylistManager.render();

    playBtn.onclick = () => {
        const url = input.value.trim();
        const videoId = VideoEngine.extractVideoId(url);
        const playlistId = VideoEngine.extractPlaylistId(url);
        
        if (videoId || playlistId) {
            window.loadTVVideo(videoId || playlistId);
            input.value = ''; // Clear input after play
        } else {
            Notifications.error('رابط يوتيوب غير صالح');
        }
    };

    // Clean up
    const observer = new MutationObserver((mutations) => {
        if (!document.contains(container)) {
            if (window.videoEngine.currentVideoId) {
                window.videoEngine.minimize();
            }
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return container;
}

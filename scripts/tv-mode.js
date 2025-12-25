import { VideoEngine } from './video-engine.js';
import { Notifications } from './core.js';

export async function renderTVMode() {
    const container = document.createElement('div');
    container.className = 'tv-mode-page';
    
    // Clear persistent player if we are in TV Mode page
    if (window.videoEngine) window.videoEngine.container.innerHTML = '';

    container.innerHTML = `
        <div class="tv-hero-section">
            <div class="tv-header">
                <h1>Elite <span class="gold-text">TV Mode</span></h1>
                <div class="tv-url-input-group">
                    <input type="text" id="youtube-url" placeholder="أدخل رابط فيديو يوتيوب هنا...">
                    <button id="play-custom-video" class="btn btn-primary"><i class="fa-solid fa-play"></i> تشغيل</button>
                </div>
            </div>

            <div id="main-player-viewer" class="main-viewer-empty">
                <div class="empty-state">
                    <i class="fa-solid fa-clapperboard"></i>
                    <p>أدخل رابط الفيديو لمتابعة المشاهدة</p>
                </div>
            </div>
            
            <div class="video-details-area" id="video-info" style="display: none;">
                <h2 id="video-title">عنوان الفيديو</h2>
                <p id="video-desc">وصف الفيديو سيظهر هنا من مصدره الأصلي...</p>
            </div>
            
            <div class="tv-history-section" id="tv-history-container" style="display: none; margin-top: 3rem;">
                <div class="tv-category">
                    <h3 style="display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; color: rgba(255,255,255,0.8);">
                        <i class="fa-solid fa-clock-rotate-left gold-text"></i> 
                        آخر الفيديوهات المشاهدة
                    </h3>
                    <div class="tv-grid" id="tv-history-grid"></div>
                </div>
            </div>
        </div>
    `;

    const input = container.querySelector('#youtube-url');
    const playBtn = container.querySelector('#play-custom-video');
    const viewer = container.querySelector('#main-player-viewer');
    const infoArea = container.querySelector('#video-info');

    const historyContainer = container.querySelector('#tv-history-container');
    const historyGrid = container.querySelector('#tv-history-grid');

    const saveToHistory = (video) => {
        let history = JSON.parse(localStorage.getItem('tv_history') || '[]');
        // Remove if already exists
        history = history.filter(v => v.id !== video.id);
        // Add to beginning
        history.unshift(video);
        // Keep only top 10
        history = history.slice(0, 10);
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
            <div class="video-card" data-id="${v.id}" title="${v.title}">
                <img src="${v.thumbnail}" alt="${v.title}">
                <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                <div style="position:absolute; bottom:0; left:0; right:0; padding:10px; background:linear-gradient(transparent, rgba(0,0,0,0.9));">
                    <p style="font-size:0.8rem; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin:0;">${v.title}</p>
                    <p style="font-size:0.7rem; color:var(--metallic-gold); margin:4px 0 0 0;">${v.author}</p>
                </div>
            </div>
        `).join('');

        historyGrid.querySelectorAll('.video-card').forEach(card => {
            card.onclick = () => window.loadTVVideo(card.dataset.id);
        });
    };

    window.loadTVVideo = async (id) => {
        if (!id) return;
        viewer.innerHTML = window.videoEngine.renderPlayer(id, 'full');
        viewer.classList.remove('main-viewer-empty');
        
        infoArea.style.display = 'block';
        const data = await window.videoEngine.getVideoData(id);
        container.querySelector('#video-title').innerText = data.title;
        container.querySelector('#video-desc').innerText = `بواسطة: ${data.author} • يتم العرض بجودة عالية في وضع التلفاز`;
        
        saveToHistory({
            id: id,
            title: data.title,
            author: data.author,
            thumbnail: data.thumbnail
        });
        renderHistory();
        
        Notifications.success('تم تحميل الفيديو بنجاح');
    };
    
    renderHistory();

    playBtn.onclick = () => {
        const id = VideoEngine.extractVideoId(input.value);
        if (id) {
            window.loadTVVideo(id);
        } else {
            Notifications.error('رابط يوتيوب غير صالح');
        }
    };

    // Clean up when leaving page
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

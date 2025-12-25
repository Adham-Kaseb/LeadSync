export class VideoEngine {
    constructor() {
        this.currentVideoId = null;
        this.isPersistent = false;
        this.container = document.getElementById('persistent-player-anchor');
        this.playerInstance = null;
    }

    static extractVideoId(url) {
        if (!url) return null;
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }

    async getVideoData(videoId) {
        try {
            const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
            const data = await response.json();
            return {
                title: data.title,
                author: data.author_name,
                thumbnail: data.thumbnail_url
            };
        } catch (e) {
            return { title: 'فيديو يوتيوب', author: 'YouTube', thumbnail: '' };
        }
    }

    renderPlayer(videoId, mode = 'full') {
        this.currentVideoId = videoId;
        const playerHtml = `
            <div class="elite-player-wrapper ${mode === 'pip' ? 'is-pip' : ''}" id="lead-video-player">
                <div class="video-ambient-glow" id="ambient-glow"></div>
                <div class="player-container">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
                ${mode === 'pip' ? `
                    <div class="pip-controls">
                        <button onclick="window.videoEngine.expand()" title="تكبير"><i class="fa-solid fa-expand"></i></button>
                        <button onclick="window.videoEngine.close()" title="إغلاق"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                ` : ''}
            </div>
        `;

        if (mode === 'pip') {
            this.container.innerHTML = playerHtml;
            this.isPersistent = true;
        } else {
            return playerHtml;
        }
    }

    minimize() {
        if (!this.currentVideoId) return;
        this.renderPlayer(this.currentVideoId, 'pip');
    }

    expand() {
        window.location.hash = '#tvmode';
        this.close();
    }

    close() {
        this.container.innerHTML = '';
        this.isPersistent = false;
        this.currentVideoId = null;
    }
}

window.videoEngine = new VideoEngine();

import { Storage, Notifications } from './core.js';
import './lib/Howler.js'; 
const { Howl, Howler } = window; 

export class QuranRadio {
    constructor() {
        this.sound = null;
        this.state = 'idle'; 
        this.analyser = null;
        this.dataArray = null;
        this.muted = false;

        this.reciters = JSON.parse(localStorage.getItem('quran_reciters_cache')) || [
            { 
                name: 'إذاعة القرآن الكريم - القاهرة', 
                id: 'cairo', 
                currentMirror: 0, 
                bio: 'البث الرسمي لإذاعة القرآن الكريم من القاهرة، تقدم تلاوات نادرة وبرامج دينية متنوعة على مدار الساعة.',
                mirrors: [
                    'https://n02.radiojar.com/8s5u8s3q80zuv', 
                    'https://radio.mp3quran.net/radio/cairo',
                    'https://stream.radiojar.com/8s5u8s3q80zuv'
                ] 
            },
            { name: 'محمد صديق المنشاوي (تجويد)', id: 'minshawi_mojawwad', currentMirror: 0, bio: 'الشيخ محمد صديق المنشاوي، صاحب الصوت الباكي الخاشع، أحد أعلام التلاوة في العالم الإسلامي، اشتهر بجمال صوته وإتقانه لأحكام التجويد.', mirrors: ['https://backup.qurango.net/radio/mohammed_siddiq_alminshawi_mojawwad'] },
            { name: 'محمد صديق المنشاوي (ترتيل)', id: 'minshawi', currentMirror: 0, bio: 'تلاوة مرتلة برواية حفص عن عاصم للشيخ محمد صديق المنشاوي، تتميز بالوقار والخشوع والالتزام التام بقواعد التجويد.', mirrors: ['https://backup.qurango.net/radio/mohammed_siddiq_alminshawi'] },
            { name: 'محمود خليل الحصري (تجويد)', id: 'hussary', currentMirror: 0, bio: 'الشيخ محمود خليل الحصري، شيخ عموم المقارئ المصرية الأسبق، أول من سجل المصحف المرتل في العالم، ويعد مرجعاً في أحكام التجويد.', mirrors: ['https://backup.qurango.net/radio/mahmoud_khalil_alhussary_mojawwad'] },
            { name: 'عبد الباسط عبد الصمد (تجويد)', id: 'abdulbasit', currentMirror: 0, bio: 'صوت مكة، الشيخ عبد الباسط عبد الصمد، صاحب الحنجرة الذهبية التي طافت أرجاء المعمورة، متميز بنبرات صوته وتفرده في المقامات.', mirrors: ['https://backup.qurango.net/radio/abdulbasit_abdulsamad_mojawwad'] }
        ];
        
        this.currentReciterIndex = parseInt(localStorage.getItem('quran_reciter_idx') || '1'); 
        if (this.currentReciterIndex >= this.reciters.length) this.currentReciterIndex = 1;
        
        this.volume = parseFloat(localStorage.getItem('quran_volume') || '0.5');
        
        Howler.autoUnlock = true;
        Howler.html5PoolSize = 10;
        
        this.onStateChange = null;
        this.initApi();
    }

    async initApi() {
        try {
            const res = await fetch('https://www.mp3quran.net/api/v3/radios?language=ar');
            const data = await res.json();
            if (data && data.radios) {
                const apiReciters = data.radios.map(r => ({
                    name: r.name.trim(),
                    id: r.id.toString(),
                    currentMirror: 0,
                    mirrors: [r.url]
                }));
                
                const cairo = this.reciters.find(rec => rec.id === 'cairo');
                const minshawi_m = this.reciters.find(rec => rec.id === 'minshawi_mojawwad');
                const minshawi_t = this.reciters.find(rec => rec.id === 'minshawi');
                
                const apiRadios = apiReciters.filter(ar => !this.reciters.some(r => r.name === ar.name));
                this.reciters = [cairo, minshawi_m, minshawi_t, ...apiRadios].filter(Boolean);
                localStorage.setItem('quran_reciters_cache', JSON.stringify(this.reciters.slice(0, 100))); 
            }
        } catch (e) {
            console.warn('Failed to fetch radio API, using fallback list', e);
        }
    }

    getCurrentReciter() {
        return this.reciters[this.currentReciterIndex] || this.reciters[0];
    }

    getCurrentUrl() {
        const r = this.getCurrentReciter();
        return r.mirrors[r.currentMirror % r.mirrors.length];
    }

    togglePlay() {
        if (this.state === 'playing' || this.state === 'loading') {
            this.stop();
        } else {
            this.play();
        }
    }

    play() {
        if (this.sound && this.sound.playing()) return;
        
        if (Howler.ctx && Howler.ctx.state === 'suspended') {
            Howler.ctx.resume().catch(e => console.warn('AudioContext resume failed:', e));
        }

        if (this.sound) this.sound.unload();

        const reciter = this.getCurrentReciter();
        const url = this.getCurrentUrl();
        
        this.setState('loading');
        
        if (this.loadTimeout) clearTimeout(this.loadTimeout);
        this.loadTimeout = setTimeout(() => {
            if (this.state === 'loading') {
                console.warn('Radio load timeout');
                this.handleError('TIMEOUT');
            }
        }, 15000);

        try {
            this.sound = new Howl({
                src: [url],
                html5: true, 
                volume: this.volume,
                format: ['mp3', 'aac', 'm4a'],
                autoplay: true,
                onplay: () => {
                    if (this.loadTimeout) clearTimeout(this.loadTimeout);
                    this.setState('playing');
                    this.setupVisualizer();
                    Notifications.success('تم التشغيل بنجاح');
                },
                onpause: () => {
                    if (this.loadTimeout) clearTimeout(this.loadTimeout);
                    this.setState('idle');
                },
                onstop: () => this.setState('idle'),
                onend: () => this.setState('idle'),
                onloaderror: (id, err) => {
                    console.warn(`Howler Load Error on ${url}:`, err);
                    this.handleError('LOAD_ERR');
                },
                onplayerror: (id, err) => {
                    console.warn(`Howler Play Error on ${url}:`, err);
                    this.handleError('PLAY_ERR'); 
                }
            });
        } catch (e) {
            console.error('Howl initialization error:', e);
            this.handleError('INIT_ERR');
        }
    }

    setupVisualizer() {
        try {
            const ctx = Howler.ctx;
            if (!ctx) return;

            if (!this.analyser) {
                this.analyser = ctx.createAnalyser();
                this.analyser.fftSize = 64;
                const bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(bufferLength);
            }
            
            try {
                Howler.masterGain.connect(this.analyser);
            } catch (e) {}
        } catch (e) {
            console.warn('Visualizer setup failed:', e);
        }
    }

    getFrequencyData() {
        if (!this.analyser || !this.dataArray) return null;
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // If all zeros while playing, simulate activity (for HTML5 mode)
        const total = this.dataArray.reduce((a, b) => a + b, 0);
        if (total === 0 && this.state === 'playing') {
            const time = Date.now() / 150;
            for (let i = 0; i < this.dataArray.length; i++) {
                // Mix multiple sine waves for a "speech-like" look
                const wave1 = Math.sin(time + i * 0.5) * 40;
                const wave2 = Math.sin(time * 0.7 + i * 0.3) * 30;
                const noise = Math.random() * 20;
                this.dataArray[i] = Math.max(0, 100 + wave1 + wave2 + noise);
            }
        }
        return this.dataArray;
    }

    stop() {
        if (this.sound) {
            this.sound.stop(); 
            this.sound.unload(); 
        }
        this.setState('idle');
    }

    switchReciter(dir = 1) {
        this.stop();
        this.currentReciterIndex = (this.currentReciterIndex + dir + this.reciters.length) % this.reciters.length;
        localStorage.setItem('quran_reciter_idx', this.currentReciterIndex);
        
        const r = this.getCurrentReciter();
        r.currentMirror = 0; 
        
        Notifications.info(`القارئ: ${r.name}`);
        setTimeout(() => this.play(), 200);
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.sound) this.sound.volume(this.muted ? 0 : this.volume);
        localStorage.setItem('quran_volume', this.volume);
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.sound) this.sound.mute(this.muted);
        return this.muted;
    }

    refresh() {
        this.stop();
        setTimeout(() => this.play(), 300);
    }

    nextMirror() {
        const r = this.getCurrentReciter();
        if (r.mirrors.length <= 1) return false;
        
        r.currentMirror = (r.currentMirror + 1) % r.mirrors.length;
        Notifications.info(`جاري التبديل إلى الخادم رقم ${r.currentMirror + 1}`);
        this.refresh();
        return true;
    }

    setState(newState) {
        this.state = newState;
        if (this.onStateChange) this.onStateChange(this.state, this.getCurrentReciter());
    }

    handleError(type) {
        const reciter = this.getCurrentReciter();
        if (!reciter) return;
        
        console.warn(`Howler Error (${type}) on ${reciter.name}. Current mirror: ${reciter.currentMirror}`);
        
        if (this.sound) {
            this.sound.stop();
            this.sound.unload();
            this.sound = null;
        }

        reciter.currentMirror++;
        
        if (reciter.currentMirror >= reciter.mirrors.length) {
            this.setState('error');
            Notifications.error(`تعذر الاتصال بـ ${reciter.name}، جرب قارئاً آخر`);
            reciter.currentMirror = 0; 
            return;
        }

        Notifications.warning(`جاري تبديل الخادم...`);
        setTimeout(() => this.play(), 1000);
    }
}

/**
 * LeadSync Ultra-Smooth Scroller
 * Implements a premium, weighted virtual scroll with easing.
 */
export class SmoothScroller {
    constructor(options = {}) {
        this.speed = options.speed || 0.05;      
        this.strength = options.strength || 1.0; 
        this.scrollPos = window.scrollY;
        this.targetPos = window.scrollY;
        this.isAnimating = false;
        
        this.rafBound = this.raf.bind(this);
        this.init();
    }

    init() {
        // Use passive: false to allow preventDefault
        window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        
        // Sync on manual interaction
        window.addEventListener('scroll', () => {
            if (!this.isAnimating) {
                this.scrollPos = window.scrollY;
                this.targetPos = window.scrollY;
            }
        }, { passive: true });

        // Kill native smooth scroll conflicts
        document.documentElement.style.scrollBehavior = 'auto';

        this.rafBound();
    }

    onWheel(e) {
        // Sophisticated detection for internal scrollable areas
        const path = e.composedPath();
        const isInternalScroll = path.some(el => {
            if (!el || !el.style || el === document.body || el === document.documentElement) return false;
            const style = window.getComputedStyle(el);
            const overflow = style.overflowY;
            return (overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight;
        });

        if (isInternalScroll) return;

        e.preventDefault();
        
        // Momentum accumulation
        const delta = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
        this.targetPos += delta * this.strength;
        
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.targetPos = Math.max(0, Math.min(this.targetPos, maxScroll));
        
        this.isAnimating = true;
    }

    raf() {
        if (this.isAnimating) {
            this.animate();
        }
        requestAnimationFrame(this.rafBound);
    }

    animate() {
        const diff = this.targetPos - this.scrollPos;
        
        // Easing factor (Lerp) from options
        const ease = this.speed; 
        
        if (Math.abs(diff) < 0.1) {
            this.scrollPos = this.targetPos;
            window.scrollTo(0, this.scrollPos);
            this.isAnimating = false;
        } else {
            this.scrollPos += diff * ease;
            window.scrollTo(0, this.scrollPos);
        }
    }

    scrollTo(pos) {
        this.targetPos = pos;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        this.targetPos = Math.max(0, Math.min(this.targetPos, maxScroll));
    }

    destroy() {
        window.removeEventListener('wheel', this.onWheel);
    }
}

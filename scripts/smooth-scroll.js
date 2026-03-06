export class MomentumScroll {
    constructor(target, speed = 0.08, smoothness = 0.9) {
        this.target = target;
        this.speed = speed;
        this.smoothness = smoothness;
        
        this.currentY = 0;
        this.targetY = 0;
        this.rafId = null;
        
        this.wrapper = null;
        this.resizeObserver = null;
        
        this.init();
    }

    init() {
        if (!this.target) return;

        this.target.style.overflow = 'hidden'; 
        this.target.style.position = 'relative';

        this.wrapper = document.createElement('div');
        this.wrapper.style.transform = 'translateY(0)';
        this.wrapper.style.willChange = 'transform';
        this.wrapper.style.width = '100%'; 
        
        while (this.target.firstChild) {
            this.wrapper.appendChild(this.target.firstChild);
        }
        this.target.appendChild(this.wrapper);

        this.resizeObserver = new ResizeObserver(() => {
            this.clamp();
        });
        this.resizeObserver.observe(this.wrapper);
        this.resizeObserver.observe(this.target);

        this.wheelHandler = this.onWheel.bind(this);
        this.target.addEventListener('wheel', this.wheelHandler, { passive: false });
        
        this.update();
    }

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY;
        this.targetY += delta;
        this.clamp();
    }

    clamp() {
        if (!this.wrapper) return;
        const maxScroll = Math.max(0, this.wrapper.scrollHeight - this.target.clientHeight + 40); 
        this.targetY = Math.max(0, Math.min(this.targetY, maxScroll));
    }

    update() {
        const diff = this.targetY - this.currentY;
        this.currentY += diff * this.speed;
        
        if (Math.abs(diff) < 0.1) {
            this.currentY = this.targetY;
        }

        if (this.wrapper) {
            this.wrapper.style.transform = `translateY(-${this.currentY}px)`;
        }
        
        this.rafId = requestAnimationFrame(this.update.bind(this));
    }

    refresh() {
        this.currentY = 0;
        this.targetY = 0;
        this.clamp();
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.target && this.wheelHandler) {
            this.target.removeEventListener('wheel', this.wheelHandler);
        }
        if (this.resizeObserver) this.resizeObserver.disconnect();
    }
}

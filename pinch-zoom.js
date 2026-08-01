/* ═══════════════════════════════════════════════════
   이성효의 명리학 - 안드로이드 모바일 핀치 줌 & 제스처 엔진 v1.0
   (Pinch-to-Zoom, Pan/Drag, Double-Tap Reset)
   ═══════════════════════════════════════════════════ */

class PinchZoomEngine {
    constructor(targetElement, options = {}) {
        this.target = typeof targetElement === 'string' ? document.querySelector(targetElement) : targetElement;
        if (!this.target) return;

        this.minScale = options.minScale || 0.8;
        this.maxScale = options.maxScale || 3.5;
        this.scale = 1.0;

        this.posX = 0;
        this.posY = 0;
        this.startPosX = 0;
        this.startPosY = 0;

        this.initialDistance = 0;
        this.isDragging = false;
        this.isPinching = false;
        this.lastTap = 0;

        this.fontSizeScale = 1.0; // 0.8 to 1.5

        this.init();
    }

    init() {
        this.target.style.transformOrigin = 'center top';
        this.target.style.willChange = 'transform';
        this.target.style.transition = 'transform 0.05s ease-out';

        // Touch events
        this.target.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.target.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.target.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.target.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));

        // Mouse drag fallback for testing
        this.target.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', () => this.handleMouseUp());
    }

    getDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleTouchStart(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            this.isPinching = true;
            this.isDragging = false;
            this.initialDistance = this.getDistance(e.touches);
            this.baseScale = this.scale;
        } else if (e.touches.length === 1) {
            const now = Date.now();
            if (now - this.lastTap < 300) {
                e.preventDefault();
                this.resetZoom();
                this.lastTap = 0;
                return;
            }
            this.lastTap = now;

            if (this.scale > 1.05) {
                this.isDragging = true;
                this.startPosX = e.touches[0].clientX - this.posX;
                this.startPosY = e.touches[0].clientY - this.posY;
            }
        }
    }

    handleTouchMove(e) {
        if (this.isPinching && e.touches.length === 2) {
            e.preventDefault();
            const currentDistance = this.getDistance(e.touches);
            if (this.initialDistance > 0) {
                const newScale = this.baseScale * (currentDistance / this.initialDistance);
                this.scale = Math.min(Math.max(newScale, this.minScale), this.maxScale);
                this.updateTransform();
            }
        } else if (this.isDragging && e.touches.length === 1) {
            e.preventDefault();
            this.posX = e.touches[0].clientX - this.startPosX;
            this.posY = e.touches[0].clientY - this.startPosY;
            this.updateTransform();
        }
    }

    handleTouchEnd(e) {
        if (e.touches.length < 2) {
            this.isPinching = false;
        }
        if (e.touches.length === 0) {
            this.isDragging = false;
        }
    }

    handleMouseDown(e) {
        // Allow mouse drag if zoomed or holding CTRL
        if (this.scale > 1.05 || e.ctrlKey) {
            this.isDragging = true;
            this.startPosX = e.clientX - this.posX;
            this.startPosY = e.clientY - this.posY;
        }
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            this.posX = e.clientX - this.startPosX;
            this.posY = e.clientY - this.startPosY;
            this.updateTransform();
        }
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    zoomIn(delta = 0.2) {
        this.scale = Math.min(this.scale + delta, this.maxScale);
        this.updateTransform();
    }

    zoomOut(delta = 0.2) {
        this.scale = Math.max(this.scale - delta, this.minScale);
        if (this.scale <= 1.0) {
            this.posX = 0;
            this.posY = 0;
        }
        this.updateTransform();
    }

    resetZoom() {
        this.scale = 1.0;
        this.posX = 0;
        this.posY = 0;
        this.fontSizeScale = 1.0;
        document.documentElement.style.setProperty('--user-font-scale', '1.0');
        this.updateTransform();
    }

    changeFontSize(delta) {
        this.fontSizeScale = Math.min(Math.max(this.fontSizeScale + delta, 0.8), 1.6);
        document.documentElement.style.setProperty('--user-font-scale', this.fontSizeScale.toFixed(2));
        const badge = document.querySelector('#fontSizeBadge');
        if (badge) badge.textContent = `${Math.round(this.fontSizeScale * 100)}%`;
    }

    updateTransform() {
        this.target.style.transform = `translate3d(${this.posX}px, ${this.posY}px, 0) scale(${this.scale})`;
        
        const badge = document.querySelector('#zoomScaleBadge');
        if (badge) badge.textContent = `${Math.round(this.scale * 100)}%`;
    }
}

window.PinchZoomEngine = PinchZoomEngine;

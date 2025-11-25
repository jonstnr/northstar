class ShipExplosion {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.frame = 0;
        this.frameTimer = 0;
        this.frameSpeed = 5; // Ticks per frame (slower for detailed animation)
        this.maxFrames = 6; // 6 explosion frames
        this.scale = 1.0;
    }

    spawn(x, y, z, scale = 1.0) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.z = z;
        this.frame = 0;
        this.frameTimer = 0;
        this.scale = scale;
    }

    update() {
        if (!this.active) return;

        this.frameTimer++;

        if (this.frameTimer >= this.frameSpeed) {
            this.frameTimer = 0;
            this.frame++;

            if (this.frame >= this.maxFrames) {
                this.active = false;
            }
        }

        // DON'T move on Z-axis - stay at player's constant Z position (300)
        // This ensures all frames are visible at the same screen position
    }

    draw(ctx) {
        if (!this.active || !this.game.shipExplosionLoaded) return;

        const p = this.game.project(this.x, this.y, this.z);
        if (!p) return;

        // Use current frame
        const frameName = `ship_explosion_${this.frame + 1}`;
        const img = this.game.spriteManager.individualImages[frameName];

        if (!img) return;

        // Progressive scaling - explosion grows larger in final frames
        let frameScale = 1.0;
        if (this.frame === 4) frameScale = 1.2; // Frame 5: 20% bigger
        if (this.frame === 5) frameScale = 1.3; // Frame 6: 30% bigger

        const baseSize = 100; // Base size for explosion
        const size = baseSize * this.scale * frameScale * p.scale;

        ctx.save();

        // Use source-over for solid rendering
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.95;

        ctx.translate(p.x, p.y);

        // Add filters for impact
        ctx.filter = 'contrast(1.4) brightness(1.3)';

        // Draw explosion frame
        const w = size;
        const h = size * (img.height / img.width); // Maintain aspect ratio
        ctx.drawImage(img, -w / 2, -h / 2, w, h);

        ctx.filter = 'none';
        ctx.restore();
    }
}

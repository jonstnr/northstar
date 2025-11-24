class Explosion {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.frame = 0;
        this.frameTimer = 0;
        this.frameSpeed = 4; // Ticks per frame
        this.maxFrames = 4; // 4 explosion frames
    }

    spawn(x, y, z) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.z = z;
        this.frame = 0;
        this.frameTimer = 0;
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

        // Move with game speed
        this.z -= this.game.speed;
    }

    draw(ctx) {
        if (!this.active || !this.game.spritesLoaded) return;

        const p = this.game.project(this.x, this.y, this.z);
        if (!p) return;

        const size = 80 * p.scale; // Explosion size

        ctx.save();

        // Use source-over for solid rendering with 90% opacity
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.9;

        ctx.translate(p.x, p.y);

        // Add filters for visibility
        ctx.filter = 'contrast(1.5) brightness(1.4)';

        // Draw current explosion frame
        const frameName = `explosion_${this.frame + 1}`;
        this.game.spriteManager.drawIndividualImage(
            ctx,
            frameName,
            0, 0,
            size / 40, // Scale
            0 // No rotation
        );

        ctx.filter = 'none';
        ctx.restore();
    }
}

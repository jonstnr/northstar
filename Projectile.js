class Projectile {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.width = 10;
        this.height = 10;
        this.speed = 600 / 60; // px per frame
        this.color = '#00E5FF';
    }

    spawn(x, y, z) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    update() {
        if (!this.active) return;

        // Move forward (away from camera? No, vertical shooter usually shoots UP screen, which is +Z or -Z?
        // In our engine, Z=0 is camera, MaxZ is far.
        // If we are shooting "into" the screen, Z increases.
        // If we are shooting "up" the screen in 2D, Y decreases.
        // BUT, our game is pseudo-3D. Objects come from MaxZ to 0.
        // So projectiles should go from 0 to MaxZ?
        // Wait, the prompt says "Vertical Shooter". Usually that means 2D top down.
        // But we have a "Pseudo-3D Projection Engine".
        // "The Z-Axis Rule: All objects must spawn at MAX_Z and move towards Z=0".
        // So enemies come TOWARDS us.
        // So projectiles should go AWAY from us (Z increases).

        this.z += this.speed;

        if (this.z > CONFIG.MAX_DRAW_DISTANCE) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const p = this.game.project(this.x, this.y, this.z);
        if (!p) return;

        // Projectile should look like a laser bolt
        // We can project a point slightly ahead to make a line
        const p2 = this.game.project(this.x, this.y, this.z + 50);

        if (p2) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 4 * p.scale;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Core
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2 * p.scale;
            ctx.stroke();
        }
    }
}

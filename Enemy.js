class Enemy {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.type = 'diver'; // diver, weaver, sweeper
        this.width = 60;
        this.height = 60;
        this.timer = 0;

        // State
        this.startX = 0;
    }

    spawn(z, type = 'diver', x = null) {
        this.active = true;
        this.z = z;
        this.type = type;
        this.timer = 0;
        this.y = CONFIG.FLOOR_Y;

        if (x !== null) {
            this.x = x;
            this.startX = x;
        } else {
            // Fallback random (shouldn't be used in Wave mode)
            this.x = (Math.random() - 0.5) * 3000;
            this.startX = this.x;
        }
    }

    update() {
        if (!this.active) return;

        // Move towards camera
        let speed = this.game.speed;
        let enemySpeed = 0;

        // Formation / Type Logic
        if (this.type === EnemyType.DIVER) {
            enemySpeed = 20;
            // Divers just go straight, but if they have an offset, they keep it.

        } else if (this.type === EnemyType.WEAVER) {
            // Seeker Behavior: Lerp towards player X
            enemySpeed = 15;
            const targetX = this.game.player.x;
            const lerpFactor = 0.02; // Slow tracking
            this.x += (targetX - this.x) * lerpFactor;

        } else if (this.type === EnemyType.SWEEPER) {
            enemySpeed = 30;
            // Sweepers move horizontally
            // We can use a sine wave or simple direction based on startX
            if (this.startX < 0) {
                this.x += 10; // Move Right
            } else {
                this.x -= 10; // Move Left
            }
        }

        this.z -= (this.game.speed + enemySpeed);

        if (this.z < 10) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const p = this.game.project(this.x, this.y, this.z);
        if (!p) return;

        const size = this.width * p.scale;

        // Red Circle Visuals
        ctx.fillStyle = 'rgba(255, 0, 0, 0.65)'; // 65% Opacity Red
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner Core
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Starfield {
    constructor(game, count = 200) {
        this.game = game;
        this.count = count;
        this.stars = [];
        this.init();
    }

    init() {
        for (let i = 0; i < this.count; i++) {
            this.stars.push({
                x: (Math.random() - 0.5) * 4000,
                y: (Math.random() - 0.5) * 4000,
                z: Math.random() * CONFIG.MAX_DRAW_DISTANCE,
                size: Math.random() * 2 + 0.5
            });
        }
    }

    update() {
        this.stars.forEach(star => {
            star.z -= this.game.speed * 0.5; // Parallax: Move slower than foreground

            if (star.z <= 0) {
                star.z = CONFIG.MAX_DRAW_DISTANCE;
                star.x = (Math.random() - 0.5) * 4000;
                star.y = (Math.random() - 0.5) * 4000;
            }
        });
    }

    draw(ctx) {
        ctx.fillStyle = '#FFFFFF';
        this.stars.forEach(star => {
            const p = this.game.project(star.x, star.y, star.z);
            if (p) {
                const alpha = Math.min(1, star.z / 1000); // Fade in distance
                ctx.globalAlpha = alpha * (Math.random() * 0.5 + 0.5); // Twinkle

                const s = star.size * p.scale;
                ctx.beginPath();
                ctx.rect(p.x, p.y, s, s);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1.0;
    }
}

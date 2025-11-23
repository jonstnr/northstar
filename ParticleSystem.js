class ParticleSystem {
    constructor(game) {
        this.game = game;
        this.particles = [];
    }

    createExplosion(x, y, z, color, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                z: z,
                vx: (Math.random() - 0.5) * 50,
                vy: (Math.random() - 0.5) * 50,
                vz: (Math.random() - 0.5) * 50,
                life: 1.0,
                color: color
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
            p.life -= 0.05;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            const proj = this.game.project(p.x, p.y, p.z);
            if (proj) {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                const size = 5 * proj.scale;
                ctx.beginPath();
                ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1.0;
    }
}

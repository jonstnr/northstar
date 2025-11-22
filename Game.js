class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Configuration
        this.focalLength = 400;
        this.cx = this.width / 2;
        this.cy = this.height / 2;
        this.speed = 20; // Units per frame
        this.gridSize = 4000; // Width of the floor
        this.gridSpacing = 200; // Distance between lines
        this.horizonY = this.cy; // Horizon at center for now, or slightly higher? Let's keep center.

        // State
        this.offsetZ = 0;

        // Bindings
        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);

        window.addEventListener('resize', this.resize);

        this.init();
    }

    init() {
        this.loop();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.cx = this.width / 2;
        this.cy = this.height / 2;
    }

    project(x, y, z) {
        if (z <= 0) return null; // Behind or at camera
        const scale = this.focalLength / z;
        const sx = this.cx + x * scale;
        const sy = this.cy + y * scale;
        return { x: sx, y: sy, scale: scale };
    }

    update() {
        // Move forward
        this.offsetZ -= this.speed;
        if (this.offsetZ <= 0) {
            this.offsetZ += this.gridSpacing;
        }
    }

    draw() {
        // Clear background
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Set neon style
        this.ctx.globalCompositeOperation = 'lighter';
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#FF00FF'; // Magenta for floor

        // Draw Horizon
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.cy);
        this.ctx.lineTo(this.width, this.cy);
        this.ctx.strokeStyle = '#00FFFF'; // Cyan Horizon
        this.ctx.stroke();

        // Draw Floor Grid
        this.ctx.strokeStyle = '#FF00FF';

        // 1. Vertical Lines (Parallel to Z axis)
        // They go from Z=Near to Z=Far
        const maxZ = 2000; // Draw distance
        const numLines = 20;
        const floorY = 200; // Units below camera

        for (let i = -numLines / 2; i <= numLines / 2; i++) {
            const x = i * this.gridSpacing;

            const p1 = this.project(x, floorY, 10); // Near clip
            const p2 = this.project(x, floorY, maxZ); // Far clip

            if (p1 && p2) {
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
            }
        }

        // 2. Horizontal Lines (Perpendicular to Z axis)
        // These move towards the camera
        // We draw them at z = offsetZ + n * gridSpacing
        for (let z = this.offsetZ; z < maxZ; z += this.gridSpacing) {
            if (z < 10) continue; // Near clip

            // We need a line from left to right at this Z depth
            // Let's say the floor is infinite, but we only draw a segment
            const leftX = -(numLines / 2) * this.gridSpacing;
            const rightX = (numLines / 2) * this.gridSpacing;

            const pLeft = this.project(leftX, floorY, z);
            const pRight = this.project(rightX, floorY, z);

            if (pLeft && pRight) {
                this.ctx.beginPath();
                this.ctx.moveTo(pLeft.x, pLeft.y);
                this.ctx.lineTo(pRight.x, pRight.y);
                this.ctx.stroke();
            }
        }
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

// Start the game
window.onload = () => {
    const game = new Game();
};

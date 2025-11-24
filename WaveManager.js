class WaveManager {
    constructor(game) {
        this.game = game;
        this.currentWaveIndex = 0;
        this.frameTimer = 0;
        this.isWaveActive = false;
        this.waveComplete = false;
        this.waveDelayTimer = 0;
        this.hasPlayedWaveComplete = false;
    }

    start() {
        this.currentWaveIndex = 0;
        this.startWave(0);
    }

    startWave(index) {
        let waveData;

        if (index < WAVES.length) {
            waveData = WAVES[index];
        } else {
            // Procedural Wave Generation (Infinite Scaling)
            console.log(`Generating Procedural Wave ${index + 1}`);
            this.game.baseSpeed += 2; // Progressive speed increase

            const isAggressive = index >= 7; // Wave 8+ (0-indexed)
            const numEnemies = 20 + (index * 2);
            const numObstacles = 60 + (index * 5);

            const enemies = [];
            const obstacles = [];

            // Enemy Generation
            let delayCursor = 60;
            for (let i = 0; i < numEnemies; i++) {
                if (isAggressive && i % 4 === 0 && Math.random() > 0.3) {
                    // SQUAD SPAWN (Groups of 3-4)
                    const squadSize = 3 + Math.floor(Math.random() * 2); // 3 or 4
                    const squadType = Math.random() > 0.5 ? 'sweeper' : 'weaver';
                    const baseX = (Math.random() - 0.5) * 1000; // Center bias

                    for (let j = 0; j < squadSize; j++) {
                        enemies.push({
                            delay: delayCursor + (j * 20), // Tight grouping
                            z: 7000,
                            type: squadType,
                            x: baseX + (j * 100) - ((squadSize * 100) / 2) // Line formation
                        });
                    }
                    delayCursor += 150; // Gap after squad
                } else {
                    // Standard Spawn
                    enemies.push({
                        delay: delayCursor,
                        z: 7000,
                        type: ['diver', 'weaver', 'sweeper'][Math.floor(Math.random() * 3)],
                        x: (Math.random() - 0.5) * 3000
                    });
                    delayCursor += 80; // Standard gap
                }
            }

            // Obstacle Generation
            for (let i = 0; i < numObstacles; i++) {
                obstacles.push({
                    delay: i * 20,
                    z: 7000,
                    type: Math.random() > 0.5 ? 'crystal' : 'pyramid',
                    x: (Math.random() - 0.5) * 3000
                });
            }

            waveData = { enemies, obstacles };
        }

        this.currentWaveData = waveData; // Store for update loop
        this.currentWaveIndex = index;
        this.frameTimer = 0;
        this.isWaveActive = true;
        this.waveComplete = false;
        this.hasPlayedWaveComplete = false;
        this.game.enemiesSpawnedInWave = 0;

        // Play wave start sound
        this.game.audio.playWaveStart();

        console.log(`Starting Wave ${index + 1}`);
    }

    update() {
        if (!this.isWaveActive) {
            // Inter-wave delay
            this.waveDelayTimer++;

            // Countdown ticks at specific intervals (60fps assumed)
            // Tick at 2s, 1.5s, 1s, 0.5s remaining
            if (this.waveDelayTimer === 60 || this.waveDelayTimer === 90 ||
                this.waveDelayTimer === 120 || this.waveDelayTimer === 150) {
                this.game.audio.playWaveCountdown();
            }

            // Clear wave transition text after 2 seconds
            if (this.waveDelayTimer === 120) {
                this.game.showWaveTransition = false;
            }

            if (this.waveDelayTimer > 180) { // 3 seconds
                this.waveDelayTimer = 0;
                this.startWave(this.currentWaveIndex + 1);
            }
            return;
        }



        const waveData = this.currentWaveData;
        this.frameTimer++;

        // Spawn Enemies
        waveData.enemies.forEach(cfg => {
            if (this.frameTimer === cfg.delay) {
                const enemy = this.game.getInactiveEnemy();
                if (enemy) {
                    enemy.spawn(cfg.z, cfg.type, cfg.x);
                }

                // Trailing Enemies (Difficulty > 60,000)
                if (this.game.score > 60000 && Math.random() < 0.5) {
                    const shadow = this.game.getInactiveEnemy();
                    if (shadow) {
                        // Spawn slightly behind and offset
                        shadow.spawn(cfg.z + 600, cfg.type, cfg.x + 150);
                    }
                }
            }
        });

        // Spawn Obstacles
        waveData.obstacles.forEach(cfg => {
            if (this.frameTimer === cfg.delay) {
                const obs = this.game.getInactiveObstacle();
                if (obs) {
                    obs.spawn(cfg.z, cfg.type, cfg.x);
                }
            }
        });

        // Check for Wave Completion
        // Simple heuristic: if we passed the last spawn time + buffer, AND no enemies are active
        const lastEnemyTime = waveData.enemies.length > 0 ? waveData.enemies[waveData.enemies.length - 1].delay : 0;
        const lastObsTime = waveData.obstacles.length > 0 ? waveData.obstacles[waveData.obstacles.length - 1].delay : 0;
        const lastEventTime = Math.max(lastEnemyTime, lastObsTime);

        if (this.frameTimer > lastEventTime + 200) {
            if (!this.game.enemies.some(e => e.active)) {
                this.isWaveActive = false;
                this.game.waveComplete = true; // Trigger UI
                this.game.wave++; // UI counter

                // Show Transition Text
                this.game.showWaveTransition = true;
                this.game.waveTransitionText = `WAVE ${this.currentWaveIndex + 1} COMPLETE - PREPARE FOR WAVE ${this.currentWaveIndex + 2}`;

                // Play wave complete sound (only once)
                if (!this.hasPlayedWaveComplete) {
                    this.game.audio.playWaveComplete();
                    this.hasPlayedWaveComplete = true;
                }
            }
        }
    }
}

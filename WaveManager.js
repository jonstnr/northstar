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
        if (index >= WAVES.length) {
            // Loop or End? Let's loop with higher speed for now
            this.currentWaveIndex = 0;
            this.game.baseSpeed += 5; // Difficulty up
            index = 0;
        }

        this.currentWaveIndex = index;
        this.frameTimer = 0;
        this.isWaveActive = true;
        this.waveComplete = false;
        this.hasPlayedWaveComplete = false;
        this.game.enemiesSpawnedInWave = 0; // Reset tracker

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

            if (this.waveDelayTimer > 180) { // 3 seconds
                this.waveDelayTimer = 0;
                this.startWave(this.currentWaveIndex + 1);
            }
            return;
        }

        const waveData = WAVES[this.currentWaveIndex];
        this.frameTimer++;

        // Spawn Enemies
        waveData.enemies.forEach(cfg => {
            if (this.frameTimer === cfg.delay) {
                const enemy = this.game.getInactiveEnemy();
                if (enemy) {
                    enemy.spawn(cfg.z, cfg.type, cfg.x);
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

                // Play wave complete sound (only once)
                if (!this.hasPlayedWaveComplete) {
                    this.game.audio.playWaveComplete();
                    this.hasPlayedWaveComplete = true;
                }
            }
        }
    }
}

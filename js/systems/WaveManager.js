class WaveManager {
    constructor(location) {
        this.location = location;
        this.wave = 0;
        this.waveTimer = 0;
        this.active = false;
        this.playerLevel = 1;
    }

    start(playerLevel) {
        this.active = true;
        this.playerLevel = playerLevel;
        this.wave = 0;
        this.waveTimer = 0;
        this.spawnWave();
    }

    stop() {
        this.active = false;
    }

    update(deltaTime, player) {
        if (!this.active) return;

        this.playerLevel = player.level;
        this.waveTimer += deltaTime;

        if (this.waveTimer >= CONSTANTS.ARENA.WAVE_INTERVAL) {
            this.waveTimer = 0;
            this.spawnWave();
        }
    }

    spawnWave() {
        this.wave++;
        const mobCount = CONSTANTS.ARENA.INITIAL_MOBS + (this.wave - 1) * CONSTANTS.ARENA.MOBS_PER_WAVE;

        const levelTier = Math.floor(this.playerLevel / CONSTANTS.ARENA.LEVEL_SCALE_INTERVAL);
        const powerMultiplier = Math.pow(CONSTANTS.ARENA.LEVEL_SCALE_POWER, levelTier);

        console.log(`🌊 Волна ${this.wave}! Спавним ${mobCount} мобов. Сила: x${powerMultiplier.toFixed(2)}`);

        const mapW = this.location.mapWidth || CONSTANTS.ARENA.MAP_WIDTH;
        const mapH = this.location.mapHeight || CONSTANTS.ARENA.MAP_HEIGHT;

        for (let i = 0; i < mobCount; i++) {
            let x, y;
            let attempts = 0;
            let validSpawn = false;

            while (attempts < 100 && !validSpawn) {
                const tileX = 2 + Math.floor(Math.random() * (mapW - 4));
                const tileY = 2 + Math.floor(Math.random() * (mapH - 4));

                x = tileX * CONSTANTS.TILE_SIZE;
                y = tileY * CONSTANTS.TILE_SIZE;

                if (this.location.map[tileY] && this.location.map[tileY][tileX] !== 7) {
                    const distFromSpawn = Math.hypot(
                        x - (this.location.spawnX || 3 * CONSTANTS.TILE_SIZE),
                        y - (this.location.spawnY || 3 * CONSTANTS.TILE_SIZE)
                    );
                    if (distFromSpawn > 150) {
                        validSpawn = true;
                    }
                }
                attempts++;
            }

            if (!validSpawn) {
                for (let ty = 2; ty < mapH - 2 && !validSpawn; ty++) {
                    for (let tx = 2; tx < mapW - 2 && !validSpawn; tx++) {
                        if (this.location.map[ty] && this.location.map[ty][tx] !== 7) {
                            x = tx * CONSTANTS.TILE_SIZE;
                            y = ty * CONSTANTS.TILE_SIZE;
                            validSpawn = true;
                        }
                    }
                }
            }

            if (validSpawn) {
                // 🆕 ArenaBat теперь берётся из Enemy.js (загружается раньше)
                const bat = new ArenaBat(x, y, powerMultiplier, this.wave);
                this.location.entities.push(bat);
            } else {
                console.warn(`⚠️ Не удалось найти точку спавна для моба #${i}`);
            }
        }
    }
}
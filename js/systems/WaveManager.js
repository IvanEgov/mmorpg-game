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
        
        // Масштабирование силы: каждые 3 уровня героя
        const levelTier = Math.floor(this.playerLevel / CONSTANTS.ARENA.LEVEL_SCALE_INTERVAL);
        const powerMultiplier = Math.pow(CONSTANTS.ARENA.LEVEL_SCALE_POWER, levelTier);

        console.log(`🌊 Волна ${this.wave}! Спавним ${mobCount} мобов. Множитель силы: x${powerMultiplier.toFixed(2)}`);

        for (let i = 0; i < mobCount; i++) {
            // Спавним в случайном месте карты, но подальше от игрока
            let x, y;
            let attempts = 0;
            do {
                x = (2 + Math.random() * (CONSTANTS.ARENA.MAP_WIDTH - 4)) * CONSTANTS.TILE_SIZE;
                y = (2 + Math.random() * (CONSTANTS.ARENA.MAP_HEIGHT - 4)) * CONSTANTS.TILE_SIZE;
                attempts++;
            } while (
                !this.location.isWalkable(x, y) || 
                Math.hypot(x - this.location.spawnX, y - this.location.spawnY) < 200 && 
                attempts < 30
            );

            // Создаём "улучшенную" летучую мышь
            const bat = new ArenaBat(x, y, powerMultiplier, this.wave);
            this.location.entities.push(bat);
        }
    }
}

// === Усиленная летучая мышь для арены ===
class ArenaBat extends Enemy {
    constructor(x, y, powerMultiplier, wave) {
        super(x, y, 'bat');
        
        // Масштабируем характеристики
        this.hp = Math.floor(CONSTANTS.ARENA.BAT_BASE_HP * powerMultiplier);
        this.maxHp = this.hp;
        this.atk = Math.floor(CONSTANTS.ARENA.BAT_BASE_ATK * powerMultiplier);
        this.speed = CONSTANTS.ARENA.BAT_BASE_SPEED + (wave * 0.05); // Чуть быстрее с волной
        this.xpReward = Math.floor(30 * powerMultiplier);
        this.goldReward = Math.floor(15 * powerMultiplier);
        
        this.wave = wave;
        this.powerMultiplier = powerMultiplier;
    }

    // Переопределяем рендер — делаем мышь краснее с ростом волны
    render(ctx) {
        if (this.isDead) return;
        const ts = CONSTANTS.TILE_SIZE;
        const centerX = this.x + ts / 2;
        const centerY = this.y + ts / 2;

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, this.y + ts - 4, ts / 3, ts / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Цвет зависит от волны (от фиолетового к красному)
        const intensity = Math.min(1, this.wave / 10);
        const r = Math.floor(100 + 155 * intensity);
        const g = Math.floor(100 - 80 * intensity);
        const b = Math.floor(150 - 100 * intensity);
        const bodyColor = `rgb(${r},${g},${b})`;

        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : bodyColor;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ts / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Иконка
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🦇', centerX, centerY);

        // HP бар
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = '#500';
        ctx.fillRect(this.x, this.y - 10, ts, 4);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x, this.y - 10, ts * hpPercent, 4);
    }
}
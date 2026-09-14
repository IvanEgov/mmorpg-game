class Enemy {
    constructor(x, y, enemyType) {
        this.x = x;
        this.y = y;
        this.type = enemyType;

        // 🆕 Уникальный ID для синхронизации между игроками
        this.uniqueId = 'enemy_' + Math.floor(x) + '_' + Math.floor(y) + '_' + enemyType;

        const data = CONSTANTS.ENEMIES[enemyType];
        this.name = data.name;
        this.icon = data.icon;
        this.hp = data.hp;
        this.maxHp = data.hp;
        this.atk = data.atk;
        this.speed = data.speed;
        this.xpReward = data.xpReward;
        this.goldReward = data.goldReward;
        this.lootTable = data.lootTable;
        this.isDead = false;
        this.hitFlash = 0;
        this.attackCooldown = 0;
        this.direction = 'down';
        this.attackAnimation = null;
        this.minDistance = 40;
        this.detectionRange = 99999;
    }

    update(player, location) {
        if (this.isDead) return null;
        if (this.hitFlash > 0) this.hitFlash--;
        if (this.attackCooldown > 0) this.attackCooldown--;

        if (this.attackAnimation && this.attackAnimation.active) {
            this.attackAnimation.progress++;
            if (this.attackAnimation.progress >= this.attackAnimation.duration) {
                this.attackAnimation.active = false;
                this.attackAnimation = null;
            }
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }

        const mapW = (location.mapWidth || CONSTANTS.MAP_WIDTH) * CONSTANTS.TILE_SIZE;
        const mapH = (location.mapHeight || CONSTANTS.MAP_HEIGHT) * CONSTANTS.TILE_SIZE;

        if (distance < this.detectionRange && distance > this.minDistance) {
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;
            let newX = this.x + moveX;
            let newY = this.y + moveY;

            // 🆕 Wrap-around для врагов
            const mapW = (location.mapWidth || CONSTANTS.MAP_WIDTH) * CONSTANTS.TILE_SIZE;
            const mapH = (location.mapHeight || CONSTANTS.MAP_HEIGHT) * CONSTANTS.TILE_SIZE;

            if (newX < 0) newX = mapW - CONSTANTS.TILE_SIZE;
            if (newX >= mapW) newX = 0;
            if (newY < 0) newY = mapH - CONSTANTS.TILE_SIZE;
            if (newY >= mapH) newY = 0;

            const tileX = Math.floor((newX + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);
            const tileY = Math.floor((newY + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);

            if (newX >= 0 && newY >= 0 && newX < mapW && newY < mapH &&
                tileX >= 0 && tileY >= 0 && tileX < mapW / CONSTANTS.TILE_SIZE && tileY < mapH / CONSTANTS.TILE_SIZE) {
                if (location.map[tileY] && location.map[tileY][tileX] !== 7 && location.map[tileY][tileX] !== 1) {
                    this.x = newX;
                    this.y = newY;
                }
            }
        }

        if (distance < CONSTANTS.TILE_SIZE * 1.5 && this.attackCooldown === 0) {
            const dmg = player.takeDamage(this.atk);
            this.attackCooldown = 60;

            const attackAngle = Math.atan2(player.y - this.y, player.x - this.x);
            this.attackAnimation = {
                active: true,
                progress: 0,
                duration: 15,
                angle: attackAngle
            };

            return { damage: dmg, targetX: player.x, targetY: player.y };
        }

        return null;
    }

    takeDamage(amount) {
        if (this.isDead) return false;
        this.hp -= amount;
        this.hitFlash = 10;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            return true;
        }
        return false;
    }

    getLoot() {
        const loot = [];
        for (const drop of this.lootTable) {
            if (Math.random() < drop.chance) loot.push(drop.itemId);
        }
        return loot;
    }
}

class ArenaBat extends Enemy {
    constructor(x, y, powerMultiplier, wave) {
        super(x, y, 'bat');
        // 🆕 Уникальный ID с учётом волны
        this.uniqueId = 'arenabat_' + Math.floor(x) + '_' + Math.floor(y) + '_w' + wave;

        this.hp = Math.floor(CONSTANTS.ARENA.BAT_BASE_HP * powerMultiplier);
        this.maxHp = this.hp;
        this.atk = Math.floor(CONSTANTS.ARENA.BAT_BASE_ATK * powerMultiplier);
        this.speed = CONSTANTS.ARENA.BAT_BASE_SPEED + (wave * 0.05);
        this.xpReward = Math.floor(30 * powerMultiplier);
        this.goldReward = Math.floor(15 * powerMultiplier);
        this.wave = wave;
        this.powerMultiplier = powerMultiplier;
    }

    render(ctx) {
        if (this.isDead) return;
        const ts = CONSTANTS.TILE_SIZE;
        const centerX = this.x + ts / 2;
        const centerY = this.y + ts / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, this.y + ts - 4, ts / 3, ts / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        const intensity = Math.min(1, this.wave / 10);
        const r = Math.floor(100 + 155 * intensity);
        const g = Math.floor(100 - 80 * intensity);
        const b = Math.floor(150 - 100 * intensity);

        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : 'rgb(' + r + ',' + g + ',' + b + ')';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ts / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, centerX, centerY);

        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = '#500';
        ctx.fillRect(this.x, this.y - 10, ts, 4);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(this.x, this.y - 10, ts * hpPercent, 4);
    }
}
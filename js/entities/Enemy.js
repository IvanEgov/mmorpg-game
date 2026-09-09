class Enemy {
    constructor(x, y, enemyType) {
        this.x = x; this.y = y; this.type = enemyType;
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

        // === НОВОЕ: Анимация атаки врага ===
        this.attackAnimation = null;

        // === НОВОЕ: Минимальная дистанция до игрока ===
        this.minDistance = 40; // Не подходит ближе 40 пикселей
    }

    update(player, location) {
        if (this.isDead) return;
        if (this.hitFlash > 0) this.hitFlash--;
        if (this.attackCooldown > 0) this.attackCooldown--;

        // Обновление анимации атаки
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

        // Направление
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }

        // Движение: преследуем, но НЕ ближе minDistance
        if (distance < 200 && distance > this.minDistance) {
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            const tileX = Math.floor((newX + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);
            const tileY = Math.floor((newY + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);

            // === ИСПРАВЛЕНО: Проверяем границы карты ===
            if (tileX >= 0 && tileX < CONSTANTS.MAP_WIDTH && tileY >= 0 && tileY < CONSTANTS.MAP_HEIGHT) {
                if (location.map[tileY] && location.map[tileY][tileX] !== 7) {
                    this.x = newX;
                    this.y = newY;
                }
            }
        }

        // Атака: бьём если в радиусе атаки
        if (distance < CONSTANTS.TILE_SIZE * 1.5 && this.attackCooldown === 0) {
            const dmg = player.takeDamage(this.atk);
            this.attackCooldown = 60;

            // Запускаем анимацию атаки врага
            const attackAngle = Math.atan2(player.y - this.y, player.x - this.x);
            this.attackAnimation = {
                active: true,
                progress: 0,
                duration: 15,
                angle: attackAngle
            };

            // Возвращаем урон для всплывающего числа
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
class Enemy {
    constructor(x, y, enemyType) {
        this.x = x;
        this.y = y;
        this.type = enemyType;
        
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
        this.hitFlash = 0; // Для визуального эффекта удара
        this.attackCooldown = 0;
        this.direction = 'down';
    }

    update(player, map) {
        if (this.isDead) return;
        
        if (this.hitFlash > 0) this.hitFlash--;
        if (this.attackCooldown > 0) this.attackCooldown--;

        // Простой ИИ: двигаемся к игроку, если он в радиусе видимости
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.hypot(dx, dy);
        const detectionRange = 200; // Пикселей

        if (distance < detectionRange && distance > CONSTANTS.TILE_SIZE * 0.8) {
            // Нормализуем направление
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;

            // Определяем направление для визуала
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }

            // Проверяем коллизии
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            const tileX = Math.floor((newX + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);
            const tileY = Math.floor((newY + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);

            if (tileX >= 0 && tileX < CONSTANTS.MAP_WIDTH && tileY >= 0 && tileY < CONSTANTS.MAP_HEIGHT) {
                if (map[tileY][tileX] !== 1 && map[tileY][tileX] !== 5) {
                    this.x = newX;
                    this.y = newY;
                }
            }
        }

        // Атака игрока, если близко
        if (distance < CONSTANTS.TILE_SIZE * 1.2 && this.attackCooldown === 0) {
            player.takeDamage(this.atk);
            this.attackCooldown = 60; // Кулдаун 1 секунда (60 кадров)
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        
        this.hp -= amount;
        this.hitFlash = 10; // Мигает 10 кадров

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
            return true; // Враг убит
        }
        return false;
    }

    getLoot() {
        const loot = [];
        for (const drop of this.lootTable) {
            if (Math.random() < drop.chance) {
                loot.push(drop.itemId);
            }
        }
        return loot;
    }
}
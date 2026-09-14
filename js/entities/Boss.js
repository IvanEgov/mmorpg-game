class Boss extends Enemy {
    constructor(x, y, bossData) {
        // 🆕 Передаём валидный тип 'bat' (чтобы super() не упал)
        // Все данные босса переопределим ниже
        super(x, y, 'bat');

        // 🆕 Полностью переопределяем данные босса
        this.bossId = bossData.id;
        this.name = bossData.name;
        this.icon = bossData.icon;
        this.type = 'boss';
        this.hp = bossData.hp;
        this.maxHp = bossData.hp;
        this.atk = bossData.atk;
        this.speed = bossData.speed;
        this.xpReward = bossData.xpReward;
        this.goldReward = bossData.goldReward;
        this.lootTable = bossData.lootTable || [];
        this.size = bossData.size || 2;

        // 🆕 Фиксированный uniqueId для синхронизации между игроками
        this.uniqueId = 'boss_' + this.bossId + '_' + Math.floor(x) + '_' + Math.floor(y);


        this.detectionRange = 99999;
        this.minDistance = 60;
        this.attackAnimation = null;
        this.color = bossData.color || '#8b0000';
        this.enragedColor = bossData.enragedColor || '#ff0000';
        this.unlocksEpoch = bossData.unlocksEpoch;

        this.isEnraged = false;
        this.baseSpeed = this.speed;
        this.baseAtk = this.atk;
        this.pulseTimer = 0;
        this.specialCooldown = 0;
    }
    // 🆕 Умный обход препятствий
    smartAvoidObstacle(player, location, mapW, mapH) {
        // Пробуем 4 направления и выбираем лучшее
        const directions = [
            { x: 1, y: 0 },   // Вправо
            { x: -1, y: 0 },  // Влево
            { x: 0, y: 1 },   // Вниз
            { x: 0, y: -1 }   // Вверх
        ];

        let bestDir = null;
        let bestScore = -Infinity;

        for (const dir of directions) {
            const testX = this.x + dir.x * this.speed * 3;
            const testY = this.y + dir.y * this.speed * 3;

            let testTileX = Math.floor((testX + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);
            let testTileY = Math.floor((testY + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);

            // Wrap-around
            if (testTileX < 0) testTileX = Math.floor(mapW / CONSTANTS.TILE_SIZE) - 1;
            if (testTileX >= mapW / CONSTANTS.TILE_SIZE) testTileX = 0;
            if (testTileY < 0) testTileY = Math.floor(mapH / CONSTANTS.TILE_SIZE) - 1;
            if (testTileY >= mapH / CONSTANTS.TILE_SIZE) testTileY = 0;

            // Проверяем проходимость
            if (location.map[testTileY] &&
                location.map[testTileY][testTileX] !== 7 &&
                location.map[testTileY][testTileX] !== 1) {

                // Оцениваем направление: чем ближе к игроку — тем лучше
                const distToPlayer = Math.hypot(testX - player.x, testY - player.y);
                const score = -distToPlayer; // Отрицательное расстояние (меньше = лучше)

                if (score > bestScore) {
                    bestScore = score;
                    bestDir = dir;
                }
            }
        }

        // Двигаемся в лучшем направлении
        if (bestDir) {
            this.x += bestDir.x * this.speed;
            this.y += bestDir.y * this.speed;
            this.stuckCounter = 0; // Сбрасываем счётчик
        }
    }
    update(player, location) {
        if (this.isDead) return null;
        if (this.hitFlash > 0) this.hitFlash--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.specialCooldown > 0) this.specialCooldown--;
        this.pulseTimer++;

        if (this.attackAnimation && this.attackAnimation.active) {
            this.attackAnimation.progress++;
            if (this.attackAnimation.progress >= this.attackAnimation.duration) {
                this.attackAnimation.active = false;
                this.attackAnimation = null;
            }
        }

        // Фаза ярости при HP < 50%
        if (this.hp < this.maxHp / 2 && !this.isEnraged) {
            this.isEnraged = true;
            this.speed = this.baseSpeed * 1.5;
            this.atk = Math.floor(this.baseAtk * 1.3);
            console.log('💢 ' + this.name + ' впал в ярость!');
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.hypot(dx, dy);

                // 🆕 Инициализация счётчика застревания
        if (!this.stuckCounter) this.stuckCounter = 0;
        if (!this.lastX) this.lastX = this.x;
        if (!this.lastY) this.lastY = this.y;

        if (Math.abs(this.x - this.lastX) < 0.5 && Math.abs(this.y - this.lastY) < 0.5) {
            this.stuckCounter++;
        } else {
            this.stuckCounter = 0;
        }
        this.lastX = this.x;
        this.lastY = this.y;

        if (distance < this.detectionRange && distance > this.minDistance) {
            const moveX = (dx / distance) * this.speed;
            const moveY = (dy / distance) * this.speed;
            let newX = this.x + moveX;
            let newY = this.y + moveY;

            const mapW = (location.mapWidth || CONSTANTS.MAP_WIDTH) * CONSTANTS.TILE_SIZE;
            const mapH = (location.mapHeight || CONSTANTS.MAP_HEIGHT) * CONSTANTS.TILE_SIZE;

            if (newX < 0) newX = mapW - CONSTANTS.TILE_SIZE;
            if (newX >= mapW) newX = 0;
            if (newY < 0) newY = mapH - CONSTANTS.TILE_SIZE;
            if (newY >= mapH) newY = 0;

            const tileX = Math.floor((newX + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);
            const tileY = Math.floor((newY + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);

            if (location.map[tileY] && location.map[tileY][tileX] !== 7 && location.map[tileY][tileX] !== 1) {
                this.x = newX;
                this.y = newY;
            } else {
                if (this.stuckCounter > 10) {
                    this.smartAvoidObstacle(player, location, mapW, mapH);
                } else {
                    this.tryAvoidObstacle(dx, dy, location, mapW, mapH);
                }
            }
        }

        if (distance < CONSTANTS.TILE_SIZE * 2 && this.attackCooldown === 0) {
            const dmg = player.takeDamage(this.atk);
            this.attackCooldown = 45;

            const attackAngle = Math.atan2(player.y - this.y, player.x - this.x);
            this.attackAnimation = {
                active: true,
                progress: 0,
                duration: 20,
                angle: attackAngle
            };

            return { damage: dmg, targetX: player.x, targetY: player.y };
        }

        return null;
    }

    render(ctx) {
        if (this.isDead) return;

        const ts = CONSTANTS.TILE_SIZE * this.size;
        const centerX = this.x + ts / 2;
        const centerY = this.y + ts / 2;

        // Пульсирующая аура
        const pulse = Math.sin(this.pulseTimer * 0.05) * 5;
        const auraColor = this.isEnraged ? this.enragedColor : this.color;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ts / 2 + pulse + 10);
        gradient.addColorStop(0, auraColor + 'cc');
        gradient.addColorStop(1, auraColor + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ts / 2 + pulse + 10, 0, Math.PI * 2);
        ctx.fill();

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(centerX, this.y + ts - 4, ts / 3, ts / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело
        ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : auraColor;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ts / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Иконка
        ctx.font = (24 * this.size / 2) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, centerX, centerY);

        // Надпись "БОСС"
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#ff0';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText('БОСС', centerX, this.y - 20);
        ctx.fillText('БОСС', centerX, this.y - 20);

        // Индикатор ярости
        if (this.isEnraged) {
            ctx.font = 'bold 14px sans-serif';
            ctx.fillStyle = '#ff0000';
            ctx.strokeText('💢 ЯРОСТЬ', centerX, this.y - 35);
            ctx.fillText('💢 ЯРОСТЬ', centerX, this.y - 35);
        }
    }
    tryAvoidObstacle(dx, dy, location, mapW, mapH) {
        const perpendicularX = -dy;
        const perpendicularY = dx;

        const moveX = (perpendicularX / Math.hypot(perpendicularX, perpendicularY)) * this.speed;
        const moveY = (perpendicularY / Math.hypot(perpendicularX, perpendicularY)) * this.speed;

        let newX = this.x + moveX;
        let newY = this.y + moveY;

        if (newX < 0) newX = mapW - CONSTANTS.TILE_SIZE;
        if (newX >= mapW) newX = 0;
        if (newY < 0) newY = mapH - CONSTANTS.TILE_SIZE;
        if (newY >= mapH) newY = 0;

        const tileX = Math.floor((newX + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor((newY + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);

        if (tileX >= 0 && tileY >= 0 && tileX < mapW / CONSTANTS.TILE_SIZE && tileY < mapH / CONSTANTS.TILE_SIZE) {
            if (location.map[tileY] && location.map[tileY][tileX] !== 7 && location.map[tileY][tileX] !== 1) {
                this.x = newX;
                this.y = newY;
            }
        }
    }
}
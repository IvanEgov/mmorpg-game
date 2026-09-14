class Boss extends Enemy {
    constructor(x, y, bossData) {
        super(x, y, bossData.type || 'boss');

        this.bossId = bossData.id;
        this.name = bossData.name;
        this.icon = bossData.icon;
        this.hp = bossData.hp;
        this.maxHp = bossData.hp;
        this.atk = bossData.atk;
        this.speed = bossData.speed;
        this.xpReward = bossData.xpReward;
        this.goldReward = bossData.goldReward;
        this.lootTable = bossData.lootTable || [];
        this.size = bossData.size || 2;
        this.uniqueId = 'boss_' + this.bossId;
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

    update(player, location) {
        if (this.isDead) return null;
        if (this.hitFlash > 0) this.hitFlash--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.specialCooldown > 0) this.specialCooldown--;
        this.pulseTimer++;

        // Обновление анимации
        if (this.attackAnimation && this.attackAnimation.active) {
            this.attackAnimation.progress++;
            if (this.attackAnimation.progress >= this.attackAnimation.duration) {
                this.attackAnimation.active = false;
                this.attackAnimation = null;
            }
        }

        // 🆕 Фаза ярости при HP < 50%
        if (this.hp < this.maxHp / 2 && !this.isEnraged) {
            this.isEnraged = true;
            this.speed = this.baseSpeed * 1.5;
            this.atk = Math.floor(this.baseAtk * 1.3);
            console.log('💢 ' + this.name + ' впал в ярость!');
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

        // Преследование
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
            }
        }

        // Атака
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

        // 🆕 Пульсирующая аура
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
}
class Tower {
    constructor(x, y, towerType) {
        this.x = x;
        this.y = y;
        this.type = towerType;

        const data = CONSTANTS.TOWERS[towerType];
        this.name = data.name;
        this.icon = data.icon;
        this.damage = data.damage;
        this.range = data.range;
        this.attackSpeed = data.attackSpeed;
        this.color = data.color;

        this.lastAttack = 0;
        this.uniqueId = 'tower_' + Math.floor(x) + '_' + Math.floor(y);
    }

    update(enemies, currentTime) {
        if (currentTime - this.lastAttack < this.attackSpeed) return;

        // »щем ближайшего врага в радиусе
        let closestEnemy = null;
        let minDistance = this.range;

        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        }

        if (closestEnemy) {
            this.lastAttack = currentTime;
            const killed = closestEnemy.takeDamage(this.damage);

            // —оздаЄм визуальный эффект выстрела
            return {
                targetX: closestEnemy.x,
                targetY: closestEnemy.y,
                damage: this.damage,
                killed: killed,
                enemy: closestEnemy
            };
        }

        return null;
    }

    render(ctx) {
        const centerX = this.x + CONSTANTS.TILE_SIZE / 2;
        const centerY = this.y + CONSTANTS.TILE_SIZE / 2;

        // ќснование башни
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(this.x + 4, this.y + 4, CONSTANTS.TILE_SIZE - 8, CONSTANTS.TILE_SIZE - 8);
        ctx.strokeRect(this.x + 4, this.y + 4, CONSTANTS.TILE_SIZE - 8, CONSTANTS.TILE_SIZE - 8);

        // »конка
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, centerX, centerY);
    }
}
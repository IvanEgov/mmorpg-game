    // Добавь этот метод после метода update()
    attack(enemies) {
        if (this.attackCooldown > 0) return null;

        this.attackCooldown = CONSTANTS.ATTACK_COOLDOWN;

        // Ищем ближайшего врага в радиусе атаки
        let closestEnemy = null;
        let minDistance = CONSTANTS.ATTACK_RANGE;

        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.hypot(dx, dy);

            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        }

        if (closestEnemy) {
            // Наносим урон с учетом навыков
            const damage = this.totalAtk;
            const killed = closestEnemy.takeDamage(damage);
            
            if (killed) {
                return { enemy: closestEnemy, damage: damage, killed: true };
            }
            return { enemy: closestEnemy, damage: damage, killed: false };
        }

        return null;
    }
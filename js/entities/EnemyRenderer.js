class EnemyRenderer {
    render(ctx, enemy) {
        if (enemy.isDead) return;
        const ts = CONSTANTS.TILE_SIZE;
        const centerX = enemy.x + ts / 2;
        const centerY = enemy.y + ts / 2;

        // === НОВОЕ: Выпад врага при атаке ===
        let offsetX = 0, offsetY = 0;
        if (enemy.attackAnimation && enemy.attackAnimation.active) {
            const t = enemy.attackAnimation.progress / enemy.attackAnimation.duration;
            const push = Math.sin(t * Math.PI) * 10; // Выпад на 10 пикселей
            offsetX = Math.cos(enemy.attackAnimation.angle) * push;
            offsetY = Math.sin(enemy.attackAnimation.angle) * push;
        }

        const drawX = centerX + offsetX;
        const drawY = centerY + offsetY;

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(drawX, enemy.y + ts - 4, ts / 3, ts / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело
        ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : CONSTANTS.COLORS.ENEMY_BODY;
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(drawX, drawY, ts / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Иконка
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.icon, drawX, drawY);

        // === НОВОЕ: Когти/удар врага при атаке ===
        if (enemy.attackAnimation && enemy.attackAnimation.active) {
            this.renderEnemyAttackEffect(ctx, enemy, drawX, drawY);
        }

        // HP-бар
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = CONSTANTS.COLORS.HP_BAR_BG;
        ctx.fillRect(enemy.x, enemy.y - 10, ts, 5);
        ctx.fillStyle = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
        ctx.fillRect(enemy.x, enemy.y - 10, ts * hpPercent, 5);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(enemy.x, enemy.y - 10, ts, 5);
    }

    // === НОВОЕ: Эффект когтей/удара врага ===
    renderEnemyAttackEffect(ctx, enemy, x, y) {
        const anim = enemy.attackAnimation;
        const t = anim.progress / anim.duration;
        if (t > 0.6) return;

        const alpha = Math.sin((t / 0.6) * Math.PI);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(anim.angle);

        // Три красные полосы-когти
        ctx.strokeStyle = `rgba(255, 50, 50, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        for (let i = -1; i <= 1; i++) {
            const startY = i * 8;
            ctx.beginPath();
            ctx.moveTo(10, startY);
            ctx.lineTo(30, startY + i * 4);
            ctx.stroke();
        }

        ctx.restore();
    }
}
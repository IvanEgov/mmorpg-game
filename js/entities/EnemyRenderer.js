class EnemyRenderer {
    render(ctx, enemy) {
        if (enemy.isDead) return;

        const ts = CONSTANTS.TILE_SIZE;
        const centerX = enemy.x + ts / 2;
        const centerY = enemy.y + ts / 2;

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, enemy.y + ts - 4, ts / 3, ts / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело врага (мигает белым при ударе)
        ctx.fillStyle = enemy.hitFlash > 0 ? '#ffffff' : CONSTANTS.COLORS.ENEMY_BODY;
        ctx.strokeStyle = CONSTANTS.COLORS.ENEMY_OUTLINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ts / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Иконка врага
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.icon, centerX, centerY);

        // HP-бар над врагом
        const hpPercent = enemy.hp / enemy.maxHp;
        const barWidth = ts;
        const barHeight = 4;
        const barX = enemy.x;
        const barY = enemy.y - 10;

        ctx.fillStyle = CONSTANTS.COLORS.HP_BAR_BG;
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = CONSTANTS.COLORS.HP_BAR_FILL;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
}
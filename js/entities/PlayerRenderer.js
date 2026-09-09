class PlayerRenderer {
    constructor() {
        this.bobOffset = 0; // Для анимации покачивания при ходьбе
    }

    render(ctx, player) {
        const ts = CONSTANTS.TILE_SIZE;
        const centerX = player.x + ts / 2;
        const centerY = player.y + ts / 2;

        // Анимация покачивания при движении
        if (player.isMoving) {
            this.bobOffset = Math.sin(Date.now() / 100) * 2;
        } else {
            this.bobOffset = 0;
        }

        // 1. Тень
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, player.y + ts - 4, ts / 3, ts / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Тело игрока (пока круг, позже заменим на спрайт)
        ctx.fillStyle = CONSTANTS.COLORS.PLAYER_BODY;
        ctx.strokeStyle = CONSTANTS.COLORS.PLAYER_OUTLINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY + this.bobOffset, ts / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3. Индикатор направления (глаза/меч)
        ctx.fillStyle = '#fff';
        let eyeOffsetX = 0, eyeOffsetY = 0;
        if (player.direction === 'left') eyeOffsetX = -6;
        if (player.direction === 'right') eyeOffsetX = 6;
        if (player.direction === 'up') eyeOffsetY = -6;
        if (player.direction === 'down') eyeOffsetY = 6;

        ctx.beginPath();
        ctx.arc(centerX + eyeOffsetX, centerY + this.bobOffset + eyeOffsetY, 3, 0, Math.PI * 2);
        ctx.fill();

        // 4. Полоска HP над головой
        const hpPercent = player.hp / player.maxHp;
        const barWidth = ts;
        const barHeight = 4;
        const barX = player.x;
        const barY = player.y - 8;

        ctx.fillStyle = CONSTANTS.COLORS.HP_BAR_BG;
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = CONSTANTS.COLORS.HP_BAR_FILL;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }
}
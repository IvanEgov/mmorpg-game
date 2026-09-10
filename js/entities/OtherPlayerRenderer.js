class OtherPlayerRenderer {
    render(ctx, otherPlayer) {
        const ts = CONSTANTS.TILE_SIZE;
        const centerX = otherPlayer.x + ts / 2;
        const centerY = otherPlayer.y + ts / 2;

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, otherPlayer.y + ts - 4, ts / 3, ts / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело (зелёное, чтобы отличать от своего синего)
        ctx.fillStyle = '#2ecc71';
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ts / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Глаза по направлению
        ctx.fillStyle = '#fff';
        let eyeOffsetX = 0, eyeOffsetY = 0;
        if (otherPlayer.direction === 'left') eyeOffsetX = -5;
        if (otherPlayer.direction === 'right') eyeOffsetX = 5;
        if (otherPlayer.direction === 'up') eyeOffsetY = -5;
        if (otherPlayer.direction === 'down') eyeOffsetY = 5;
        ctx.beginPath();
        ctx.arc(centerX + eyeOffsetX, centerY + eyeOffsetY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Имя и уровень над головой
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Фон для имени
        const nameText = `${otherPlayer.name} [${otherPlayer.level}]`;
        const textWidth = ctx.measureText(nameText).width;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(centerX - textWidth / 2 - 4, otherPlayer.y - 22, textWidth + 8, 16);

        // Имя
        ctx.fillStyle = '#fff';
        ctx.fillText(nameText, centerX, otherPlayer.y - 14);

        // HP бар
        const hpPercent = otherPlayer.hp / otherPlayer.maxHp;
        ctx.fillStyle = '#500';
        ctx.fillRect(otherPlayer.x, otherPlayer.y - 8, ts, 4);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(otherPlayer.x, otherPlayer.y - 8, ts * hpPercent, 4);
    }
}
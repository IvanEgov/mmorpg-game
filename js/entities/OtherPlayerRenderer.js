class OtherPlayerRenderer {
    render(ctx, otherPlayer) {
        console.log('🟢 OtherPlayerRenderer.render вызван для:', otherPlayer.name, 'X:', otherPlayer.x, 'Y:', otherPlayer.y);

        const ts = CONSTANTS.TILE_SIZE;
        const centerX = otherPlayer.x + ts / 2;
        const centerY = otherPlayer.y + ts / 2;

        // 1. Тень (чёрная)
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(centerX, otherPlayer.y + ts - 4, ts / 3, ts / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Тело (ЯРКО-ЗЕЛЁНЫЙ, чтобы точно было видно!)
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#008800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ts / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3. Глаза (чтобы видеть направление)
        ctx.fillStyle = '#fff';
        let eyeOffsetX = 0, eyeOffsetY = 0;
        if (otherPlayer.direction === 'left') eyeOffsetX = -6;
        if (otherPlayer.direction === 'right') eyeOffsetX = 6;
        if (otherPlayer.direction === 'up') eyeOffsetY = -6;
        if (otherPlayer.direction === 'down') eyeOffsetY = 6;

        ctx.beginPath();
        ctx.arc(centerX + eyeOffsetX - 3, centerY + eyeOffsetY, 3, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffsetX + 3, centerY + eyeOffsetY, 3, 0, Math.PI * 2);
        ctx.fill();

        // 4. Имя и уровень (ЯРКО-ЖЁЛТАЯ плашка)
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const nameText = `${otherPlayer.name} [${otherPlayer.level}]`;
        const textWidth = ctx.measureText(nameText).width;

        ctx.fillStyle = 'rgba(255, 255, 0, 0.9)'; // Жёлтый фон
        ctx.fillRect(centerX - textWidth / 2 - 4, otherPlayer.y - 24, textWidth + 8, 18);

        ctx.fillStyle = '#000'; // Чёрный текст
        ctx.fillText(nameText, centerX, otherPlayer.y - 15);

        // 5. HP бар (ЯРКО-КРАСНЫЙ)
        const hpPercent = Math.max(0, otherPlayer.hp / otherPlayer.maxHp);
        ctx.fillStyle = '#500';
        ctx.fillRect(otherPlayer.x, otherPlayer.y - 8, ts, 5);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(otherPlayer.x, otherPlayer.y - 8, ts * hpPercent, 5);

        console.log('✅ Отрисовка другого игрока завершена');
    }
}
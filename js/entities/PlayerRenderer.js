class PlayerRenderer {
    render(ctx, player) {
        const ts = CONSTANTS.TILE_SIZE;
        const centerX = player.x + ts / 2;
        const centerY = player.y + ts / 2;

        // === НОВОЕ: Анимация атаки рисуется ПОД персонажем (эффект вспышки на земле) ===
        if (player.attackAnimation && player.attackAnimation.active) {
            this.renderAttackAnimation(ctx, player, centerX, centerY);
        }

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, player.y + ts - 4, ts / 3, ts / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // === НОВОЕ: Лёгкая отдача при атаке (персонаж чуть сдвигается вперёд) ===
        let offsetX = 0, offsetY = 0;
        if (player.attackAnimation && player.attackAnimation.active) {
            const t = player.attackAnimation.progress / player.attackAnimation.duration;
            const push = Math.sin(t * Math.PI) * 4; // Плавный толчок вперёд и назад
            offsetX = Math.cos(player.attackAnimation.angle) * push;
            offsetY = Math.sin(player.attackAnimation.angle) * push;
        }

        // Тело
        ctx.fillStyle = CONSTANTS.COLORS.PLAYER_BODY;
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX + offsetX, centerY + offsetY, ts / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Глаз-индикатор направления
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        const eyeAngle = player.getDirectionAngle();
        const eyeX = centerX + offsetX + Math.cos(eyeAngle) * 6;
        const eyeY = centerY + offsetY + Math.sin(eyeAngle) * 6;
        ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();

        // === НОВОЕ: Анимация слэша рисуется НАД персонажем ===
        if (player.attackAnimation && player.attackAnimation.active) {
            this.renderSlash(ctx, player, centerX + offsetX, centerY + offsetY);
        }
    }

    // === НОВОЕ: Отрисовка вспышки на земле ===
    renderAttackAnimation(ctx, player, centerX, centerY) {
        const anim = player.attackAnimation;
        const t = anim.progress / anim.duration;

        // Радиус расширяется от 10 до 50
        const radius = 10 + t * 40;
        // Прозрачность: появляется и исчезает
        const alpha = Math.sin(t * Math.PI) * 0.6;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(anim.angle);

        // Жёлтая вспышка в направлении удара
        const gradient = ctx.createRadialGradient(20, 0, 0, 20, 0, radius);
        gradient.addColorStop(0, `rgba(255, 230, 100, ${alpha})`);
        gradient.addColorStop(1, `rgba(255, 150, 50, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(20, 0, radius, -Math.PI / 3, Math.PI / 3);
        ctx.fill();

        ctx.restore();
    }

    // === НОВОЕ: Отрисовка слэша (дуга меча) ===
    renderSlash(ctx, player, centerX, centerY) {
        const anim = player.attackAnimation;
        const t = anim.progress / anim.duration;

        // Слэш появляется в первой половине анимации
        if (t > 0.7) return;

        const slashProgress = t / 0.7; // 0..1
        const alpha = Math.sin(slashProgress * Math.PI);

        const slashRadius = 35;
        const slashWidth = 4;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(anim.angle);

        // Дуга слэша (от -60° до +60°)
        const startAngle = -Math.PI / 3;
        const endAngle = Math.PI / 3;
        const currentEnd = startAngle + (endAngle - startAngle) * slashProgress;

        // Белая дуга с жёлтым свечением
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = slashWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, slashRadius, startAngle, currentEnd);
        ctx.stroke();

        // Внешнее жёлтое свечение
        ctx.strokeStyle = `rgba(255, 220, 100, ${alpha * 0.6})`;
        ctx.lineWidth = slashWidth + 4;
        ctx.beginPath();
        ctx.arc(0, 0, slashRadius, startAngle, currentEnd);
        ctx.stroke();

        ctx.restore();
    }
}
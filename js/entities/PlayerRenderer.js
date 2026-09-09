class PlayerRenderer {
    render(ctx, player) {
        const ts = CONSTANTS.TILE_SIZE;
        const centerX = player.x + ts / 2;
        const centerY = player.y + ts / 2;

        // Вспышка на земле при атаке
        if (player.attackAnimation && player.attackAnimation.active) {
            this.renderAttackFlash(ctx, player, centerX, centerY);
        }

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, player.y + ts - 4, ts / 3, ts / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Отдача при атаке
        let offsetX = 0, offsetY = 0;
        if (player.attackAnimation && player.attackAnimation.active) {
            const t = player.attackAnimation.progress / player.attackAnimation.duration;
            const push = Math.sin(t * Math.PI) * 5;
            offsetX = Math.cos(player.attackAnimation.angle) * push;
            offsetY = Math.sin(player.attackAnimation.angle) * push;
        }

        const drawX = centerX + offsetX;
        const drawY = centerY + offsetY;

        // === ОРУЖИЕ ЗА ПЕРСОНАЖЕМ (если смотрит вверх) ===
        const weaponAngle = this.getWeaponAngle(player);
        if (player.direction === 'up') {
            this.renderWeapon(ctx, player, drawX, drawY, weaponAngle);
        }

        // Тело игрока
        ctx.fillStyle = CONSTANTS.COLORS.PLAYER_BODY;
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(drawX, drawY, ts / 2 - 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Глаза
        ctx.fillStyle = '#fff';
        const eyeAngle = player.getDirectionAngle();
        ctx.beginPath();
        ctx.arc(drawX + Math.cos(eyeAngle) * 5 - 3, drawY + Math.sin(eyeAngle) * 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(drawX + Math.cos(eyeAngle) * 5 + 3, drawY + Math.sin(eyeAngle) * 5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // === ОРУЖИЕ ПЕРЕД ПЕРСОНАЖЕМ (если не вверх) ===
        if (player.direction !== 'up') {
            this.renderWeapon(ctx, player, drawX, drawY, weaponAngle);
        }

        // Слэш-дуга при атаке
        if (player.attackAnimation && player.attackAnimation.active) {
            this.renderSlash(ctx, player, drawX, drawY);
        }
    }

    // === Угол оружия: базовое направление + вращение при атаке ===
    getWeaponAngle(player) {
        let baseAngle = player.getDirectionAngle();
        let attackOffset = 0;

        if (player.attackAnimation && player.attackAnimation.active) {
            const t = player.attackAnimation.progress / player.attackAnimation.duration;
            // Меч вращается от -90° до +90° за время анимации
            attackOffset = -Math.PI / 2 + t * Math.PI;
        }

        return baseAngle + attackOffset;
    }

    // === Отрисовка меча в руке ===
    renderWeapon(ctx, player, x, y, angle) {
        const hasWeapon = player.equipment.weapon !== null;
        const swordLength = hasWeapon ? 22 : 14;
        const swordWidth = hasWeapon ? 4 : 3;
        const handleLength = 6;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Рукоятка (коричневая)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(swordLength * 0.3, -swordWidth / 2, handleLength, swordWidth);

        // Лезвие (серое/серебряное)
        const bladeGradient = ctx.createLinearGradient(0, 0, swordLength, 0);
        bladeGradient.addColorStop(0, hasWeapon ? '#c0c0c0' : '#888');
        bladeGradient.addColorStop(1, hasWeapon ? '#ffffff' : '#aaa');
        ctx.fillStyle = bladeGradient;

        // Форма лезвия (сужается к кончику)
        ctx.beginPath();
        ctx.moveTo(handleLength + 2, -swordWidth / 2);
        ctx.lineTo(swordLength, 0); // Кончик
        ctx.lineTo(handleLength + 2, swordWidth / 2);
        ctx.closePath();
        ctx.fill();

        // Гарда (перекладина)
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(handleLength, -swordWidth, 3, swordWidth * 2);

        ctx.restore();
    }

    renderAttackFlash(ctx, player, centerX, centerY) {
        const anim = player.attackAnimation;
        const t = anim.progress / anim.duration;
        const radius = 10 + t * 40;
        const alpha = Math.sin(t * Math.PI) * 0.5;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(anim.angle);
        const gradient = ctx.createRadialGradient(20, 0, 0, 20, 0, radius);
        gradient.addColorStop(0, `rgba(255, 230, 100, ${alpha})`);
        gradient.addColorStop(1, `rgba(255, 150, 50, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(20, 0, radius, -Math.PI / 3, Math.PI / 3);
        ctx.fill();
        ctx.restore();
    }

    renderSlash(ctx, player, centerX, centerY) {
        const anim = player.attackAnimation;
        const t = anim.progress / anim.duration;
        if (t > 0.7) return;

        const slashProgress = t / 0.7;
        const alpha = Math.sin(slashProgress * Math.PI);
        const slashRadius = 35;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(anim.angle);

        const startAngle = -Math.PI / 3;
        const endAngle = Math.PI / 3;
        const currentEnd = startAngle + (endAngle - startAngle) * slashProgress;

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 0, slashRadius, startAngle, currentEnd);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 220, 100, ${alpha * 0.5})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(0, 0, slashRadius, startAngle, currentEnd);
        ctx.stroke();

        ctx.restore();
    }
}
class Portal {
    constructor(x, y, targetLocation, label) {
        this.x = x;
        this.y = y;
        this.targetLocation = targetLocation;
        this.label = label;
        this.size = CONSTANTS.TILE_SIZE;
        this.animationTimer = 0;
    }

    update() {
        this.animationTimer++;
    }

    render(ctx) {
        const centerX = this.x + CONSTANTS.TILE_SIZE / 2;
        const centerY = this.y + CONSTANTS.TILE_SIZE / 2;
        const pulse = Math.sin(this.animationTimer * 0.1) * 4;

        // Свечение
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.size / 2 + pulse);
        gradient.addColorStop(0, 'rgba(170, 68, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(170, 68, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.size / 2 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Иконка
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌀', centerX, centerY);
    }

    interact(player, game) {
        // 🆕 Проверка разблокировки для арены выживания
        if (this.targetLocation === 'arena_survival') {
            const completedEpochs = player.completedEpochs || [];
            if (!completedEpochs.includes('epoch_dungeon')) {
                alert('❌ Арена выживания заблокирована!\n\nПобеди Хранителя Руин в Древнем подземелье, чтобы открыть её.');
                return;
            }
        }

        // Проверка разблокировки для эпох
        if (this.targetLocation.startsWith('epoch_') && this.targetLocation !== 'epoch_dungeon') {
            const epochId = this.targetLocation.replace('epoch_', '');
            const epoch = typeof EPOCHS !== 'undefined' ? EPOCHS[epochId] : null;

            if (epoch && !epoch.unlocked) {
                if (epoch.requirements && epoch.requirements.completedEpochs) {
                    const completedEpochs = player.completedEpochs || [];
                    const allCompleted = epoch.requirements.completedEpochs.every(
                        req => completedEpochs.includes(req)
                    );

                    if (!allCompleted) {
                        alert('❌ Требуется завершить: ' + epoch.requirements.completedEpochs.join(', '));
                        return;
                    }
                }
            }
        }

        game.changeLocation(this.targetLocation);
    }
}
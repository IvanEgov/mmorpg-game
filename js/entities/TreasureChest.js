class TreasureChest {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isOpen = false;
        this.uniqueId = 'chest_' + Math.floor(x) + '_' + Math.floor(y);
    }

    interact(player, game) {
        if (this.isOpen) {
            console.log('📦 Сундук уже открыт');
            return;
        }

        this.isOpen = true;

        // Случайный лут
        const lootTable = [
            { itemId: 'potion_hp', chance: 0.5, count: 2 },
            { itemId: 'potion_mp', chance: 0.3, count: 1 },
            { itemId: 'sword_iron', chance: 0.1, count: 1 },
            { itemId: 'helmet_leather', chance: 0.1, count: 1 }
        ];

        const rewards = [];
        for (const item of lootTable) {
            if (Math.random() < item.chance) {
                player.addItem(item.itemId, item.count);
                rewards.push(`${CONSTANTS.ITEMS[item.itemId].name} x${item.count}`);
            }
        }

        // Золото
        const goldReward = 20 + Math.floor(Math.random() * 30);
        player.gold += goldReward;
        rewards.push(`${goldReward} золота`);

        console.log(`🎁 Из сундука получено: ${rewards.join(', ')}`);

        // Обновляем UI
        game.ui.updateHUD();
        game.saveGame();

        // Синхронизация с другими игроками
        if (game.network.connected) {
            game.network.reportChestOpened(this.uniqueId, game.currentLocationId);
        }
    }

    render(ctx) {
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 🆕 Открытые сундуки показываются как пустые
        const icon = this.isOpen ? '📭' : '📦';
        ctx.fillText(icon, this.x + CONSTANTS.TILE_SIZE / 2, this.y + CONSTANTS.TILE_SIZE / 2);

        // 🆕 Если сундук открыт — делаем его полупрозрачным
        if (this.isOpen) {
            ctx.globalAlpha = 0.5;
        }
    }
}
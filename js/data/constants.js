const CONSTANTS = {
    TILE_SIZE: 32,
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 640,
    MAP_WIDTH: 30,
    MAP_HEIGHT: 20,
    PLAYER_SPEED: 3,
    ATTACK_RANGE: 50, // Радиус атаки в пикселях
    ATTACK_COOLDOWN: 30, // Кадров между атаками
    COLORS: {
        GRASS: '#2d5a3d',
        WALL: '#555555',
        PLAYER_BODY: '#4a90e2',
        PLAYER_OUTLINE: '#2c3e50',
        ENEMY_BODY: '#e74c3c',
        ENEMY_OUTLINE: '#c0392b',
        HP_BAR_BG: '#500000',
        HP_BAR_FILL: '#e74c3c'
    },
    ITEMS: {
        'potion_hp': { id: 'potion_hp', name: 'Зелье здоровья', icon: '🧪', type: 'consumable', heal: 30, price: 20, desc: 'Восстанавливает 30 HP' },
        'potion_mp': { id: 'potion_mp', name: 'Зелье маны', icon: '💧', type: 'consumable', mp: 20, price: 25, desc: 'Восстанавливает 20 MP' },
        'sword_iron': { id: 'sword_iron', name: 'Железный меч', icon: '🗡️', type: 'weapon', atk: 5, price: 100, desc: '+5 к атаке' },
        'armor_leather': { id: 'armor_leather', name: 'Кожаная броня', icon: '🦺', type: 'armor', def: 3, price: 80, desc: '+3 к защите' },
        'slime_gel': { id: 'slime_gel', name: 'Слизь слайма', icon: '🟢', type: 'material', price: 5, desc: 'Материал для крафта' }
    },
    SKILLS: {
        'power_strike': { id: 'power_strike', name: 'Мощный удар', icon: '💥', desc: '+5% к урону за уровень', maxLevel: 5, costPerLevel: 1 },
        'vitality': { id: 'vitality', name: 'Живучесть', icon: '❤️', desc: '+15 к макс. HP за уровень', maxLevel: 5, costPerLevel: 1 },
        'agility': { id: 'agility', name: 'Ловкость', icon: '💨', desc: '+2% к скорости движения за уровень', maxLevel: 3, costPerLevel: 1 }
    },
    ENEMIES: {
        'slime': {
            id: 'slime',
            name: 'Слайм',
            icon: '🟢',
            hp: 30,
            atk: 5,
            speed: 1.5,
            xpReward: 25,
            goldReward: 10,
            lootTable: [
                { itemId: 'slime_gel', chance: 0.5 }, // 50% шанс
                { itemId: 'potion_hp', chance: 0.2 }  // 20% шанс
            ]
        }
    }
};
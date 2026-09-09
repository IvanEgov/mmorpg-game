const CONSTANTS = {
    TILE_SIZE: 32,
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 640,
    MAP_WIDTH: 30,
    MAP_HEIGHT: 20,
    PLAYER_SPEED: 3,
    ATTACK_RANGE: 60,
    ATTACK_COOLDOWN: 25,
    COLORS: {
        GRASS: '#2d5a3d',
        WALL: '#555555',
        PLAYER_BODY: '#4a90e2',
        ENEMY_BODY: '#e74c3c',
        HP_BAR_BG: '#500000',
        HP_BAR_FILL: '#e74c3c'
    },
    ITEMS: {
        'potion_hp': { id: 'potion_hp', name: 'Зелье HP', icon: '🧪', type: 'consumable', heal: 30, price: 20, desc: '+30 HP' },
        'sword_iron': { id: 'sword_iron', name: 'Железный меч', icon: '🗡️', type: 'weapon', atk: 5, price: 100, desc: '+5 атака' },
        'armor_leather': { id: 'armor_leather', name: 'Кожаная броня', icon: '🦺', type: 'armor', def: 3, price: 80, desc: '+3 защита' },
        'slime_gel': { id: 'slime_gel', name: 'Слизь', icon: '🟢', type: 'material', price: 5, desc: 'Материал' }
    },
    SKILLS: {
        'power_strike': { id: 'power_strike', name: 'Мощный удар', icon: '💥', desc: '+5% урона/ур.', maxLevel: 5, costPerLevel: 1 },
        'vitality': { id: 'vitality', name: 'Живучесть', icon: '❤️', desc: '+15 HP/ур.', maxLevel: 5, costPerLevel: 1 },
        'agility': { id: 'agility', name: 'Ловкость', icon: '💨', desc: '+0.3 скорости/ур.', maxLevel: 3, costPerLevel: 1 }
    },
    ENEMIES: {
        'slime': {
            id: 'slime', name: 'Слайм', icon: '🟢',
            hp: 30, atk: 5, speed: 1.2,
            xpReward: 25, goldReward: 10,
            lootTable: [
                { itemId: 'slime_gel', chance: 0.5 },
                { itemId: 'potion_hp', chance: 0.2 }
            ]
        }
    }
};
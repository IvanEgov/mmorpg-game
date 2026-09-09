const CONSTANTS = {
    TILE_SIZE: 32,
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 640,
    MAP_WIDTH: 30,
    MAP_HEIGHT: 20,
    PLAYER_SPEED: 3,
    ATTACK_RANGE: 60,
    ATTACK_COOLDOWN: 25,
    INTERACT_RANGE: 50,
    COLORS: {
        GRASS: '#2d5a3d',
        WALL: '#555555',
        ROAD: '#8a7a5a',
        WATER: '#2a5a8a',
        HOUSE: '#6a4a2a',
        ROOF: '#8b3a3a',
        DUNGEON_FLOOR: '#2a2a3e',
        DUNGEON_WALL: '#1a1a2a',
        PLAYER_BODY: '#4a90e2',
        ENEMY_BODY: '#e74c3c',
        HP_BAR_BG: '#500000',
        HP_BAR_FILL: '#e74c3c',
        PORTAL: '#a4f'
    },
    ITEMS: {
        'potion_hp': { id: 'potion_hp', name: 'Зелье HP', icon: '🧪', type: 'consumable', heal: 30, price: 20, desc: '+30 HP' },
        'potion_mp': { id: 'potion_mp', name: 'Зелье MP', icon: '💧', type: 'consumable', mp: 20, price: 25, desc: '+20 MP' },
        'sword_iron': { id: 'sword_iron', name: 'Железный меч', icon: '🗡️', type: 'weapon', atk: 5, price: 100, desc: '+5 атака' },
        'sword_steel': { id: 'sword_steel', name: 'Стальной меч', icon: '⚔️', type: 'weapon', atk: 12, price: 300, desc: '+12 атака' },
        'armor_leather': { id: 'armor_leather', name: 'Кожаная броня', icon: '🦺', type: 'armor', def: 3, price: 80, desc: '+3 защита' },
        'armor_chain': { id: 'armor_chain', name: 'Кольчуга', icon: '🛡️', type: 'armor', def: 8, price: 250, desc: '+8 защита' },
        'slime_gel': { id: 'slime_gel', name: 'Слизь', icon: '🟢', type: 'material', price: 5, desc: 'Материал' }
    },
    SHOP_ITEMS: {
        'mage': ['potion_hp', 'potion_mp', 'sword_iron', 'armor_leather'],
        'smith': ['sword_steel', 'armor_chain', 'sword_iron']
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
        },
        'bat': {
            id: 'bat', name: 'Летучая мышь', icon: '🦇',
            hp: 20, atk: 8, speed: 2.0,
            xpReward: 30, goldReward: 15,
            lootTable: [
                { itemId: 'potion_hp', chance: 0.3 }
            ]
        }
    },
    QUESTS: {
        'kill_slimes': {
            id: 'kill_slimes',
            name: 'Охота на слаймов',
            giver: 'mage',
            description: 'Убей 5 слаймов в подземелье',
            target: 'slime',
            targetCount: 5,
            reward: { gold: 100, xp: 50 }
        },
        'collect_gel': {
            id: 'collect_gel',
            name: 'Сбор слизи',
            giver: 'mage',
            description: 'Принеси 3 слизи слайма',
            target: 'slime_gel',
            targetCount: 3,
            reward: { gold: 80, xp: 30 }
        }
    }
};
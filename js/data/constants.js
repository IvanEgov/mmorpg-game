console.log('✅ Файл constants.js успешно загружен!');

const CONSTANTS = {
    TILE_SIZE: 32,
    CANVAS_WIDTH: 960,
    CANVAS_HEIGHT: 640,
    MAP_WIDTH: 30,
    MAP_HEIGHT: 20,

    // 🆕 Размеры для больших локаций
    LARGE_MAP_WIDTH: 150,   // Было 60
    LARGE_MAP_HEIGHT: 100,  // Было 40

    PLAYER_SPEED: 3,
    ATTACK_RANGE: 60,
    ATTACK_COOLDOWN: 25,
    INTERACT_RANGE: 50,
    EQUIPMENT_SLOTS: ['weapon', 'helmet', 'chest', 'legs', 'boots', 'ring'],
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
        'sword_dragon': { id: 'sword_dragon', name: 'Меч дракона', icon: '🔥', type: 'weapon', atk: 25, price: 1000, desc: '+25 атака' },
        'helmet_leather': { id: 'helmet_leather', name: 'Кожаный шлем', icon: '🪖', type: 'helmet', def: 2, price: 60, desc: '+2 защита' },
        'helmet_iron': { id: 'helmet_iron', name: 'Железный шлем', icon: '⛑️', type: 'helmet', def: 5, price: 200, desc: '+5 защита' },
        'armor_leather': { id: 'armor_leather', name: 'Кожаная броня', icon: '🦺', type: 'chest', def: 3, price: 80, desc: '+3 защита' },
        'armor_chain': { id: 'armor_chain', name: 'Кольчуга', icon: '🛡️', type: 'chest', def: 8, price: 250, desc: '+8 защита' },
        'armor_plate': { id: 'armor_plate', name: 'Латные доспехи', icon: '🦾', type: 'chest', def: 15, price: 600, desc: '+15 защита' },
        'legs_leather': { id: 'legs_leather', name: 'Кожаные штаны', icon: '👖', type: 'legs', def: 2, price: 70, desc: '+2 защита' },
        'legs_chain': { id: 'legs_chain', name: 'Кольчужные поножи', icon: '🩳', type: 'legs', def: 6, price: 220, desc: '+6 защита' },
        'boots_leather': { id: 'boots_leather', name: 'Кожаные сапоги', icon: '👢', type: 'boots', def: 1, speed: 0.2, price: 50, desc: '+1 защита, +0.2 скорость' },
        'boots_iron': { id: 'boots_iron', name: 'Железные сапоги', icon: '🥾', type: 'boots', def: 3, speed: 0.1, price: 180, desc: '+3 защита, +0.1 скорость' },
        'ring_power': { id: 'ring_power', name: 'Кольцо силы', icon: '💍', type: 'ring', atk: 3, price: 150, desc: '+3 атака' },
        'ring_vitality': { id: 'ring_vitality', name: 'Кольцо живучести', icon: '💎', type: 'ring', hp: 30, price: 200, desc: '+30 HP' },
        'slime_gel': { id: 'slime_gel', name: 'Слизь', icon: '🟢', type: 'material', price: 5, desc: 'Материал' }
    },
    SHOP_ITEMS: {
        'mage': ['potion_hp', 'potion_mp', 'sword_iron', 'armor_leather', 'helmet_leather', 'ring_power'],
        'smith': ['sword_steel', 'armor_chain', 'legs_chain', 'boots_iron', 'helmet_iron', 'ring_vitality']
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
            id: 'kill_slimes', name: 'Охота на слаймов', giver: 'mage',
            description: 'Убей 5 слаймов в подземелье', target: 'slime', targetCount: 5,
            reward: { gold: 100, xp: 50 }
        },
        'collect_gel': {
            id: 'collect_gel', name: 'Сбор слизи', giver: 'mage',
            description: 'Принеси 3 слизи слайма', target: 'slime_gel', targetCount: 3,
            reward: { gold: 80, xp: 30 }
        }
    },
    ARENA: {
        MAP_WIDTH: 200,   // 🆕 Было 150
        MAP_HEIGHT: 150,  // 🆕 Было 100
        WAVE_INTERVAL: 12000,  // 🆕 Было 15000 (быстрее волны)
        INITIAL_MOBS: 8,       // 🆕 Было 5
        MOBS_PER_WAVE: 4,      // 🆕 Было 3
        LEVEL_SCALE_INTERVAL: 3,
        LEVEL_SCALE_POWER: 1.5,
        BAT_BASE_HP: 20,
        BAT_BASE_ATK: 8,
        BAT_BASE_SPEED: 2.0
    },
        BOSSES: {
        'ruins_guardian': {
            id: 'ruins_guardian',
            name: 'Хранитель Руин',
            icon: '👹',
            type: 'boss',
            hp: 500,
            atk: 20,
            speed: 1.3,
            xpReward: 500,
            goldReward: 300,
            size: 2,
            lootTable: [
                { itemId: 'potion_hp', chance: 1.0, count: 5 },
                { itemId: 'sword_steel', chance: 0.5, count: 1 },
                { itemId: 'ring_power', chance: 0.3, count: 1 }
            ],
            unlocksEpoch: 'blood_arena',
            color: '#8b0000',
            enragedColor: '#ff0000'
        }
    }
};
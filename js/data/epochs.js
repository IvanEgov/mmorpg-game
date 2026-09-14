const EPOCHS = {
    'epoch_dungeon': {
        id: 'epoch_dungeon',
        name: 'Древнее подземелье',
        description: 'Первое воплощение. Победи Хранителя Руин.',
        icon: '🏛️',
        type: 'dungeon',
        unlocked: true,
        requirements: null,
        rewards: {
            nextEpoch: 'arena_survival',
            artifact: 'ancient_compass'
        }
    },
    'arena_survival': {
        id: 'arena_survival',
        name: 'Арена выживания',
        description: 'Второе воплощение. Бесконечные волны врагов.',
        icon: '⚔️',
        type: 'survival',
        unlocked: false,
        requirements: {
            completedEpochs: ['epoch_dungeon']
        },
        rewards: {
            nextEpoch: 'medieval',
            artifact: 'blood_crown'
        }
    },
    'medieval': {
        id: 'medieval',
        name: 'Средневековье',
        description: 'Третье воплощение. Строительство и управление.',
        icon: '🏰',
        type: 'building',
        unlocked: false,
        requirements: {
            completedEpochs: ['arena_survival']
        },
        rewards: {
            nextEpoch: 'magic_lands',
            artifact: 'builders_hammer'
        }
    },
    'magic_lands': {
        id: 'magic_lands',
        name: 'Магические земли',
        description: 'Четвёртое воплощение. Алхимия и сбор ресурсов.',
        icon: '🌿',
        type: 'gathering',
        unlocked: false,
        requirements: {
            completedEpochs: ['medieval']
        },
        rewards: {
            nextEpoch: 'apocalypse',
            artifact: 'philosophers_stone'
        }
    }
};
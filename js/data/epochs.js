const EPOCHS = {
    'ancient_ruins': {
        id: 'ancient_ruins',
        name: 'Древние руины',
        description: 'Первое воплощение. Искатель сокровищ в заброшенных храмах.',
        icon: '🏛️',
        type: 'treasure_hunting',
        unlocked: true,
        requirements: null,
        rewards: {
            nextEpoch: 'blood_arena',
            artifact: 'ancient_compass'
        }
    },
    'blood_arena': {
        id: 'blood_arena',
        name: 'Арена Крови',
        description: 'Второе воплощение. Бесконечные волны врагов.',
        icon: '⚔️',
        type: 'survival',
        unlocked: false,
        requirements: {
            completedEpochs: ['ancient_ruins']
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
            completedEpochs: ['blood_arena']
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
    // ... остальные 5 эпох добавим позже
};
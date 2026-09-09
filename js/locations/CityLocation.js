class CityLocation extends Location {
    constructor() {
        super('🏰 Стартовый город');
        this.generateMap();
        this.spawnNPCs();
        this.spawnPortals();
    }

    generateMap() {
        // Создаём карту города
        for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
            this.map[y] = [];
            for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
                // Границы - стены
                if (x === 0 || y === 0 || x === CONSTANTS.MAP_WIDTH - 1 || y === CONSTANTS.MAP_HEIGHT - 1) {
                    this.map[y][x] = 1;
                }
                // Дороги крестом
                else if (y === Math.floor(CONSTANTS.MAP_HEIGHT / 2)) {
                    this.map[y][x] = 2;
                }
                else if (x === Math.floor(CONSTANTS.MAP_WIDTH / 2)) {
                    this.map[y][x] = 2;
                }
                // Дома по углам
                else if ((x >= 3 && x <= 6 && y >= 3 && y <= 5) ||
                    (x >= 23 && x <= 26 && y >= 3 && y <= 5) ||
                    (x >= 3 && x <= 6 && y >= 14 && y <= 16) ||
                    (x >= 23 && x <= 26 && y >= 14 && y <= 16)) {
                    this.map[y][x] = 4;
                }
                // Фонтан в центре
                else if (x === Math.floor(CONSTANTS.MAP_WIDTH / 2) && y === Math.floor(CONSTANTS.MAP_HEIGHT / 2)) {
                    this.map[y][x] = 3;
                }
                // Остальное - трава
                else {
                    this.map[y][x] = 0;
                }
            }
        }
    }

    spawnNPCs() {
        // Маг (магазин + квесты)
        this.entities.push(new NPC(5 * CONSTANTS.TILE_SIZE, 7 * CONSTANTS.TILE_SIZE, 'mage', '🧙 Маг Элрин'));
        // Кузнец (магазин)
        this.entities.push(new NPC(24 * CONSTANTS.TILE_SIZE, 7 * CONSTANTS.TILE_SIZE, 'smith', '⚒️ Кузнец Бром'));
        // Хранитель (хранилище)
        this.entities.push(new NPC(5 * CONSTANTS.TILE_SIZE, 12 * CONSTANTS.TILE_SIZE, 'keeper', '📦 Хранитель'));
        // Старейшина (квесты)
        this.entities.push(new NPC(24 * CONSTANTS.TILE_SIZE, 12 * CONSTANTS.TILE_SIZE, 'elder', '👑 Старейшина'));
    }

    spawnPortals() {
        // Портал в подземелье 1 (слаймы)
        this.entities.push(new Portal(
            Math.floor(CONSTANTS.MAP_WIDTH / 2) * CONSTANTS.TILE_SIZE,
            2 * CONSTANTS.TILE_SIZE,
            'dungeon_1',
            '🕳️ Подземелье (Слаймы)'
        ));
        // Портал в подземелье 2 (летучие мыши)
        this.entities.push(new Portal(
            2 * CONSTANTS.TILE_SIZE,
            Math.floor(CONSTANTS.MAP_HEIGHT / 2) * CONSTANTS.TILE_SIZE,
            'dungeon_2',
            '🕳️ Пещера (Летучие мыши)'
        ));
    }
}
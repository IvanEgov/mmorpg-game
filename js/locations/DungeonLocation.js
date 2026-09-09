class DungeonLocation extends Location {
    constructor(dungeonId) {
        super(dungeonId === 'dungeon_1' ? '⚔️ Подземелье' : '⚔️ Пещера');
        this.dungeonId = dungeonId;
        this.generateMap();
        this.spawnEnemies();
        this.spawnExitPortal();
    }

    generateMap() {
        // Простой данж: комната с врагами
        for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
            this.map[y] = [];
            for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
                // Границы - стены
                if (x === 0 || y === 0 || x === CONSTANTS.MAP_WIDTH - 1 || y === CONSTANTS.MAP_HEIGHT - 1) {
                    this.map[y][x] = 7;
                }
                // Препятствия внутри
                else if ((x === 8 || x === 22) && (y === 5 || y === 15)) {
                    this.map[y][x] = 7;
                }
                // Пол
                else {
                    this.map[y][x] = 6;
                }
            }
        }
    }

    spawnEnemies() {
        const enemyType = this.dungeonId === 'dungeon_1' ? 'slime' : 'bat';
        const count = this.dungeonId === 'dungeon_1' ? 5 : 4;

        for (let i = 0; i < count; i++) {
            const x = (5 + Math.random() * 20) * CONSTANTS.TILE_SIZE;
            const y = (5 + Math.random() * 10) * CONSTANTS.TILE_SIZE;
            this.entities.push(new Enemy(x, y, enemyType));
        }
    }

    spawnExitPortal() {
        this.entities.push(new Portal(
            2 * CONSTANTS.TILE_SIZE,
            2 * CONSTANTS.TILE_SIZE,
            'city',
            '🏰 Выход в город'
        ));
    }
}
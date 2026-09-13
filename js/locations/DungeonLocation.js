class DungeonLocation extends Location {
    constructor(dungeonId) {
        const names = {
            'dungeon_1': '⚔️ Подземелье',
            'dungeon_2': '🦇 Арена летучих мышей',
            'arena_survival': '💀 Арена выживания'
        };
        super(names[dungeonId] || '⚔️ Данж');
        this.dungeonId = dungeonId;
        this.spawnX = 3 * CONSTANTS.TILE_SIZE;
        this.spawnY = 3 * CONSTANTS.TILE_SIZE;
        this.generateMap();
        
        // Для арены выживания мобы не спавнятся сразу — их добавит WaveManager
        if (dungeonId !== 'arena_survival') {
            this.spawnEnemies();
        }
        this.spawnExitPortal();
    }

    generateMap() {
        // Определяем размер карты
        const isArena = this.dungeonId === 'arena_survival';
        const mapW = isArena ? CONSTANTS.ARENA.MAP_WIDTH : CONSTANTS.MAP_WIDTH;
        const mapH = isArena ? CONSTANTS.ARENA.MAP_HEIGHT : CONSTANTS.MAP_HEIGHT;

        this.mapWidth = mapW;
        this.mapHeight = mapH;

        for (let y = 0; y < mapH; y++) {
            this.map[y] = [];
            for (let x = 0; x < mapW; x++) {
                // Границы - стены
                if (x === 0 || y === 0 || x === mapW - 1 || y === mapH - 1) {
                    this.map[y][x] = 7;
                }
                // Арена: случайные препятствия-колонны
                else if (isArena && Math.random() < 0.04 && x > 3 && y > 3 && x < mapW - 4 && y < mapH - 4) {
                    this.map[y][x] = 7;
                }
                // Обычный данж: препятствия
                else if (!isArena && ((x === 8 || x === 22) && (y === 5 || y === 15))) {
                    this.map[y][x] = 7;
                }
                // Пол
                else {
                    this.map[y][x] = 6;
                }
            }
        }
    }

    // Переопределяем isWalkable для больших карт
    isWalkable(x, y) {
        const tileX = Math.floor(x / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(y / CONSTANTS.TILE_SIZE);
        const mapW = this.mapWidth || CONSTANTS.MAP_WIDTH;
        const mapH = this.mapHeight || CONSTANTS.MAP_HEIGHT;
        if (tileX < 0 || tileY < 0 || tileX >= mapW || tileY >= mapH) return false;
        if (!this.map[tileY]) return false;
        const tile = this.map[tileY][tileX];
        return tile !== 1 && tile !== 3 && tile !== 4 && tile !== 5 && tile !== 7;
    }

    spawnEnemies() {
        const enemyType = this.dungeonId === 'dungeon_1' ? 'slime' : 'bat';
        const count = this.dungeonId === 'dungeon_1' ? 5 : 4;

        for (let i = 0; i < count; i++) {
            let x, y, attempts = 0;
            const mapW = this.mapWidth || CONSTANTS.MAP_WIDTH;
            const mapH = this.mapHeight || CONSTANTS.MAP_HEIGHT;
            do {
                x = (3 + Math.random() * (mapW - 6)) * CONSTANTS.TILE_SIZE;
                y = (3 + Math.random() * (mapH - 6)) * CONSTANTS.TILE_SIZE;
                attempts++;
            } while (!this.isWalkable(x, y) && attempts < 50);

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
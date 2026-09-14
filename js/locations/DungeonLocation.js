class DungeonLocation extends Location {
    constructor(dungeonId) {
        const names = {
            'dungeon_1': '⚔️ Подземелье',
            'dungeon_2': '🦇 Пещера летучих мышей',
            'arena_survival': '💀 Арена выживания',
            'epoch_dungeon': '🏛️ Древнее подземелье',
            'epoch_arena': '⚔️ Арена выживания'
        };
        super(names[dungeonId] || '⚔️ Данж');
        this.dungeonId = dungeonId;
        this.spawnX = 3 * CONSTANTS.TILE_SIZE;
        this.spawnY = 3 * CONSTANTS.TILE_SIZE;
        this.generateMap();

        // 🆕 Для арены выживания мобы не спавнятся сразу
        if (dungeonId !== 'arena_survival' && dungeonId !== 'epoch_arena') {
            this.spawnEnemies();
        }
        this.spawnExitPortal();
    }

    generateMap() {
        const isArena = this.dungeonId === 'arena_survival' || this.dungeonId === 'epoch_arena';
        const mapW = isArena ? CONSTANTS.ARENA.MAP_WIDTH : CONSTANTS.LARGE_MAP_WIDTH;
        const mapH = isArena ? CONSTANTS.ARENA.MAP_HEIGHT : CONSTANTS.LARGE_MAP_HEIGHT;

        this.mapWidth = mapW;
        this.mapHeight = mapH;

        for (let y = 0; y < mapH; y++) {
            this.map[y] = [];
            for (let x = 0; x < mapW; x++) {
                if (x === 0 || y === 0 || x === mapW - 1 || y === mapH - 1) {
                    this.map[y][x] = 7;
                } else if (isArena && Math.random() < 0.02 && x > 3 && y > 3 && x < mapW - 4 && y < mapH - 4) {
                    this.map[y][x] = 7;
                } else if (!isArena && ((x === 8 || x === 22) && (y === 5 || y === 15))) {
                    this.map[y][x] = 7;
                } else {
                    this.map[y][x] = 6;
                }
            }
        }

        // Безопасная зона спавна
        const spawnX = 3;
        const spawnY = 3;
        for (let y = spawnY - 2; y <= spawnY + 2; y++) {
            for (let x = spawnX - 2; x <= spawnX + 2; x++) {
                if (x > 0 && y > 0 && x < mapW - 1 && y < mapH - 1) {
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

        // 🆕 Проверка границ
        if (tileX < 0 || tileY < 0 || tileX >= mapW || tileY >= mapH) return false;
        if (!this.map[tileY]) return false;

        const tile = this.map[tileY][tileX];
        return tile !== 1 && tile !== 3 && tile !== 4 && tile !== 5 && tile !== 7;
    }
      

    spawnEnemies() {
        const enemyType = this.dungeonId === 'dungeon_1' ? 'slime' : 'bat';
        const count = this.dungeonId === 'dungeon_1' ? 5 : 4;

        // 🆕 Используем seeded random на основе ID данжа
        const rng = new SeededRandom(this.dungeonId + '_enemies');
        const mapW = this.mapWidth || CONSTANTS.MAP_WIDTH;
        const mapH = this.mapHeight || CONSTANTS.MAP_HEIGHT;

        for (let i = 0; i < count; i++) {
            let x, y, attempts = 0;
            do {
                const tileX = rng.nextInt(3, mapW - 4);
                const tileY = rng.nextInt(3, mapH - 4);
                x = tileX * CONSTANTS.TILE_SIZE;
                y = tileY * CONSTANTS.TILE_SIZE;
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
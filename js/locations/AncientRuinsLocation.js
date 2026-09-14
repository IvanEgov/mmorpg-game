class AncientRuinsLocation extends EpochLocation {
    constructor() {
        super('ancient_ruins');
        this.name = '🏛️ Древние руины';
        this.generateMap();
        this.spawnTreasures();
        this.spawnTraps();
        this.spawnExitPortal();
    }

    generateMap() {
        const mapW = CONSTANTS.LARGE_MAP_WIDTH;  // 🆕 150
        const mapH = CONSTANTS.LARGE_MAP_HEIGHT; // 🆕 100
        this.mapWidth = mapW;
        this.mapHeight = mapH;

        for (let y = 0; y < mapH; y++) {
            this.map[y] = [];
            for (let x = 0; x < mapW; x++) {
                if (x === 0 || y === 0 || x === mapW - 1 || y === mapH - 1) {
                    this.map[y][x] = 7;
                } else if (Math.random() < 0.25) {
                    this.map[y][x] = 7;
                } else {
                    this.map[y][x] = 6;
                }
            }
        }

        // Безопасная стартовая зона
        const spawnX = 3;
        const spawnY = 3;
        const safeRadius = 3;

        for (let y = spawnY - safeRadius; y <= spawnY + safeRadius; y++) {
            for (let x = spawnX - safeRadius; x <= spawnX + safeRadius; x++) {
                if (x > 0 && y > 0 && x < mapW - 1 && y < mapH - 1) {
                    this.map[y][x] = 6;
                }
            }
        }

        console.log(`✅ Карта ${mapW}x${mapH} создана. Стартовая зона: ${spawnX},${spawnY}`);
    }

    spawnTreasures() {
        // 5 сундуков с сокровищами
        for (let i = 0; i < 5; i++) {
            let x, y, attempts = 0;
            do {
                x = Math.floor(Math.random() * (this.mapWidth - 4) + 2);
                y = Math.floor(Math.random() * (this.mapHeight - 4) + 2);
                attempts++;
            } while (this.map[y][x] !== 6 && attempts < 50);

            // Создаём сундук (можно добавить класс TreasureChest)
            this.entities.push({
                x: x * CONSTANTS.TILE_SIZE,
                y: y * CONSTANTS.TILE_SIZE,
                type: 'treasure',
                render: function (ctx) {
                    ctx.font = '24px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('📦', this.x + 16, this.y + 16);
                }
            });
        }
    }

    spawnTraps() {
        // Ловушки (можно добавить класс Trap)
        for (let i = 0; i < 10; i++) {
            let x, y, attempts = 0;
            do {
                x = Math.floor(Math.random() * (this.mapWidth - 4) + 2);
                y = Math.floor(Math.random() * (this.mapHeight - 4) + 2);
                attempts++;
            } while (this.map[y][x] !== 6 && attempts < 50);

            this.entities.push({
                x: x * CONSTANTS.TILE_SIZE,
                y: y * CONSTANTS.TILE_SIZE,
                type: 'trap',
                damage: 20,
                render: function (ctx) {
                    ctx.font = '20px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('⚠️', this.x + 16, this.y + 16);
                }
            });
        }
    }

    spawnExitPortal() {
        this.entities.push(new Portal(
            2 * CONSTANTS.TILE_SIZE,
            2 * CONSTANTS.TILE_SIZE,
            'city',
            '🏰 Вернуться в Город Вечности'
        ));
    }
}
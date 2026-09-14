class AncientRuinsLocation extends EpochLocation {
    constructor() {
        super('ancient_ruins');
        this.name = '🏛️ Древние руины';
        this.generateMap();
        this.spawnTreasures();
        this.spawnSlimes();  // 🆕
        this.spawnBoss();
        this.spawnTraps();
        this.spawnExitPortal();
    }

    // 🆕 Спавн слаймов для квеста
    spawnSlimes() {
        const rng = new SeededRandom(this.dungeonId + '_slimes');
        const slimeCount = 15; // В 3 раза больше

        for (let i = 0; i < slimeCount; i++) {
            let x, y, attempts = 0;
            do {
                const tileX = rng.nextInt(5, this.mapWidth - 5);
                const tileY = rng.nextInt(5, this.mapHeight - 5);
                x = tileX * CONSTANTS.TILE_SIZE;
                y = tileY * CONSTANTS.TILE_SIZE;
                attempts++;

                // Не спавним в центре (там босс)
                const centerTileX = Math.floor(this.mapWidth / 2);
                const centerTileY = Math.floor(this.mapHeight / 2);
                if (Math.abs(tileX - centerTileX) < 10 && Math.abs(tileY - centerTileY) < 10) {
                    continue;
                }

                // Не спавним рядом со стартом игрока
                const distFromStart = Math.hypot(x - 3 * CONSTANTS.TILE_SIZE, y - 3 * CONSTANTS.TILE_SIZE);
                if (distFromStart < 200) {
                    continue;
                }
            } while (!this.isWalkable(x, y) && attempts < 50);

            if (this.isWalkable(x, y)) {
                this.entities.push(new Enemy(x, y, 'slime'));
            }
        }

        console.log('🟢 Заспавнено ' + slimeCount + ' слаймов');
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
        const rng = new SeededRandom(this.dungeonId + '_treasures');

        for (let i = 0; i < 10; i++) {
            let x, y, attempts = 0;
            do {
                const tileX = rng.nextInt(5, this.mapWidth - 5);
                const tileY = rng.nextInt(5, this.mapHeight - 5);
                x = tileX * CONSTANTS.TILE_SIZE;
                y = tileY * CONSTANTS.TILE_SIZE;
                attempts++;

                // 🆕 Не спавним сундуки в центре (там босс)
                const centerTileX = Math.floor(this.mapWidth / 2);
                const centerTileY = Math.floor(this.mapHeight / 2);
                if (Math.abs(tileX - centerTileX) < 8 && Math.abs(tileY - centerTileY) < 8) {
                    continue;
                }
            } while (!this.isWalkable(x, y) && attempts < 50);

            this.entities.push(new TreasureChest(x, y));
        }
    }

    // 🆕 Спавн босса в центре карты
    spawnBoss() {
        const bossData = CONSTANTS.BOSSES['ruins_guardian'];
        const centerX = Math.floor(this.mapWidth / 2) * CONSTANTS.TILE_SIZE;
        const centerY = Math.floor(this.mapHeight / 2) * CONSTANTS.TILE_SIZE;

        // Очищаем область вокруг босса
        const bossTileX = Math.floor(this.mapWidth / 2);
        const bossTileY = Math.floor(this.mapHeight / 2);
        for (let y = bossTileY - 4; y <= bossTileY + 4; y++) {
            for (let x = bossTileX - 4; x <= bossTileX + 4; x++) {
                if (x > 0 && y > 0 && x < this.mapWidth - 1 && y < this.mapHeight - 1) {
                    this.map[y][x] = 6;
                }
            }
        }

        const boss = new Boss(centerX, centerY, bossData);
        this.entities.push(boss);
        this.boss = boss;

        console.log('👹 Босс "' + bossData.name + '" появился в центре карты!');
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
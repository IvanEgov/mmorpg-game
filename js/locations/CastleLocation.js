class CastleLocation extends Location {
    constructor() {
        super('🏰 Крепость');
        this.mapWidth = 80;
        this.mapHeight = 60;
        this.generateMap();
        this.spawnResources();
        this.spawnShops();
        this.spawnExitPortal();

        this.towers = [];
        this.waveNumber = 0;
        this.waveTimer = 0;
        this.WAVE_INTERVAL = 20000; // 20 секунд между волнами
    }

    generateMap() {
        // Пол внутри крепости
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = 6; // Пол подземелья
            }
        }

        // Стена по периметру
        const wallThickness = 2;
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (x < wallThickness || x >= this.mapWidth - wallThickness ||
                    y < wallThickness || y >= this.mapHeight - wallThickness) {
                    this.map[y][x] = 1; // Стена
                }
            }
        }

        // Внутренние строения (магазины)
        this.createBuilding(10, 10, 5, 4);
        this.createBuilding(20, 10, 5, 4);
        this.createBuilding(30, 10, 5, 4);
    }

    createBuilding(x, y, w, h) {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                this.map[y + dy][x + dx] = 4; // Дом
            }
        }
    }

    spawnResources() {
        // Ресурсы генерируются динамически
    }

    spawnShops() {
        // Магазины внутри крепости
        this.entities.push(new NPC(12 * CONSTANTS.TILE_SIZE, 12 * CONSTANTS.TILE_SIZE, 'wood_merchant', '🪵 Торговец деревом'));
        this.entities.push(new NPC(22 * CONSTANTS.TILE_SIZE, 12 * CONSTANTS.TILE_SIZE, 'stone_merchant', '🪨 Торговец камнем'));
        this.entities.push(new NPC(32 * CONSTANTS.TILE_SIZE, 12 * CONSTANTS.TILE_SIZE, 'iron_merchant', '⚙️ Торговец железом'));
    }

    spawnExitPortal() {
        this.entities.push(new Portal(
            40 * CONSTANTS.TILE_SIZE,
            30 * CONSTANTS.TILE_SIZE,
            'city',
            '🏰 Выход в город'
        ));
    }

    update(player) {
        super.update(player);

        // Обновляем волны мобов
        this.waveTimer++;
        if (this.waveTimer >= this.WAVE_INTERVAL / 16) { // Примерно 20 секунд
            this.waveTimer = 0;
            this.spawnWave();
        }

        // Обновляем башни
        const currentTime = Date.now();
        const enemies = this.entities.filter(e => e instanceof Enemy);

        for (const tower of this.towers) {
            const attackResult = tower.update(enemies, currentTime);
            if (attackResult) {
                // Добавляем визуальный эффект выстрела
                if (window.gameInstance) {
                    window.gameInstance.addDamageNumber(
                        attackResult.targetX,
                        attackResult.targetY,
                        attackResult.damage,
                        '#ffaa00'
                    );
                }
            }
        }
    }

    spawnWave() {
        this.waveNumber++;
        const mobCount = 5 + this.waveNumber * 2;

        console.log('🌊 Волна ' + this.waveNumber + '! Спавним ' + mobCount + ' мобов');

        for (let i = 0; i < mobCount; i++) {
            // Спавним снаружи крепости
            const side = Math.floor(Math.random() * 4);
            let x, y;

            if (side === 0) { // Сверху
                x = Math.random() * this.mapWidth * CONSTANTS.TILE_SIZE;
                y = -CONSTANTS.TILE_SIZE;
            } else if (side === 1) { // Справа
                x = this.mapWidth * CONSTANTS.TILE_SIZE;
                y = Math.random() * this.mapHeight * CONSTANTS.TILE_SIZE;
            } else if (side === 2) { // Снизу
                x = Math.random() * this.mapWidth * CONSTANTS.TILE_SIZE;
                y = this.mapHeight * CONSTANTS.TILE_SIZE;
            } else { // Слева
                x = -CONSTANTS.TILE_SIZE;
                y = Math.random() * this.mapHeight * CONSTANTS.TILE_SIZE;
            }

            const enemy = new Enemy(x, y, 'slime');
            enemy.speed = 1.5; // Мобы быстрее
            this.entities.push(enemy);
        }
    }

    buildTower(x, y, towerType) {
        // Проверяем, что место на стене
        const tileX = Math.floor(x / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(y / CONSTANTS.TILE_SIZE);

        if (this.map[tileY][tileX] !== 1) {
            console.log('❌ Башню можно строить только на стене!');
            return false;
        }

        // Проверяем, нет ли уже башни
        if (this.towers.some(t => t.x === x && t.y === y)) {
            console.log('❌ Здесь уже есть башня!');
            return false;
        }

        const tower = new Tower(x, y, towerType);
        this.towers.push(tower);

        console.log('✅ Построена ' + tower.name);
        return true;
    }

    render(ctx, camera) {
        super.render(ctx, camera);

        // Рендерим башни
        for (const tower of this.towers) {
            if (camera.isEntityVisible(tower.x, tower.y)) {
                tower.render(ctx);
            }
        }
    }
}
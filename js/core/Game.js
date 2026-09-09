class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Инициализация игрока в центре карты
        const startX = (CONSTANTS.MAP_WIDTH / 2) * CONSTANTS.TILE_SIZE;
        const startY = (CONSTANTS.MAP_HEIGHT / 2) * CONSTANTS.TILE_SIZE;
        
        this.player = new Player(startX, startY);
        this.playerRenderer = new PlayerRenderer();
        
        // Простая тестовая карта (1 = стена, 0 = трава)
        this.map = this.generateTestMap();
        
        this.keys = {};
        this.setupInput();
        
        this.lastTime = 0;
    }

    generateTestMap() {
        const map = [];
        for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
            map[y] = [];
            for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
                // Границы - стены, внутри - трава
                if (x === 0 || y === 0 || x === CONSTANTS.MAP_WIDTH - 1 || y === CONSTANTS.MAP_HEIGHT - 1) {
                    map[y][x] = 1; // Стена
                } else if (x === 10 && y > 5 && y < 15) {
                    map[y][x] = 1; // Препятствие внутри для теста
                } else {
                    map[y][x] = 0; // Трава
                }
            }
        }
        return map;
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    update(deltaTime) {
        this.player.update();

        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['ц']) dy -= CONSTANTS.PLAYER_SPEED;
        if (this.keys['s'] || this.keys['ы']) dy += CONSTANTS.PLAYER_SPEED;
        if (this.keys['a'] || this.keys['ф']) dx -= CONSTANTS.PLAYER_SPEED;
        if (this.keys['d'] || this.keys['в']) dx += CONSTANTS.PLAYER_SPEED;

        if (dx !== 0 || dy !== 0) {
            this.player.move(dx, dy, this.map);
        } else {
            this.player.isMoving = false;
        }

        this.updateUI();
    }

    render() {
        // Очистка
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Отрисовка карты
        for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
            for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
                const tile = this.map[y][x];
                this.ctx.fillStyle = tile === 1 ? CONSTANTS.COLORS.WALL : CONSTANTS.COLORS.GRASS;
                this.ctx.fillRect(x * CONSTANTS.TILE_SIZE, y * CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
                
                // Сетка для наглядности (можно убрать потом)
                this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                this.ctx.strokeRect(x * CONSTANTS.TILE_SIZE, y * CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
            }
        }

        // Отрисовка игрока (делегируем рендереру)
        this.playerRenderer.render(this.ctx, this.player);
    }

    updateUI() {
        // Здесь потом будет обновление HTML элементов HUD
        // Пока просто в консоль при изменении HP
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    start() {
        requestAnimationFrame((t) => this.loop(t));
    }
}
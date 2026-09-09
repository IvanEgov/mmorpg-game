class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        const startX = (CONSTANTS.MAP_WIDTH / 2) * CONSTANTS.TILE_SIZE;
        const startY = (CONSTANTS.MAP_HEIGHT / 2) * CONSTANTS.TILE_SIZE;
        
        this.player = new Player(startX, startY);
        this.playerRenderer = new PlayerRenderer();
        this.ui = new UIManager(this.player); // <-- Новый менеджер UI
        
        this.map = this.generateTestMap();
        this.keys = {};
        this.setupInput();
        this.lastTime = 0;
        
        this.updateHUD();
    }

    // ... generateTestMap и setupInput остаются без изменений ...
    generateTestMap() {
        const map = [];
        for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
            map[y] = [];
            for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
                if (x === 0 || y === 0 || x === CONSTANTS.MAP_WIDTH - 1 || y === CONSTANTS.MAP_HEIGHT - 1) {
                    map[y][x] = 1;
                } else if (x === 10 && y > 5 && y < 15) {
                    map[y][x] = 1;
                } else {
                    map[y][x] = 0;
                }
            }
        }
        return map;
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            
            // Горячие клавиши UI (работают только если не в поле ввода, если добавишь чат)
            if (key === 'i' || key === 'ш') this.ui.toggle('panel-inventory');
            if (key === 'c' || key === 'с') this.ui.toggle('panel-stats');
            if (key === 'k' || key === 'л') this.ui.toggle('panel-skills');
            if (key === 'escape') {
                document.querySelectorAll('.game-panel').forEach(p => p.classList.add('hidden'));
                this.ui.activePanel = null;
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    update(deltaTime) {
        // Если открыта любая панель, ставим игру на паузу
        if (this.ui.activePanel) return;

        this.player.update();

        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['ц']) dy -= 1;
        if (this.keys['s'] || this.keys['ы']) dy += 1;
        if (this.keys['a'] || this.keys['ф']) dx -= 1;
        if (this.keys['d'] || this.keys['в']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            this.player.move(dx, dy, this.map);
        } else {
            this.player.isMoving = false;
        }

        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('hp').textContent = Math.floor(this.player.hp);
        document.getElementById('hpMax').textContent = this.player.maxHp;
        document.getElementById('lvl').textContent = '1'; // Пока заглушка
        document.getElementById('gold').textContent = this.player.gold || 0;
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
            for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
                const tile = this.map[y][x];
                this.ctx.fillStyle = tile === 1 ? CONSTANTS.COLORS.WALL : CONSTANTS.COLORS.GRASS;
                this.ctx.fillRect(x * CONSTANTS.TILE_SIZE, y * CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
            }
        }

        this.playerRenderer.render(this.ctx, this.player);
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
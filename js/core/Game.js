class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        const startX = (CONSTANTS.MAP_WIDTH / 2) * CONSTANTS.TILE_SIZE;
        const startY = (CONSTANTS.MAP_HEIGHT / 2) * CONSTANTS.TILE_SIZE;
        
        this.player = new Player(startX, startY);
        this.playerRenderer = new PlayerRenderer();
        this.ui = new UIManager(this.player);
        
        this.map = this.generateTestMap();
        this.keys = {};
        this.setupInput();
        
        this.lastTime = 0;
        this.ui.updateHUD(); // Инициализация HUD
        
        // ВАЖНО: Делаем экземпляр доступным глобально для onclick в HTML
        window.gameInstance = this;
    }

    generateTestMap() {
        const map = [];
        for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
            map[y] = [];
            for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
                if (x === 0 || y === 0 || x === CONSTANTS.MAP_WIDTH - 1 || y === CONSTANTS.MAP_HEIGHT - 1) map[y][x] = 1;
                else if (x === 10 && y > 5 && y < 15) map[y][x] = 1;
                else map[y][x] = 0;
            }
        }
        return map;
    }

    setupInput() {
        // Клавиатура
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'i') this.ui.toggle('panel-inventory');
            if (e.key.toLowerCase() === 'c') this.ui.toggle('panel-stats');
            if (e.key.toLowerCase() === 'k') this.ui.toggle('panel-skills');
            if (e.key === 'Escape') {
                document.querySelectorAll('.game-panel').forEach(p => p.classList.add('hidden'));
                this.ui.activePanel = null;
            }
            // ТЕСТ: Пробел дает 50 опыта (чтобы ты мог протестировать уровень)
            if (e.code === 'Space') {
                this.player.gainXp(50);
                this.ui.updateHUD();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Мобильное управление (Touch)
        const touchBtns = document.querySelectorAll('.d-btn, .action-btn');
        touchBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Предотвращает зум и скролл
                const key = btn.getAttribute('data-key');
                this.keys[key] = true;
                btn.classList.add('pressed');
                
                if (key === ' ') { // Кнопка действия
                    this.player.gainXp(50); // Тест: даем опыт при нажатии
                    this.ui.updateHUD();
                }
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                const key = btn.getAttribute('data-key');
                this.keys[key] = false;
                btn.classList.remove('pressed');
            }, { passive: false });
        });
    }

    update(deltaTime) {
        if (this.ui.activePanel) return; // Пауза при открытом меню

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
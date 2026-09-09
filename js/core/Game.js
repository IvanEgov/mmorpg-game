class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        const startX = (CONSTANTS.MAP_WIDTH / 2) * CONSTANTS.TILE_SIZE;
        const startY = (CONSTANTS.MAP_HEIGHT / 2) * CONSTANTS.TILE_SIZE;
        
        this.player = new Player(startX, startY);
        this.playerRenderer = new PlayerRenderer();
        this.enemyRenderer = new EnemyRenderer();
        this.ui = new UIManager(this.player);
        
        this.map = this.generateTestMap();
        this.enemies = [];
        this.keys = {};
        
        this.joystickActive = false;
        this.joystickX = 0;
        this.joystickY = 0;
        
        this.lastTime = 0;
        this.ui.updateHUD();
        
        window.gameInstance = this;
        
        this.spawnEnemies(); // Спавним врагов
        this.setupInput();
        this.setupJoystick();
        this.setupMobileMenu();
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

    spawnEnemies() {
        // Спавним 3 слайма в разных местах карты
        this.enemies.push(new Enemy(5 * CONSTANTS.TILE_SIZE, 5 * CONSTANTS.TILE_SIZE, 'slime'));
        this.enemies.push(new Enemy(20 * CONSTANTS.TILE_SIZE, 8 * CONSTANTS.TILE_SIZE, 'slime'));
        this.enemies.push(new Enemy(15 * CONSTANTS.TILE_SIZE, 15 * CONSTANTS.TILE_SIZE, 'slime'));
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key.toLowerCase() === 'i') this.ui.toggle('panel-inventory');
            if (e.key.toLowerCase() === 'c') this.ui.toggle('panel-stats');
            if (e.key.toLowerCase() === 'k') this.ui.toggle('panel-skills');
            if (e.key === 'Escape') {
                document.querySelectorAll('.game-panel').forEach(p => p.classList.add('hidden'));
                this.ui.activePanel = null;
            }
            // Атака по пробелу
            if (e.code === 'Space') {
                e.preventDefault();
                this.performAttack();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Кнопка атаки (мобильная)
        const actionBtn = document.querySelector('.action-btn');
        if (actionBtn) {
            actionBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.performAttack();
                actionBtn.classList.add('pressed');
            }, { passive: false });
            actionBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                actionBtn.classList.remove('pressed');
            }, { passive: false });
        }
    }

    performAttack() {
        const result = this.player.attack(this.enemies);
        
        if (result) {
            console.log(`⚔️ Атака! Урон: ${result.damage}`);
            
            if (result.killed) {
                console.log(`💀 ${result.enemy.name} убит!`);
                
                // Награды
                this.player.gainXp(result.enemy.xpReward);
                this.player.gold += result.enemy.goldReward;
                console.log(`+${result.enemy.xpReward} XP, +${result.enemy.goldReward} 💰`);
                
                // Лут
                const loot = result.enemy.getLoot();
                loot.forEach(itemId => {
                    this.player.addItem(itemId);
                    console.log(`🎁 Получен предмет: ${CONSTANTS.ITEMS[itemId].name}`);
                });
                
                // Удаляем убитого врага из массива (через 1 секунду для анимации)
                setTimeout(() => {
                    this.enemies = this.enemies.filter(e => e !== result.enemy);
                    
                    // Респавн нового врага через 5 секунд
                    setTimeout(() => {
                        const spawnX = (5 + Math.random() * 20) * CONSTANTS.TILE_SIZE;
                        const spawnY = (5 + Math.random() * 10) * CONSTANTS.TILE_SIZE;
                        this.enemies.push(new Enemy(spawnX, spawnY, 'slime'));
                        console.log('🔄 Новый слайм появился!');
                    }, 5000);
                }, 1000);
                
                this.ui.updateHUD();
            }
        } else {
            console.log('Нет цели в радиусе атаки');
        }
    }

    setupJoystick() {
        const base = document.getElementById('joystick-base');
        const stick = document.getElementById('joystick-stick');
        
        if (!base || !stick) return;

        let baseRect = null;
        let centerX = 0, centerY = 0;
        const maxDistance = 40;

        const startJoystick = (e) => {
            e.preventDefault();
            this.joystickActive = true;
            baseRect = base.getBoundingClientRect();
            centerX = baseRect.left + baseRect.width / 2;
            centerY = baseRect.top + baseRect.height / 2;
            updateJoystick(e);
        };

        const updateJoystick = (e) => {
            if (!this.joystickActive) return;
            e.preventDefault();

            const touch = e.touches ? e.touches[0] : e;
            const deltaX = touch.clientX - centerX;
            const deltaY = touch.clientY - centerY;
            const distance = Math.min(Math.hypot(deltaX, deltaY), maxDistance);
            const angle = Math.atan2(deltaY, deltaX);

            const stickX = Math.cos(angle) * distance;
            const stickY = Math.sin(angle) * distance;

            stick.style.transform = `translate(${stickX}px, ${stickY}px)`;

            this.joystickX = stickX / maxDistance;
            this.joystickY = stickY / maxDistance;
        };

        const endJoystick = (e) => {
            e.preventDefault();
            this.joystickActive = false;
            this.joystickX = 0;
            this.joystickY = 0;
            stick.style.transform = 'translate(0px, 0px)';
        };

        base.addEventListener('touchstart', startJoystick, { passive: false });
        base.addEventListener('touchmove', updateJoystick, { passive: false });
        base.addEventListener('touchend', endJoystick, { passive: false });
        base.addEventListener('touchcancel', endJoystick, { passive: false });

        base.addEventListener('mousedown', startJoystick);
        window.addEventListener('mousemove', (e) => {
            if (this.joystickActive) updateJoystick(e);
        });
        window.addEventListener('mouseup', endJoystick);
    }

    setupMobileMenu() {
        const menuBtns = document.querySelectorAll('.menu-btn');
        menuBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const panelId = btn.getAttribute('data-panel');
                this.ui.toggle(panelId);
            }, { passive: false });

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const panelId = btn.getAttribute('data-panel');
                this.ui.toggle(panelId);
            });
        });
    }

    update(deltaTime) {
        if (this.ui.activePanel) return;

        this.player.update();
        
        // Обновляем всех врагов
        for (const enemy of this.enemies) {
            enemy.update(this.player, this.map);
        }

        let dx = 0, dy = 0;
        
        if (this.keys['w'] || this.keys['ц']) dy -= 1;
        if (this.keys['s'] || this.keys['ы']) dy += 1;
        if (this.keys['a'] || this.keys['ф']) dx -= 1;
        if (this.keys['d'] || this.keys['в']) dx += 1;
        
        if (this.joystickActive && (Math.abs(this.joystickX) > 0.2 || Math.abs(this.joystickY) > 0.2)) {
            dx = this.joystickX;
            dy = this.joystickY;
        }

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

        // Рендерим врагов
        for (const enemy of this.enemies) {
            this.enemyRenderer.render(this.ctx, enemy);
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
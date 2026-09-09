class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.player = new Player(15 * CONSTANTS.TILE_SIZE, 10 * CONSTANTS.TILE_SIZE);
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

        // === НОВОЕ: Всплывающие числа урона ===
        this.damageNumbers = [];

        window.gameInstance = this;
        this.spawnEnemies();
        this.setupInput();
        this.setupJoystick();
        this.ui.updateHUD();
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
        this.enemies.push(new Enemy(5 * CONSTANTS.TILE_SIZE, 5 * CONSTANTS.TILE_SIZE, 'slime'));
        this.enemies.push(new Enemy(20 * CONSTANTS.TILE_SIZE, 8 * CONSTANTS.TILE_SIZE, 'slime'));
        this.enemies.push(new Enemy(15 * CONSTANTS.TILE_SIZE, 15 * CONSTANTS.TILE_SIZE, 'slime'));
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.code === 'Space') { e.preventDefault(); this.performAttack(); }
            if (e.key.toLowerCase() === 'i' || e.key === 'ш') this.ui.toggle('panel-inventory');
            if (e.key.toLowerCase() === 'c' || e.key === 'с') {
                this.ui.toggle('panel-stats');
                this.bindStatButtons();
            }
            if (e.key.toLowerCase() === 'k' || e.key === 'л') this.ui.toggle('panel-skills');
            if (e.key === 'Escape') {
                document.querySelectorAll('.game-panel').forEach(p => p.classList.add('hidden'));
                this.ui.activePanel = null;
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        document.getElementById('btn-inv').onclick = () => this.ui.toggle('panel-inventory');
        document.getElementById('btn-stats').onclick = () => {
            this.ui.toggle('panel-stats');
            this.bindStatButtons();
        };
        document.getElementById('btn-skills').onclick = () => this.ui.toggle('panel-skills');

        const atkBtn = document.getElementById('btn-attack');
        atkBtn.ontouchstart = (e) => { e.preventDefault(); this.performAttack(); };
        atkBtn.onclick = () => this.performAttack();

        document.getElementById('close-inv').onclick = () => this.ui.toggle('panel-inventory');
        document.getElementById('close-stats').onclick = () => this.ui.toggle('panel-stats');
        document.getElementById('close-skills').onclick = () => this.ui.toggle('panel-skills');
    }

    bindStatButtons() {
        document.querySelectorAll('#panel-stats .stat-row button').forEach(btn => {
            btn.onclick = () => {
                const stat = btn.getAttribute('data-stat');
                this.player.allocateStat(stat);
                this.ui.renderStats();
                this.ui.updateHUD();
            };
        });
    }

    // === НОВОЕ: Добавить всплывающее число ===
    addDamageNumber(x, y, value, color) {
        this.damageNumbers.push({
            x: x + CONSTANTS.TILE_SIZE / 2 + (Math.random() - 0.5) * 20,
            y: y,
            value: value,
            color: color || '#fff',
            timer: 0,
            maxTimer: 45 // 0.75 секунды
        });
    }

    performAttack() {
        const result = this.player.attack(this.enemies);
        if (result) {
            // Всплывающий урон по врагу (жёлтый)
            this.addDamageNumber(result.enemy.x, result.enemy.y - 10, result.damage, '#ffe066');

            if (result.killed) {
                this.player.gainXp(result.enemy.xpReward);
                this.player.gold += result.enemy.goldReward;
                const loot = result.enemy.getLoot();
                loot.forEach(itemId => this.player.addItem(itemId));
                setTimeout(() => {
                    this.enemies = this.enemies.filter(e => e !== result.enemy);
                    setTimeout(() => {
                        this.enemies.push(new Enemy(
                            (5 + Math.random() * 20) * CONSTANTS.TILE_SIZE,
                            (5 + Math.random() * 10) * CONSTANTS.TILE_SIZE,
                            'slime'
                        ));
                    }, 3000);
                }, 500);
                this.ui.updateHUD();
            }
        }
    }

    setupJoystick() {
        const base = document.getElementById('joystick-base');
        const stick = document.getElementById('joystick-stick');
        if (!base || !stick) return;

        let centerX = 0, centerY = 0;
        const maxDistance = 40;

        const start = (e) => {
            e.preventDefault();
            this.joystickActive = true;
            const rect = base.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
            update(e);
        };
        const update = (e) => {
            if (!this.joystickActive) return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const deltaX = touch.clientX - centerX;
            const deltaY = touch.clientY - centerY;
            const distance = Math.min(Math.hypot(deltaX, deltaY), maxDistance);
            const angle = Math.atan2(deltaY, deltaX);
            stick.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
            this.joystickX = Math.cos(angle) * distance / maxDistance;
            this.joystickY = Math.sin(angle) * distance / maxDistance;
        };
        const end = (e) => {
            e.preventDefault();
            this.joystickActive = false;
            this.joystickX = 0; this.joystickY = 0;
            stick.style.transform = 'translate(0px, 0px)';
        };

        base.addEventListener('touchstart', start, { passive: false });
        base.addEventListener('touchmove', update, { passive: false });
        base.addEventListener('touchend', end, { passive: false });
        base.addEventListener('mousedown', start);
        window.addEventListener('mousemove', (e) => { if (this.joystickActive) update(e); });
        window.addEventListener('mouseup', end);
    }

    update() {
        if (this.ui.activePanel) return;
        this.player.update();

        // Обновляем врагов и ловим их атаки
        for (const enemy of this.enemies) {
            const attackResult = enemy.update(this.player, this.map);
            if (attackResult) {
                // Всплывающий урон по игроку (красный)
                this.addDamageNumber(attackResult.targetX, attackResult.targetY - 10, attackResult.damage, '#ff4444');
            }
        }

        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['ц']) dy -= 1;
        if (this.keys['s'] || this.keys['ы']) dy += 1;
        if (this.keys['a'] || this.keys['ф']) dx -= 1;
        if (this.keys['d'] || this.keys['в']) dx += 1;
        if (this.joystickActive) { dx = this.joystickX; dy = this.joystickY; }

        if (dx !== 0 || dy !== 0) this.player.move(dx, dy, this.map);
        else this.player.isMoving = false;

        // === НОВОЕ: Обновление всплывающих чисел ===
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            this.damageNumbers[i].timer++;
            this.damageNumbers[i].y -= 1.2; // Летит вверх
            if (this.damageNumbers[i].timer >= this.damageNumbers[i].maxTimer) {
                this.damageNumbers.splice(i, 1);
            }
        }

        this.ui.updateHUD();
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
            for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
                this.ctx.fillStyle = this.map[y][x] === 1 ? CONSTANTS.COLORS.WALL : CONSTANTS.COLORS.GRASS;
                this.ctx.fillRect(x * CONSTANTS.TILE_SIZE, y * CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
            }
        }

        for (const enemy of this.enemies) this.enemyRenderer.render(this.ctx, enemy);
        this.playerRenderer.render(this.ctx, this.player);

        // === НОВОЕ: Отрисовка всплывающих чисел ===
        this.renderDamageNumbers();
    }

    // === НОВОЕ: Рендер всплывающих чисел ===
    renderDamageNumbers() {
        for (const num of this.damageNumbers) {
            const t = num.timer / num.maxTimer;
            const alpha = 1 - t; // Угасает
            const scale = 1 + t * 0.5; // Увеличивается

            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.font = `bold ${Math.floor(18 * scale)}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Обводка для читаемости
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(`-${num.value}`, num.x, num.y);

            // Сам текст
            this.ctx.fillStyle = num.color;
            this.ctx.fillText(`-${num.value}`, num.x, num.y);

            this.ctx.restore();
        }
    }

    loop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.loop());
    }

    start() {
        requestAnimationFrame(() => this.loop());
    }
}
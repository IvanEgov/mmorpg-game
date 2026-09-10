class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        const savedData = localStorage.getItem('dungeonChronicles_save');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.player = new Player(data.player.x, data.player.y);
            this.player.loadFromJSON(data.player);
            this.currentLocationId = data.currentLocationId || 'city';
        } else {
            this.player = new Player(15 * CONSTANTS.TILE_SIZE, 10 * CONSTANTS.TILE_SIZE);
            this.currentLocationId = 'city';
        }

        this.playerRenderer = new PlayerRenderer();
        this.enemyRenderer = new EnemyRenderer();
        this.otherPlayerRenderer = new OtherPlayerRenderer(); // НОВОЕ
        this.ui = new UIManager(this.player);
        this.network = new NetworkManager(this); // НОВОЕ

        this.keys = {};
        this.joystickActive = false;
        this.joystickX = 0;
        this.joystickY = 0;
        this.lastTime = 0;
        this.damageNumbers = [];

        this.locations = { 'city': new CityLocation() };
        this.currentLocation = this.locations[this.currentLocationId] || this.locations['city'];

        // НОВОЕ: Объект других игроков
        this.otherPlayers = {};

        window.gameInstance = this;
        this.setupInput();
        this.setupJoystick();
        this.ui.updateHUD();
    }

    // НОВОЕ: Обновление других игроков из сети
       syncOtherPlayers() {
        if (!this.network.connected) return;

        // 1. Удаляем игроков, которых больше нет в сети или они не в этой локации
        for (const id in this.otherPlayers) {
            const netData = this.network.otherPlayers[id];
            if (!netData || netData.locationId !== this.currentLocationId) {
                delete this.otherPlayers[id];
            }
        }

        // 2. Добавляем/обновляем игроков в текущей локации
        for (const [id, data] of Object.entries(this.network.otherPlayers)) {
            // 🆕 ДИАГНОСТИКА: проверяем совпадение локаций
            console.log(`🔍 Проверка: Игрок ${data.name} находится в "${data.locationId}", а я в "${this.currentLocationId}"`);
            
            if (data.locationId !== this.currentLocationId) {
                console.log(`⏩ Игрок ${data.name} в другой локации, не рисуем его.`);
                continue;
            }
            
            if (this.otherPlayers[id]) {
                this.otherPlayers[id].updateFromNetwork(data);
            } else {
                console.log(`✅ ДОБАВЛЕН НОВЫЙ ИГРОК для рендера: ${data.name} на координатах X:${data.x} Y:${data.y}`);
                this.otherPlayers[id] = new OtherPlayer(id, data);
            }
        }
        
        // 🆕 ДИАГНОСТИКА: кого мы в итоге решили рисовать
        console.log('🎨 Игроки, готовые к отрисовке:', Object.keys(this.otherPlayers));
    }

    // === НОВОЕ: Сохранение игры ===
    saveGame() {
        const data = {
            player: this.player.saveToJSON(),
            currentLocationId: this.currentLocationId
        };
        localStorage.setItem('dungeonChronicles_save', JSON.stringify(data));
        console.log('💾 Игра сохранена!');
    }

    // === НОВОЕ: Загрузка игры ===
    loadGame() {
        const savedData = localStorage.getItem('dungeonChronicles_save');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.player.loadFromJSON(data.player);
            this.changeLocation(data.currentLocationId || 'city');
            this.ui.updateHUD();
            console.log('📂 Игра загружена!');
            return true;
        }
        return false;
    }

    changeLocation(locationId) {
        console.log(`🌀 Переход в: ${locationId}`);

        if (locationId.startsWith('dungeon_')) {
            this.locations[locationId] = new DungeonLocation(locationId);
        } else if (locationId === 'city' && !this.locations['city']) {
            this.locations['city'] = new CityLocation();
        }

        this.currentLocationId = locationId;
        this.currentLocation = this.locations[locationId];

        if (locationId === 'city') {
            this.player.x = 15 * CONSTANTS.TILE_SIZE;
            this.player.y = 10 * CONSTANTS.TILE_SIZE;
        } else {
            this.player.x = 3 * CONSTANTS.TILE_SIZE;
            this.player.y = 3 * CONSTANTS.TILE_SIZE;
        }

        document.getElementById('location-name').textContent = this.currentLocation.name;

        // === НОВОЕ: Сохраняем при переходе ===
        this.saveGame();
    }

    performAttack() {
        const enemies = this.currentLocation.entities.filter(e => e instanceof Enemy);
        const result = this.player.attack(enemies);
        if (result) {
            this.addDamageNumber(result.enemy.x, result.enemy.y - 10, result.damage, '#ffe066');

            if (result.killed) {
                this.player.gainXp(result.enemy.xpReward);
                this.player.gold += result.enemy.goldReward;
                const loot = result.enemy.getLoot();
                loot.forEach(itemId => {
                    this.player.addItem(itemId);
                    if (this.player.activeQuests) {
                        this.player.activeQuests.forEach(q => {
                            const questData = CONSTANTS.QUESTS[q.id];
                            if (questData.target === result.enemy.type) {
                                q.progress = (q.progress || 0) + 1;
                            } else if (questData.target === itemId) {
                                q.progress = (q.progress || 0) + 1;
                            }
                        });
                    }
                });
                setTimeout(() => {
                    this.currentLocation.entities = this.currentLocation.entities.filter(e => e !== result.enemy);
                }, 500);
                this.ui.updateHUD();

                // === НОВОЕ: Сохраняем после убийства ===
                this.saveGame();
            }
        }
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.code === 'Space') { e.preventDefault(); this.performAttack(); }
            if (e.key.toLowerCase() === 'e' || e.key === 'у') this.interact();
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

        // Кнопка взаимодействия
        const interactBtn = document.getElementById('btn-interact');
        interactBtn.ontouchstart = (e) => { e.preventDefault(); this.interact(); };
        interactBtn.onclick = () => this.interact();

        document.getElementById('close-inv').onclick = () => this.ui.toggle('panel-inventory');
        document.getElementById('close-stats').onclick = () => this.ui.toggle('panel-stats');
        document.getElementById('close-skills').onclick = () => this.ui.toggle('panel-skills');
        document.getElementById('close-npc').onclick = () => this.ui.closePanel('panel-npc');
        document.getElementById('close-shop').onclick = () => this.ui.closePanel('panel-shop');
        document.getElementById('close-quests').onclick = () => this.ui.closePanel('panel-quests');
        document.getElementById('close-storage').onclick = () => this.ui.closePanel('panel-storage');
        document.getElementById('close-deposit').onclick = () => this.ui.closePanel('panel-deposit');
    }

    interact() {
        this.player.tryInteract(this.currentLocation, this);
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

    addDamageNumber(x, y, value, color) {
        this.damageNumbers.push({
            x: x + CONSTANTS.TILE_SIZE / 2 + (Math.random() - 0.5) * 20,
            y: y,
            value: value,
            color: color || '#fff',
            timer: 0,
            maxTimer: 45
        });
    }

    performAttack() {
        const enemies = this.currentLocation.entities.filter(e => e instanceof Enemy);
        const result = this.player.attack(enemies);
        if (result) {
            this.addDamageNumber(result.enemy.x, result.enemy.y - 10, result.damage, '#ffe066');

            if (result.killed) {
                this.player.gainXp(result.enemy.xpReward);
                this.player.gold += result.enemy.goldReward;
                const loot = result.enemy.getLoot();
                loot.forEach(itemId => {
                    this.player.addItem(itemId);
                    // Обновляем прогресс квестов
                    if (this.player.activeQuests) {
                        this.player.activeQuests.forEach(q => {
                            const questData = CONSTANTS.QUESTS[q.id];
                            if (questData.target === result.enemy.type) {
                                q.progress = (q.progress || 0) + 1;
                            } else if (questData.target === itemId) {
                                q.progress = (q.progress || 0) + 1;
                            }
                        });
                    }
                });
                setTimeout(() => {
                    this.currentLocation.entities = this.currentLocation.entities.filter(e => e !== result.enemy);
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

        // НОВОЕ: Отправляем свою позицию в сеть
        this.network.updatePosition(this.player);

        // НОВОЕ: Синхронизируем других игроков
        this.syncOtherPlayers();
        for (const other of Object.values(this.otherPlayers)) {
            other.update();
        }

        this.currentLocation.update(this.player);

        for (const entity of this.currentLocation.entities) {
            if (entity instanceof Enemy) {
                const attackResult = entity.update(this.player, this.currentLocation);
                if (attackResult) {
                    this.addDamageNumber(attackResult.targetX, attackResult.targetY - 10, attackResult.damage, '#ff4444');
                }
            }
        }

        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['ц']) dy -= 1;
        if (this.keys['s'] || this.keys['ы']) dy += 1;
        if (this.keys['a'] || this.keys['ф']) dx -= 1;
        if (this.keys['d'] || this.keys['в']) dx += 1;
        if (this.joystickActive) { dx = this.joystickX; dy = this.joystickY; }

        if (dx !== 0 || dy !== 0) {
            this.player.move(dx, dy, this.currentLocation.map);
        } else {
            this.player.isMoving = false;
        }

        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            this.damageNumbers[i].timer++;
            this.damageNumbers[i].y -= 1.2;
            if (this.damageNumbers[i].timer >= this.damageNumbers[i].maxTimer) {
                this.damageNumbers.splice(i, 1);
            }
        }

        this.ui.updateHUD();
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.currentLocation.render(this.ctx);

        for (const entity of this.currentLocation.entities) {
            if (entity instanceof Enemy) {
                this.enemyRenderer.render(this.ctx, entity);
            }
        }

        // НОВОЕ: Рендер других игроков
        for (const other of Object.values(this.otherPlayers)) {
            this.otherPlayerRenderer.render(this.ctx, other);
        }

        this.playerRenderer.render(this.ctx, this.player);
        this.renderDamageNumbers();
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Рендер карты
        this.currentLocation.render(this.ctx);

        // 2. Рендер врагов
        for (const entity of this.currentLocation.entities) {
            if (entity instanceof Enemy) {
                this.enemyRenderer.render(this.ctx, entity);
            }
        }

        // 3. Рендер ДРУГИХ игроков
        const others = Object.values(this.otherPlayers);
        if (others.length > 0) {
            console.log(`🎨 Начинаю отрисовку ${others.length} других игроков...`);
        }
        for (const other of others) {
            this.otherPlayerRenderer.render(this.ctx, other);
        }

        // 4. Рендер ТВОЕГО персонажа
        this.playerRenderer.render(this.ctx, this.player);

        // 5. Всплывающие числа
        this.renderDamageNumbers();
    }

    renderDamageNumbers() {
        for (const num of this.damageNumbers) {
            const t = num.timer / num.maxTimer;
            const alpha = 1 - t;
            const scale = 1 + t * 0.5;

            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.font = `bold ${Math.floor(18 * scale)}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(`-${num.value}`, num.x, num.y);

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
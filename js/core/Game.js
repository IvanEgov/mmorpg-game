class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Загрузка сохранения или создание нового игрока
        const savedData = localStorage.getItem('dungeonChronicles_save');
        if (savedData) {
            console.log('📂 Загрузка сохранения...');
            const data = JSON.parse(savedData);
            this.player = new Player(data.player.x, data.player.y);
            this.player.loadFromJSON(data.player);
            this.currentLocationId = data.currentLocationId || 'city';
        } else {
            console.log('🆕 Новая игра');
            this.player = new Player(15 * CONSTANTS.TILE_SIZE, 10 * CONSTANTS.TILE_SIZE);
            this.currentLocationId = 'city';
        }

        this.playerRenderer = new PlayerRenderer();
        this.enemyRenderer = new EnemyRenderer();
        this.otherPlayerRenderer = new OtherPlayerRenderer();
        this.ui = new UIManager(this.player);
        this.network = new NetworkManager(this);

        // Камера (следует за игроком)
        this.camera = new Camera(this.canvas.width, this.canvas.height);

        // Волновой менеджер (для арены выживания)
        this.waveManager = new WaveManager(null);

        this.keys = {};
        this.joystickActive = false;
        this.joystickX = 0;
        this.joystickY = 0;
        this.lastTime = 0;
        this.damageNumbers = [];
        this.isPaused = false;

        this.locations = { 'city': new CityLocation() };
        this.currentLocation = this.locations[this.currentLocationId] || this.locations['city'];
        this.otherPlayers = {};

        window.gameInstance = this;
        this.setupInput();
        this.setupJoystick();
        this.ui.updateHUD();

        // Если вошли сразу на арену — запускаем волны
        if (this.currentLocationId === 'arena_survival') {
            this.startArena();
        }

        console.log('✅ Игра загружена! Локация:', this.currentLocation.name);
    }
    // Обёртка для UIManager
    updateHUD() {
        this.ui.updateHUD();
    }
    // ============ СОХРАНЕНИЕ / ЗАГРУЗКА ============
    saveGame() {
        const data = {
            player: this.player.saveToJSON(),
            currentLocationId: this.currentLocationId
        };
        localStorage.setItem('dungeonChronicles_save', JSON.stringify(data));
    }

    loadGame() {
        const savedData = localStorage.getItem('dungeonChronicles_save');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.player.loadFromJSON(data.player);
            this.changeLocation(data.currentLocationId || 'city');
            this.ui.updateHUD();
            return true;
        }
        return false;
    }

    // ============ СМЕНА ЛОКАЦИИ ============
    changeLocation(locationId) {
        console.log(`🌀 Переход в: ${locationId}`);

        if (this.currentLocationId === 'arena_survival' && locationId !== 'arena_survival') {
            this.waveManager.stop();
        }

        // 🆕 Очищаем старые данные убийств при выходе из локации
        if (this.currentLocationId && this.currentLocationId !== locationId) {
            this.network.cleanupKilledEnemies(this.currentLocationId);
        }

        if (locationId.startsWith('dungeon_') || locationId === 'arena_survival') {
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
            this.player.x = this.currentLocation.spawnX || 3 * CONSTANTS.TILE_SIZE;
            this.player.y = this.currentLocation.spawnY || 3 * CONSTANTS.TILE_SIZE;
        }

        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        document.getElementById('location-name').textContent = this.currentLocation.name;

        // 🆕 Загружаем список убитых мобов из Firebase
        if (locationId !== 'city') {
            this.network.getKilledEnemies(locationId, (killedIds) => {
                this.removeKilledEnemies(killedIds);
            });
        }

        if (locationId === 'arena_survival') {
            this.startArena();
        }

        this.saveGame();
    }

    // 🆕 Удалить убитых мобов из текущей локации
    removeKilledEnemies(killedIds) {
        if (!killedIds || killedIds.length === 0) return;

        this.currentLocation.entities = this.currentLocation.entities.filter(entity => {
            if (entity instanceof Enemy) {
                if (killedIds.includes(entity.uniqueId)) {
                    return false; // Убираем убитого моба
                }
            }
            return true;
        });

        console.log(`🗑️ Удалено ${killedIds.length} убитых мобов из локации`);
    }

    // ============ АРЕНА ВЫЖИВАНИЯ ============
    startArena() {
        console.log('💀 Арена выживания запущена!');
        this.waveManager = new WaveManager(this.currentLocation);
        this.waveManager.start(this.player.level);
    }

    // ============ СМЕРТЬ И ВОЗРОЖДЕНИЕ ============
    handlePlayerDeath() {
        console.log('💀 Игрок погиб!');
        this.waveManager.stop();

        // Показываем экран смерти
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            deathScreen.classList.remove('hidden');
            const waveEl = document.getElementById('death-wave');
            const levelEl = document.getElementById('death-level');
            if (waveEl) waveEl.textContent = this.waveManager.wave;
            if (levelEl) levelEl.textContent = this.player.level;
        }

        this.isPaused = true;
    }

    respawn() {
        console.log('✨ Возрождение в городе');
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) deathScreen.classList.add('hidden');

        // Восстанавливаем HP/MP
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;

        // Штраф: теряем 20% золота
        const goldLoss = Math.floor(this.player.gold * 0.2);
        this.player.gold = Math.max(0, this.player.gold - goldLoss);
        console.log(`💸 Потеряно золота: ${goldLoss}`);

        // Телепортируем в город
        this.changeLocation('city');
        this.isPaused = false;
        this.saveGame();
    }

    // ============ ВВОД ============
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

        // Кнопки меню
        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) {
                el.onclick = fn;
                el.ontouchstart = (e) => { e.preventDefault(); fn(); };
            }
        };

        bind('btn-inv', () => this.ui.toggle('panel-inventory'));
        bind('btn-stats', () => {
            this.ui.toggle('panel-stats');
            this.bindStatButtons();
        });
        bind('btn-skills', () => this.ui.toggle('panel-skills'));
        bind('btn-attack', () => this.performAttack());
        bind('btn-interact', () => this.interact());

        bind('close-inv', () => this.ui.toggle('panel-inventory'));
        bind('close-stats', () => this.ui.toggle('panel-stats'));
        bind('close-skills', () => this.ui.toggle('panel-skills'));
        bind('close-npc', () => this.ui.closePanel('panel-npc'));
        bind('close-shop', () => this.ui.closePanel('panel-shop'));
        bind('close-quests', () => this.ui.closePanel('panel-quests'));
        bind('close-storage', () => this.ui.closePanel('panel-storage'));
        bind('close-deposit', () => this.ui.closePanel('panel-deposit'));
    }

    bindStatButtons() {
        document.querySelectorAll('#panel-stats .stat-row button').forEach(btn => {
            btn.onclick = () => {
                const stat = btn.getAttribute('data-stat');
                this.player.allocateStat(stat);
                this.ui.renderStats();
                this.ui.updateHUD();
                this.saveGame();
            };
        });
    }

    interact() {
        this.player.tryInteract(this.currentLocation, this);
    }

    // ============ ДЖОЙСТИК ============
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
            this.joystickX = 0;
            this.joystickY = 0;
            stick.style.transform = 'translate(0px, 0px)';
        };

        base.addEventListener('touchstart', start, { passive: false });
        base.addEventListener('touchmove', update, { passive: false });
        base.addEventListener('touchend', end, { passive: false });
        base.addEventListener('touchcancel', end, { passive: false });
        base.addEventListener('mousedown', start);
        window.addEventListener('mousemove', (e) => { if (this.joystickActive) update(e); });
        window.addEventListener('mouseup', end);
    }

    // ============ АТАКА ============
    performAttack() {
        const enemies = this.currentLocation.entities.filter(e => e instanceof Enemy);
        const result = this.player.attack(enemies);
        if (result) {
            this.addDamageNumber(result.enemy.x, result.enemy.y - 10, result.damage, '#ffe066');
            if (result.killed) {
                this.player.gainXp(result.enemy.xpReward);
                this.player.gold += result.enemy.goldReward;

                // 🆕 Синхронизируем убийство с другими игроками
                this.network.reportEnemyKilled(result.enemy.uniqueId, this.currentLocationId);

                const loot = result.enemy.getLoot();
            // ... остальной код без изменений ...
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
                this.saveGame();
            }
        }
    }

    // ============ ВСПЛЫВАЮЩИЕ ЧИСЛА ============
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

    // ============ СЕТЬ ============
    syncOtherPlayers() {
        if (!this.network.connected) return;

        // Удаляем игроков, которых больше нет в сети или они не в этой локации
        for (const id in this.otherPlayers) {
            const netData = this.network.otherPlayers[id];
            if (!netData || netData.locationId !== this.currentLocationId) {
                delete this.otherPlayers[id];
            }
        }

        // Добавляем/обновляем игроков в текущей локации
        for (const [id, data] of Object.entries(this.network.otherPlayers)) {
            if (data.locationId !== this.currentLocationId) continue;

            if (this.otherPlayers[id]) {
                this.otherPlayers[id].updateFromNetwork(data);
            } else {
                this.otherPlayers[id] = new OtherPlayer(id, data);
            }
        }
    }

    // ============ ОБНОВЛЕНИЕ ============
    update(deltaTime) {
        if (this.ui.activePanel || this.isPaused) return;

        this.player.update();
        this.network.updatePosition(this.player);
        this.syncOtherPlayers();
        for (const other of Object.values(this.otherPlayers)) other.update();

        // Обновляем волны на арене
        if (this.currentLocationId === 'arena_survival' && this.waveManager.active) {
            this.waveManager.update(deltaTime, this.player);
        }

        this.currentLocation.update(this.player);

        // Обновляем врагов и ловим их атаки
        for (const entity of this.currentLocation.entities) {
            if (entity instanceof Enemy) {
                const attackResult = entity.update(this.player, this.currentLocation);
                if (attackResult) {
                    this.addDamageNumber(attackResult.targetX, attackResult.targetY - 10, attackResult.damage, '#ff4444');
                }
            }
        }

        // Движение игрока
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

        // Камера следует за игроком
        this.camera.follow(
            this.player.x + CONSTANTS.TILE_SIZE / 2,
            this.player.y + CONSTANTS.TILE_SIZE / 2
        );
        const mapW = (this.currentLocation.mapWidth || CONSTANTS.MAP_WIDTH) * CONSTANTS.TILE_SIZE;
        const mapH = (this.currentLocation.mapHeight || CONSTANTS.MAP_HEIGHT) * CONSTANTS.TILE_SIZE;
        this.camera.clamp(mapW, mapH);

        // Обновление всплывающих чисел
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            this.damageNumbers[i].timer++;
            this.damageNumbers[i].y -= 1.2;
            if (this.damageNumbers[i].timer >= this.damageNumbers[i].maxTimer) {
                this.damageNumbers.splice(i, 1);
            }
        }

        // Проверка смерти
        if (this.player.hp <= 0 && !this.isPaused) {
            this.handlePlayerDeath();
        }

        this.ui.updateHUD();
    }

    // ============ ОТРИСОВКА ============
    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Применяем камеру
        this.camera.apply(this.ctx);

        // Карта
        this.currentLocation.render(this.ctx);

        // Враги
        for (const entity of this.currentLocation.entities) {
            if (entity instanceof Enemy) {
                if (entity instanceof ArenaBat) {
                    entity.render(this.ctx);
                } else {
                    this.enemyRenderer.render(this.ctx, entity);
                }
            }
        }

        // Другие игроки
        for (const other of Object.values(this.otherPlayers)) {
            this.otherPlayerRenderer.render(this.ctx, other);
        }

        // Твой персонаж
        this.playerRenderer.render(this.ctx, this.player);

        // Всплывающие числа урона
        this.renderDamageNumbers();

        // Восстанавливаем контекст после камеры
        this.camera.restore(this.ctx);

        // HUD арены (рисуется поверх всего)
        if (this.currentLocationId === 'arena_survival' && this.waveManager.active) {
            this.renderArenaHUD();
        }
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

    renderArenaHUD() {
        const ctx = this.ctx;
        ctx.save();

        // Фон
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 280, 80);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 280, 80);

        // Текст
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`💀 ВОЛНА: ${this.waveManager.wave}`, 20, 20);

        const levelTier = Math.floor(this.player.level / CONSTANTS.ARENA.LEVEL_SCALE_INTERVAL);
        const powerMultiplier = Math.pow(CONSTANTS.ARENA.LEVEL_SCALE_POWER, levelTier);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Множитель силы: x${powerMultiplier.toFixed(2)}`, 20, 45);

        // Прогресс до следующей волны
        const progress = this.waveManager.waveTimer / CONSTANTS.ARENA.WAVE_INTERVAL;
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 70, 260, 10);
        ctx.fillStyle = '#e94560';
        ctx.fillRect(20, 70, 260 * progress, 10);

        ctx.restore();
    }

    // ============ ИГРОВОЙ ЦИКЛ ============
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
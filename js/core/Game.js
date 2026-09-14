class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // СНАЧАЛА инициализируем все свойства
        this.locations = {};
        this.player = null;
        this.currentLocationId = 'city';
        this.currentLocation = null;
        this.otherPlayers = {};
        this.keys = {};
        this.joystickActive = false;
        this.joystickX = 0;
        this.joystickY = 0;
        this.lastTime = 0;
        this.damageNumbers = [];
        this.isPaused = false;

        // Создаём город первым
        this.locations['city'] = new CityLocation();

        // Загрузка сохранения
        const savedData = localStorage.getItem('dungeonChronicles_save');
        if (savedData) {
            try {
                console.log('📂 Загрузка сохранения...');
                const data = JSON.parse(savedData);
                this.player = new Player(15 * CONSTANTS.TILE_SIZE, 10 * CONSTANTS.TILE_SIZE);
                this.player.loadFromJSON(data.player);
                this.currentLocationId = data.currentLocationId || 'city';

                // Восстанавливаем локацию если не город
                if (this.currentLocationId !== 'city') {
                    console.log('🔄 Восстанавливаем локацию: ' + this.currentLocationId);
                    this.createLocation(this.currentLocationId);

                    // Проверяем координаты
                    const loc = this.locations[this.currentLocationId];
                    if (loc) {
                        const mapW = (loc.mapWidth || CONSTANTS.MAP_WIDTH) * CONSTANTS.TILE_SIZE;
                        const mapH = (loc.mapHeight || CONSTANTS.MAP_HEIGHT) * CONSTANTS.TILE_SIZE;
                        if (this.player.x >= mapW || this.player.y >= mapH || this.player.x < 0 || this.player.y < 0) {
                            console.log('⚠️ Координаты вне карты, исправляем');
                            this.player.x = 3 * CONSTANTS.TILE_SIZE;
                            this.player.y = 3 * CONSTANTS.TILE_SIZE;
                        }
                    } else {
                        console.log('⚠️ Локация не найдена, возвращаем в город');
                        this.currentLocationId = 'city';
                    }
                }
            } catch (e) {
                console.error('❌ Ошибка загрузки сохранения:', e);
                this.player = new Player(15 * CONSTANTS.TILE_SIZE, 10 * CONSTANTS.TILE_SIZE);
                this.currentLocationId = 'city';
            }
        } else {
            console.log('🆕 Новая игра');
            this.player = new Player(15 * CONSTANTS.TILE_SIZE, 10 * CONSTANTS.TILE_SIZE);
        }

        // Устанавливаем текущую локацию
        this.currentLocation = this.locations[this.currentLocationId] || this.locations['city'];

        // Инициализация рендереров и систем
        this.playerRenderer = new PlayerRenderer();
        this.enemyRenderer = new EnemyRenderer();
        this.otherPlayerRenderer = new OtherPlayerRenderer();
        this.ui = new UIManager(this.player);
        this.network = new NetworkManager(this);
        this.camera = new Camera(this.canvas.width, this.canvas.height);
        this.waveManager = new WaveManager(null);

        window.gameInstance = this;
        this.setupInput();
        this.setupJoystick();
        this.ui.updateHUD();

        if (this.currentLocationId === 'arena_survival') {
            this.startArena();
        }

        console.log('✅ Игра загружена! Локация:', this.currentLocation.name);
    }

    // Создание локации по ID
    createLocation(locationId) {
        if (this.locations[locationId]) return;

        if (locationId === 'epoch_dungeon') {
            this.locations[locationId] = new AncientRuinsLocation();
        } else if (locationId === 'arena_survival') {
            this.locations[locationId] = new DungeonLocation('arena_survival');
        } else if (locationId === 'castle') {
            this.locations[locationId] = new CastleLocation();
        } else if (locationId.startsWith('dungeon_')) {
            this.locations[locationId] = new DungeonLocation(locationId);
        }
    }

    updateHUD() {
        this.ui.updateHUD();
    }

    saveGame() {
        const data = {
            player: this.player.saveToJSON(),
            currentLocationId: this.currentLocationId
        };
        localStorage.setItem('dungeonChronicles_save', JSON.stringify(data));
    }

    changeLocation(locationId) {
        console.log('🌀 Переход в: ' + locationId);

        if (this.currentLocationId === 'arena_survival' && locationId !== 'arena_survival') {
            this.waveManager.stop();
        }
        // 🆕 НЕ удаляем данные об убитых мобах и сундуках при выходе
        // Они должны сохраняться, чтобы другие игроки видели обновления
      //  if (this.currentLocationId && this.currentLocationId !== locationId) {
       //     this.network.cleanupKilledEnemies(this.currentLocationId);
       //     this.network.cleanupOpenedChests(this.currentLocationId);
       // }

        if (locationId !== 'city') {
            delete this.locations[locationId];
            this.createLocation(locationId);
        }

        this.currentLocationId = locationId;
        this.currentLocation = this.locations[locationId] || this.locations['city'];

        if (locationId === 'city') {
            this.player.x = 15 * CONSTANTS.TILE_SIZE;
            this.player.y = 10 * CONSTANTS.TILE_SIZE;
        } else {
            this.player.x = 3 * CONSTANTS.TILE_SIZE;
            this.player.y = 3 * CONSTANTS.TILE_SIZE;
        }

        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        document.getElementById('location-name').textContent = this.currentLocation.name;

        // 🆕 Загружаем данные синхронизации для всех локаций кроме города
        if (locationId !== 'city') {
            // Загружаем убитых мобов
            this.network.getKilledEnemies(locationId, (killedIds) => {
                this.removeKilledEnemies(killedIds);
            });

            // Загружаем открытые сундуки
            this.network.getOpenedChests(locationId, (openedIds) => {
                this.markOpenedChests(openedIds);
            });

            // 🆕 Подписываемся на обновления в реальном времени
            this.network.subscribeToLocationUpdates(locationId, (updates) => {
                this.applyLocationUpdates(updates);
            });
        }

        if (locationId === 'arena_survival') {
            this.startArena();
        }

        this.saveGame();
    }

    
    // 🆕 Применяем обновления из Firebase
    applyLocationUpdates(updates) {
        if (!updates) return;

        console.log('🔄 Применяем обновление: ' + updates.type);

        if (updates.type === 'killedEnemies') {
            this.removeKilledEnemies(updates.ids);
        } else if (updates.type === 'openedChests') {
            this.markOpenedChests(updates.ids);
        }
    }

    startArena() {
        console.log('💀 Арена выживания запущена!');
        this.waveManager = new WaveManager(this.currentLocation);
        this.waveManager.start(this.player.level);

        // 🆕 Подписываемся на обновления волн
        if (this.network.connected) {
            this.network.subscribeToArenaWaves(this.currentLocationId, (waveData) => {
                this.syncArenaWaves(waveData);
            });
        }
    }

    // 🆕 Синхронизация волн арены
    syncArenaWaves(waveData) {
        if (!waveData) return;

        console.log('🔄 Синхронизация волн арены:', waveData);

        // Если пришла новая волна от другого игрока
        if (waveData.currentWave && waveData.currentWave > this.waveManager.wave) {
            console.log('🌊 Получена волна ' + waveData.currentWave + ' от другого игрока');
            // Синхронизируем номер волны
            this.waveManager.wave = waveData.currentWave - 1;
            this.waveManager.spawnWave();
        }

        // Синхронизируем убитых мобов
        if (waveData.killedMobs) {
            this.removeKilledEnemies(waveData.killedMobs);
        }
    }

    handlePlayerDeath() {
        console.log('💀 Игрок погиб!');
        this.waveManager.stop();

        if (this.player.currentEpoch) {
            console.log('❌ Воплощение ' + this.player.currentEpoch + ' завершено с провалом');
            this.player.currentEpoch = null;
        }

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

        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;

        const goldLoss = Math.floor(this.player.gold * 0.2);
        this.player.gold = Math.max(0, this.player.gold - goldLoss);

        this.changeLocation('city');
        this.isPaused = false;
        this.saveGame();
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

        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) {
                el.onclick = fn;
                el.ontouchstart = (e) => { e.preventDefault(); fn(); };
            }
        };

        bind('btn-inv', () => this.ui.toggle('panel-inventory'));
        bind('btn-stats', () => { this.ui.toggle('panel-stats'); this.bindStatButtons(); });
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

        const respawnBtn = document.getElementById('respawn-btn');
        if (respawnBtn) {
            respawnBtn.onclick = () => this.respawn();
        }
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
            stick.style.transform = 'translate(' + (Math.cos(angle) * distance) + 'px, ' + (Math.sin(angle) * distance) + 'px)';
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

    performAttack() {
        const enemies = this.currentLocation.entities.filter(e => e instanceof Enemy);
        const result = this.player.attack(enemies);
        if (result) {
            this.addDamageNumber(result.enemy.x, result.enemy.y - 10, result.damage, '#ffe066');

            if (result.killed) {
                this.player.gainXp(result.enemy.xpReward);
                this.player.gold += result.enemy.goldReward;

                // 🆕 Синхронизируем убийство (включая босса)
                const enemyId = result.enemy.uniqueId;
                console.log('💀 Убит: ' + enemyId);
                this.network.reportEnemyKilled(enemyId, this.currentLocationId);

                // 🆕 Если убит босс — обрабатываем отдельно
                if (result.enemy instanceof Boss) {
                    this.handleBossDefeat(result.enemy);
                }

                const loot = result.enemy.getLoot();
                loot.forEach(itemId => {
                    this.player.addItem(itemId);
                    if (this.player.activeQuests) {
                        this.player.activeQuests.forEach(q => {
                            const questData = CONSTANTS.QUESTS[q.id];
                            if (questData.target === result.enemy.type) q.progress = (q.progress || 0) + 1;
                            else if (questData.target === itemId) q.progress = (q.progress || 0) + 1;
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
    handleBossDefeat(boss) {
        console.log('🏆 Босс ' + boss.name + ' повержен!');

        // 🆕 ИСПРАВЛЕНО: используем полный ID локации
        const currentEpochId = this.currentLocationId; // 'epoch_dungeon'
        if (this.player.completeEpoch) {
            this.player.completeEpoch(currentEpochId);
        }

        this.showBossDefeatMessage(boss);

        // 🆕 ИСПРАВЛЕНО: создаём портал именно в arena_survival
        const portalX = boss.x;
        const portalY = boss.y;
        const nextLocation = boss.unlocksEpoch === 'blood_arena' ? 'arena_survival' : 'epoch_' + boss.unlocksEpoch;

        const newPortal = new Portal(
            portalX, portalY,
            nextLocation,
            '✨ Портал: ' + (nextLocation === 'arena_survival' ? 'Арена выживания' : nextLocation)
        );
        this.currentLocation.entities.push(newPortal);

        this.saveGame();
    }

    showBossDefeatMessage(boss) {
        const msg = document.createElement('div');
        msg.style.cssText = `
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a0000, #3a0000);
            border: 3px solid #f1c40f;
            padding: 30px; border-radius: 12px;
            color: #fff; text-align: center;
            z-index: 9999; font-size: 18px;
            box-shadow: 0 0 50px rgba(241, 196, 15, 0.5);
            animation: fadeIn 0.5s;
        `;
        msg.innerHTML = `
            <h1 style="color: #f1c40f; margin-bottom: 15px;">🏆 ПОБЕДА!</h1>
            <p style="margin-bottom: 10px;">Босс <b>${boss.name}</b> повержен!</p>
            <p style="color: #2ecc71;">✨ Разблокирована новая эпоха!</p>
            <p style="color: #aaa; font-size: 14px; margin-top: 15px;">
                Портал появился на месте босса
            </p>
        `;
        document.body.appendChild(msg);

        setTimeout(() => {
            msg.style.transition = 'opacity 0.5s';
            msg.style.opacity = '0';
            setTimeout(() => msg.remove(), 500);
        }, 3000);
    }
    addDamageNumber(x, y, value, color) {
        this.damageNumbers.push({
            x: x + CONSTANTS.TILE_SIZE / 2 + (Math.random() - 0.5) * 20,
            y: y, value: value, color: color || '#fff',
            timer: 0, maxTimer: 45
        });
    }

    syncOtherPlayers() {
        if (!this.network.connected) return;
        for (const id in this.otherPlayers) {
            const netData = this.network.otherPlayers[id];
            if (!netData || netData.locationId !== this.currentLocationId) delete this.otherPlayers[id];
        }
        for (const [id, data] of Object.entries(this.network.otherPlayers)) {
            if (data.locationId !== this.currentLocationId) continue;
            if (this.otherPlayers[id]) this.otherPlayers[id].updateFromNetwork(data);
            else this.otherPlayers[id] = new OtherPlayer(id, data);
        }
    }

    removeKilledEnemies(killedIds) {
        if (!killedIds || killedIds.length === 0) return;

        const beforeCount = this.currentLocation.entities.length;

        this.currentLocation.entities = this.currentLocation.entities.filter(entity => {
            if (entity instanceof Enemy) {
                // 🆕 Проверяем и боссов тоже
                if (killedIds.includes(entity.uniqueId)) {
                    console.log('🗑️ Удаляем: ' + entity.uniqueId);
                    // Если это босс — очищаем ссылку
                    if (entity instanceof Boss && this.currentLocation.boss === entity) {
                        this.currentLocation.boss = null;
                    }
                    return false;
                }
            }
            return true;
        });

        const removedCount = beforeCount - this.currentLocation.entities.length;
        if (removedCount > 0) {
            console.log('🗑️ Удалено ' + removedCount + ' мобов');
        }
    }

    markOpenedChests(openedIds) {
        if (!openedIds || openedIds.length === 0) return;

        let markedCount = 0;

        for (const entity of this.currentLocation.entities) {
            if (entity instanceof TreasureChest) {
                if (openedIds.includes(entity.uniqueId)) {
                    if (!entity.isOpen) {
                        entity.isOpen = true;
                        markedCount++;
                        console.log('📦 Помечаем сундук как открытый: ' + entity.uniqueId);
                    }
                }
            }
        }

        console.log('📦 Помечено ' + markedCount + ' открытых сундуков из ' + openedIds.length);
    }

    update(deltaTime) {
        if (this.ui.activePanel || this.isPaused) return;

        this.player.update();
        this.network.updatePosition(this.player);
        this.syncOtherPlayers();
        for (const other of Object.values(this.otherPlayers)) other.update();

        if (this.currentLocationId === 'arena_survival' && this.waveManager.active) {
            this.waveManager.update(deltaTime, this.player);
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

        this.camera.follow(this.player.x + CONSTANTS.TILE_SIZE / 2, this.player.y + CONSTANTS.TILE_SIZE / 2);
        const mapW = (this.currentLocation.mapWidth || CONSTANTS.MAP_WIDTH) * CONSTANTS.TILE_SIZE;
        const mapH = (this.currentLocation.mapHeight || CONSTANTS.MAP_HEIGHT) * CONSTANTS.TILE_SIZE;
        this.camera.clamp(mapW, mapH);

        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            this.damageNumbers[i].timer++;
            this.damageNumbers[i].y -= 1.2;
            if (this.damageNumbers[i].timer >= this.damageNumbers[i].maxTimer) this.damageNumbers.splice(i, 1);
        }

        if (this.player.hp <= 0 && !this.isPaused) this.handlePlayerDeath();

        this.ui.updateHUD();
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.camera.apply(this.ctx);

        // Карта (с culling)
        this.currentLocation.render(this.ctx, this.camera);

        // 🆕 Рендерим ВСЕХ врагов без culling (чтобы не пропали)
        for (const entity of this.currentLocation.entities) {
            if (entity instanceof Enemy) {
                if (this.camera.isEntityVisible(entity.x, entity.y, 100)) {
                    if (entity instanceof Boss) entity.render(this.ctx);
                    else if (entity instanceof ArenaBat) entity.render(this.ctx);
                    else this.enemyRenderer.render(this.ctx, entity);
                }
            }
        }

        // Другие игроки
        for (const other of Object.values(this.otherPlayers)) {
            if (this.camera.isEntityVisible(other.x, other.y)) {
                this.otherPlayerRenderer.render(this.ctx, other);
            }
        }

        // 🆕 Названия и замки над порталами
        for (const entity of this.currentLocation.entities) {
            if (entity instanceof Portal) {
                this.renderPortalLabel(entity);
            }
        }

        this.playerRenderer.render(this.ctx, this.player);
        this.renderDamageNumbers();
        this.camera.restore(this.ctx);

        // HUD (поверх камеры)
        if (this.currentLocation.boss && !this.currentLocation.boss.isDead) {
            this.renderBossHUD(this.currentLocation.boss);
        }

        if (this.currentLocationId === 'arena_survival' && this.waveManager.active) {
            this.renderArenaHUD();
        }
    }

    // 🆕 Отрисовка названия и замка над порталом
    renderPortalLabel(portal) {
        const ctx = this.ctx;
        const centerX = portal.x + CONSTANTS.TILE_SIZE / 2;
        const centerY = portal.y - 12;

        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Проверяем, заблокирован ли портал
        let isLocked = false;
        if (portal.targetLocation === 'arena_survival') {
            const completed = this.player.completedEpochs || [];
            isLocked = !completed.includes('epoch_dungeon');
        } else if (portal.targetLocation.startsWith('epoch_') && portal.targetLocation !== 'epoch_dungeon') {
            const epochId = portal.targetLocation.replace('epoch_', '');
            const epoch = typeof EPOCHS !== 'undefined' ? EPOCHS[epochId] : null;
            if (epoch && !epoch.unlocked) isLocked = true;
        }

        // Название портала
        const label = portal.label;
        const textWidth = ctx.measureText(label).width;

        // Фон
        ctx.fillStyle = isLocked ? 'rgba(100,0,0,0.8)' : 'rgba(0,0,0,0.7)';
        ctx.fillRect(centerX - textWidth / 2 - 6, centerY - 14, textWidth + 12, 18);

        // Текст
        ctx.fillStyle = isLocked ? '#ff6666' : '#fff';
        ctx.fillText(label, centerX, centerY);

        // Замок
        if (isLocked) {
            ctx.font = '18px sans-serif';
            ctx.fillText('🔒', centerX, centerY - 16);
        }
    }
    renderBossHUD(boss) {
        const ctx = this.ctx;
        ctx.save();

        const barWidth = 400;
        const barHeight = 25;
        const x = (this.canvas.width - barWidth) / 2;
        const y = 50;

        // Фон
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(x - 10, y - 30, barWidth + 20, 70);
        ctx.strokeStyle = boss.isEnraged ? '#ff0000' : '#8b0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 10, y - 30, barWidth + 20, 70);

        // Имя босса
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = boss.isEnraged ? '#ff0000' : '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(boss.icon + ' ' + boss.name + (boss.isEnraged ? ' 💢' : ''), x + barWidth / 2, y - 25);

        // Полоска HP
        ctx.fillStyle = '#500';
        ctx.fillRect(x, y, barWidth, barHeight);

        const hpPercent = Math.max(0, boss.hp / boss.maxHp);
        const gradient = ctx.createLinearGradient(x, y, x + barWidth * hpPercent, y);
        gradient.addColorStop(0, boss.isEnraged ? '#ff0000' : '#8b0000');
        gradient.addColorStop(1, boss.isEnraged ? '#ff6666' : '#c0392b');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

        // Текст HP
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const hpText = Math.floor(boss.hp) + ' / ' + boss.maxHp;
        ctx.strokeText(hpText, x + barWidth / 2, y + 5);
        ctx.fillText(hpText, x + barWidth / 2, y + 5);

        ctx.restore();
    }
    renderDamageNumbers() {
        for (const num of this.damageNumbers) {
            const t = num.timer / num.maxTimer;
            this.ctx.save();
            this.ctx.globalAlpha = 1 - t;
            this.ctx.font = 'bold ' + Math.floor(18 * (1 + t * 0.5)) + 'px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText('-' + num.value, num.x, num.y);
            this.ctx.fillStyle = num.color;
            this.ctx.fillText('-' + num.value, num.x, num.y);
            this.ctx.restore();
        }
    }

    renderArenaHUD() {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 280, 80);
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 280, 80);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('💀 ВОЛНА: ' + this.waveManager.wave, 20, 20);
        const levelTier = Math.floor(this.player.level / CONSTANTS.ARENA.LEVEL_SCALE_INTERVAL);
        const powerMultiplier = Math.pow(CONSTANTS.ARENA.LEVEL_SCALE_POWER, levelTier);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Множитель силы: x' + powerMultiplier.toFixed(2), 20, 45);
        const progress = this.waveManager.waveTimer / CONSTANTS.ARENA.WAVE_INTERVAL;
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 70, 260, 10);
        ctx.fillStyle = '#e94560';
        ctx.fillRect(20, 70, 260 * progress, 10);
        ctx.restore();
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
class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.locations = {};
        this.keys = {};
        this.joystickActive = false;
        this.joystickX = 0;
        this.joystickY = 0;
        this.lastTime = 0;
        this.damageNumbers = [];
        this.isPaused = false;
        this.otherPlayers = {};

        var savedData = localStorage.getItem('dungeonChronicles_save');
        if (savedData) {
            console.log('Loading save...');
            var data = JSON.parse(savedData);
            this.player = new Player(data.player.x, data.player.y);
            this.player.loadFromJSON(data.player);
            this.currentLocationId = data.currentLocationId || 'city';
            if (this.currentLocationId !== 'city') {
                console.log('Restoring location: ' + this.currentLocationId);
                if (this.currentLocationId.startsWith('epoch_')) {
                    var epochId = this.currentLocationId.replace('epoch_', '');
                    if (epochId === 'ancient_ruins') {
                        this.locations[this.currentLocationId] = new AncientRuinsLocation();
                    } else {
                        this.locations[this.currentLocationId] = new DungeonLocation('dungeon_1');
                    }
                } else if (this.currentLocationId === 'arena_survival' || this.currentLocationId.startsWith('dungeon_')) {
                    this.locations[this.currentLocationId] = new DungeonLocation(this.currentLocationId);
                }
                var loc = this.locations[this.currentLocationId];
                if (loc) {
                    var mw = (loc.mapWidth || CONSTANTS.MAP_WIDTH) * CONSTANTS.TILE_SIZE;
                    var mh = (loc.mapHeight || CONSTANTS.MAP_HEIGHT) * CONSTANTS.TILE_SIZE;
                    if (this.player.x >= mw || this.player.y >= mh || this.player.x < 0 || this.player.y < 0) {
                        console.log('Coords out of bounds, moving to safe zone');
                        this.player.x = 3 * CONSTANTS.TILE_SIZE;
                        this.player.y = 3 * CONSTANTS.TILE_SIZE;
                    }
                } else {
                    console.log('Location not found, returning to city');
                    this.currentLocationId = 'city';
                    this.player.x = 15 * CONSTANTS.TILE_SIZE;
                    this.player.y = 10 * CONSTANTS.TILE_SIZE;
                }
            }
        } else {
            console.log('New game');
            this.player = new Player(15 * CONSTANTS.TILE_SIZE, 10 * CONSTANTS.TILE_SIZE);
            this.currentLocationId = 'city';
        }

        this.locations['city'] = new CityLocation();
        this.currentLocation = this.locations[this.currentLocationId];

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
        console.log('Game loaded! Location: ' + this.currentLocation.name);
    }

    updateHUD() {
        this.ui.updateHUD();
    }

    saveGame() {
        var data = {
            player: this.player.saveToJSON(),
            currentLocationId: this.currentLocationId
        };
        localStorage.setItem('dungeonChronicles_save', JSON.stringify(data));
    }

    loadGame() {
        var savedData = localStorage.getItem('dungeonChronicles_save');
        if (savedData) {
            var data = JSON.parse(savedData);
            this.player.loadFromJSON(data.player);
            this.changeLocation(data.currentLocationId || 'city');
            this.ui.updateHUD();
            return true;
        }
        return false;
    }

    changeLocation(locationId) {
        console.log('Transition to: ' + locationId);
        if (this.currentLocationId === 'arena_survival' && locationId !== 'arena_survival') {
            this.waveManager.stop();
        }
        if (this.currentLocationId && this.currentLocationId !== locationId) {
            this.network.cleanupKilledEnemies(this.currentLocationId);
        }
        if (locationId.startsWith('epoch_')) {
            var epochId = locationId.replace('epoch_', '');
            this.player.currentEpoch = epochId;
            if (epochId === 'ancient_ruins') {
                this.locations[locationId] = new AncientRuinsLocation();
            } else {
                this.locations[locationId] = new DungeonLocation('dungeon_1');
            }
        } else if (locationId.startsWith('dungeon_') || locationId === 'arena_survival') {
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
        if (locationId !== 'city') {
            var self = this;
            this.network.getKilledEnemies(locationId, function (killedIds) {
                self.removeKilledEnemies(killedIds);
            });
            this.network.getOpenedChests(locationId, function (openedIds) {
                self.markOpenedChests(openedIds);
            });
        }
        if (locationId === 'arena_survival') {
            this.startArena();
        }
        this.saveGame();
    }

    removeKilledEnemies(killedIds) {
        if (!killedIds || killedIds.length === 0) return;
        this.currentLocation.entities = this.currentLocation.entities.filter(function (entity) {
            if (entity instanceof Enemy) {
                if (killedIds.indexOf(entity.uniqueId) !== -1) return false;
            }
            return true;
        });
        console.log('Removed ' + killedIds.length + ' killed enemies');
    }

    markOpenedChests(openedIds) {
        if (!openedIds || openedIds.length === 0) return;
        for (var i = 0; i < this.currentLocation.entities.length; i++) {
            var entity = this.currentLocation.entities[i];
            if (entity instanceof TreasureChest) {
                if (openedIds.indexOf(entity.uniqueId) !== -1) {
                    entity.isOpen = true;
                }
            }
        }
        console.log('Marked ' + openedIds.length + ' opened chests');
    }

    startArena() {
        console.log('Arena started!');
        this.waveManager = new WaveManager(this.currentLocation);
        this.waveManager.start(this.player.level);
    }

    handlePlayerDeath() {
        console.log('Player died!');
        this.waveManager.stop();
        if (this.player.currentEpoch) {
            console.log('Epoch ' + this.player.currentEpoch + ' failed');
            this.player.currentEpoch = null;
        }
        var deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            deathScreen.classList.remove('hidden');
            var waveEl = document.getElementById('death-wave');
            var levelEl = document.getElementById('death-level');
            if (waveEl) waveEl.textContent = this.waveManager.wave;
            if (levelEl) levelEl.textContent = this.player.level;
        }
        this.isPaused = true;
    }

    respawn() {
        console.log('Respawning in city');
        var deathScreen = document.getElementById('death-screen');
        if (deathScreen) deathScreen.classList.add('hidden');
        this.player.hp = this.player.maxHp;
        this.player.mp = this.player.maxMp;
        var goldLoss = Math.floor(this.player.gold * 0.2);
        this.player.gold = Math.max(0, this.player.gold - goldLoss);
        this.changeLocation('city');
        this.isPaused = false;
        this.saveGame();
    }

    setupInput() {
        var self = this;
        window.addEventListener('keydown', function (e) {
            self.keys[e.key.toLowerCase()] = true;
            if (e.code === 'Space') { e.preventDefault(); self.performAttack(); }
            if (e.key.toLowerCase() === 'e' || e.key === '\u0443') self.interact();
            if (e.key.toLowerCase() === 'i' || e.key === '\u0448') self.ui.toggle('panel-inventory');
            if (e.key.toLowerCase() === 'c' || e.key === '\u0441') {
                self.ui.toggle('panel-stats');
                self.bindStatButtons();
            }
            if (e.key.toLowerCase() === 'k' || e.key === '\u043B') self.ui.toggle('panel-skills');
            if (e.key === 'Escape') {
                document.querySelectorAll('.game-panel').forEach(function (p) { p.classList.add('hidden'); });
                self.ui.activePanel = null;
            }
        });
        window.addEventListener('keyup', function (e) {
            self.keys[e.key.toLowerCase()] = false;
        });
        var bind = function (id, fn) {
            var el = document.getElementById(id);
            if (el) {
                el.onclick = fn;
                el.ontouchstart = function (e) { e.preventDefault(); fn(); };
            }
        };
        bind('btn-inv', function () { self.ui.toggle('panel-inventory'); });
        bind('btn-stats', function () { self.ui.toggle('panel-stats'); self.bindStatButtons(); });
        bind('btn-skills', function () { self.ui.toggle('panel-skills'); });
        bind('btn-attack', function () { self.performAttack(); });
        bind('btn-interact', function () { self.interact(); });
        bind('close-inv', function () { self.ui.toggle('panel-inventory'); });
        bind('close-stats', function () { self.ui.toggle('panel-stats'); });
        bind('close-skills', function () { self.ui.toggle('panel-skills'); });
        bind('close-npc', function () { self.ui.closePanel('panel-npc'); });
        bind('close-shop', function () { self.ui.closePanel('panel-shop'); });
        bind('close-quests', function () { self.ui.closePanel('panel-quests'); });
        bind('close-storage', function () { self.ui.closePanel('panel-storage'); });
        bind('close-deposit', function () { self.ui.closePanel('panel-deposit'); });
    }

    bindStatButtons() {
        var self = this;
        document.querySelectorAll('#panel-stats .stat-row button').forEach(function (btn) {
            btn.onclick = function () {
                var stat = btn.getAttribute('data-stat');
                self.player.allocateStat(stat);
                self.ui.renderStats();
                self.ui.updateHUD();
                self.saveGame();
            };
        });
    }

    interact() {
        this.player.tryInteract(this.currentLocation, this);
    }

    setupJoystick() {
        var self = this;
        var base = document.getElementById('joystick-base');
        var stick = document.getElementById('joystick-stick');
        if (!base || !stick) return;
        var centerX = 0, centerY = 0;
        var maxDistance = 40;
        var start = function (e) {
            e.preventDefault();
            self.joystickActive = true;
            var rect = base.getBoundingClientRect();
            centerX = rect.left + rect.width / 2;
            centerY = rect.top + rect.height / 2;
            update(e);
        };
        var update = function (e) {
            if (!self.joystickActive) return;
            e.preventDefault();
            var touch = e.touches ? e.touches[0] : e;
            var deltaX = touch.clientX - centerX;
            var deltaY = touch.clientY - centerY;
            var distance = Math.min(Math.hypot(deltaX, deltaY), maxDistance);
            var angle = Math.atan2(deltaY, deltaX);
            stick.style.transform = 'translate(' + Math.cos(angle) * distance + 'px, ' + Math.sin(angle) * distance + 'px)';
            self.joystickX = Math.cos(angle) * distance / maxDistance;
            self.joystickY = Math.sin(angle) * distance / maxDistance;
        };
        var end = function (e) {
            e.preventDefault();
            self.joystickActive = false;
            self.joystickX = 0;
            self.joystickY = 0;
            stick.style.transform = 'translate(0px, 0px)';
        };
        base.addEventListener('touchstart', start, { passive: false });
        base.addEventListener('touchmove', update, { passive: false });
        base.addEventListener('touchend', end, { passive: false });
        base.addEventListener('touchcancel', end, { passive: false });
        base.addEventListener('mousedown', start);
        window.addEventListener('mousemove', function (e) { if (self.joystickActive) update(e); });
        window.addEventListener('mouseup', end);
    }

    performAttack() {
        var enemies = this.currentLocation.entities.filter(function (e) { return e instanceof Enemy; });
        var result = this.player.attack(enemies);
        if (result) {
            this.addDamageNumber(result.enemy.x, result.enemy.y - 10, result.damage, '#ffe066');
            if (result.killed) {
                this.player.gainXp(result.enemy.xpReward);
                this.player.gold += result.enemy.goldReward;
                this.network.reportEnemyKilled(result.enemy.uniqueId, this.currentLocationId);
                var loot = result.enemy.getLoot();
                var self = this;
                loot.forEach(function (itemId) {
                    self.player.addItem(itemId);
                    if (self.player.activeQuests) {
                        self.player.activeQuests.forEach(function (q) {
                            var questData = CONSTANTS.QUESTS[q.id];
                            if (questData.target === result.enemy.type) q.progress = (q.progress || 0) + 1;
                            else if (questData.target === itemId) q.progress = (q.progress || 0) + 1;
                        });
                    }
                });
                var enemy = result.enemy;
                setTimeout(function () {
                    self.currentLocation.entities = self.currentLocation.entities.filter(function (e) { return e !== enemy; });
                }, 500);
                this.ui.updateHUD();
                this.saveGame();
            }
        }
    }

    addDamageNumber(x, y, value, color) {
        this.damageNumbers.push({
            x: x + CONSTANTS.TILE_SIZE / 2 + (Math.random() - 0.5) * 20,
            y: y, value: value, color: color || '#fff', timer: 0, maxTimer: 45
        });
    }

    syncOtherPlayers() {
        if (!this.network.connected) return;
        for (var id in this.otherPlayers) {
            var netData = this.network.otherPlayers[id];
            if (!netData || netData.locationId !== this.currentLocationId) {
                delete this.otherPlayers[id];
            }
        }
        var entries = Object.entries(this.network.otherPlayers);
        for (var i = 0; i < entries.length; i++) {
            var eid = entries[i][0];
            var data = entries[i][1];
            if (data.locationId !== this.currentLocationId) continue;
            if (this.otherPlayers[eid]) {
                this.otherPlayers[eid].updateFromNetwork(data);
            } else {
                this.otherPlayers[eid] = new OtherPlayer(eid, data);
            }
        }
    }

    update(deltaTime) {
        if (this.ui.activePanel || this.isPaused) return;
        this.player.update();
        this.network.updatePosition(this.player);
        this.syncOtherPlayers();
        var others = Object.values(this.otherPlayers);
        for (var i = 0; i < others.length; i++) others[i].update();
        if (this.currentLocationId === 'arena_survival' && this.waveManager.active) {
            this.waveManager.update(deltaTime, this.player);
        }
        this.currentLocation.update(this.player);
        var entities = this.currentLocation.entities;
        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity instanceof Enemy) {
                var attackResult = entity.update(this.player, this.currentLocation);
                if (attackResult) {
                    this.addDamageNumber(attackResult.targetX, attackResult.targetY - 10, attackResult.damage, '#ff4444');
                }
            }
        }
        var dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['\u0446']) dy -= 1;
        if (this.keys['s'] || this.keys['\u044B']) dy += 1;
        if (this.keys['a'] || this.keys['\u0444']) dx -= 1;
        if (this.keys['d'] || this.keys['\u0432']) dx += 1;
        if (this.joystickActive) { dx = this.joystickX; dy = this.joystickY; }
        if (dx !== 0 || dy !== 0) {
            this.player.move(dx, dy, this.currentLocation.map);
        } else {
            this.player.isMoving = false;
        }
        this.camera.follow(this.player.x + CONSTANTS.TILE_SIZE / 2, this.player.y + CONSTANTS.TILE_SIZE / 2);
        var mapW = (this.currentLocation.mapWidth || CONSTANTS.MAP_WIDTH) * CONSTANTS.TILE_SIZE;
        var mapH = (this.currentLocation.mapHeight || CONSTANTS.MAP_HEIGHT) * CONSTANTS.TILE_SIZE;
        this.camera.clamp(mapW, mapH);
        for (var i = this.damageNumbers.length - 1; i >= 0; i--) {
            this.damageNumbers[i].timer++;
            this.damageNumbers[i].y -= 1.2;
            if (this.damageNumbers[i].timer >= this.damageNumbers[i].maxTimer) {
                this.damageNumbers.splice(i, 1);
            }
        }
        if (this.player.hp <= 0 && !this.isPaused) {
            this.handlePlayerDeath();
        }
        this.ui.updateHUD();
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.camera.apply(this.ctx);
        this.currentLocation.render(this.ctx, this.camera);
        var entities = this.currentLocation.entities;
        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity instanceof Enemy && this.camera.isEntityVisible(entity.x, entity.y)) {
                if (entity instanceof ArenaBat) {
                    entity.render(this.ctx);
                } else {
                    this.enemyRenderer.render(this.ctx, entity);
                }
            }
        }
        var others = Object.values(this.otherPlayers);
        for (var i = 0; i < others.length; i++) {
            if (this.camera.isEntityVisible(others[i].x, others[i].y)) {
                this.otherPlayerRenderer.render(this.ctx, others[i]);
            }
        }
        this.playerRenderer.render(this.ctx, this.player);
        this.renderDamageNumbers();
        this.camera.restore(this.ctx);
        if (this.currentLocationId === 'arena_survival' && this.waveManager.active) {
            this.renderArenaHUD();
        }
    }

    renderDamageNumbers() {
        for (var i = 0; i < this.damageNumbers.length; i++) {
            var num = this.damageNumbers[i];
            var t = num.timer / num.maxTimer;
            var alpha = 1 - t;
            var scale = 1 + t * 0.5;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.font = 'bold ' + Math.floor(18 * scale) + 'px sans-serif';
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
        var ctx = this.ctx;
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
        ctx.fillText('WAVE: ' + this.waveManager.wave, 20, 20);
        var levelTier = Math.floor(this.player.level / CONSTANTS.ARENA.LEVEL_SCALE_INTERVAL);
        var powerMultiplier = Math.pow(CONSTANTS.ARENA.LEVEL_SCALE_POWER, levelTier);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Power: x' + powerMultiplier.toFixed(2), 20, 45);
        var progress = this.waveManager.waveTimer / CONSTANTS.ARENA.WAVE_INTERVAL;
        ctx.fillStyle = '#333';
        ctx.fillRect(20, 70, 260, 10);
        ctx.fillStyle = '#e94560';
        ctx.fillRect(20, 70, 260 * progress, 10);
        ctx.restore();
    }

    loop(timestamp) {
        var deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.update(deltaTime);
        this.render();
        var self = this;
        requestAnimationFrame(function (t) { self.loop(t); });
    }

    start() {
        var self = this;
        requestAnimationFrame(function (t) { self.loop(t); });
    }
}
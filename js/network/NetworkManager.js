class NetworkManager {
    constructor(game) {
        this.game = game;

        // 🆕 1. ПОСТОЯННЫЙ ID: Проверяем, есть ли уже сохранённый ID
        // 🆕 ИСПРАВЛЕНО: Используем sessionStorage (уникален для каждой вкладки!)
        let savedId = sessionStorage.getItem('mmorpg_player_id');
        if (savedId) {
            this.playerId = savedId;
            console.log('🆔 Мой ID (эта вкладка):', this.playerId);
        } else {
            this.playerId = 'player_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
            sessionStorage.setItem('mmorpg_player_id', this.playerId);
            console.log('🆔 Создан новый ID для этой вкладки:', this.playerId);
        }

        this.playerName = 'Герой';
        this.otherPlayers = {};
        this.connected = false;
        this.lastUpdate = 0;
        this.UPDATE_INTERVAL = 100;

        this.initFirebase();
        this.setupMobileCleanup(); // 🆕 2. Надёжное отключение для мобильных
    }
    // 🆕 Сообщить всем, что моб убит
    reportEnemyKilled(enemyId, locationId) {
        if (!this.connected) return;
        const key = locationId + '/' + enemyId;
        this.db.ref('killed_enemies/' + key).set({
            killedBy: this.playerName,
            timestamp: Date.now()
        });
        console.log(`💀 Моб ${enemyId} убит, синхронизируем...`);
    }

    // 🆕 Получить список убитых мобов для локации
    getKilledEnemies(locationId, callback) {
        if (!this.connected) {
            callback([]);
            return;
        }
        this.db.ref('killed_enemies/' + locationId).once('value', (snapshot) => {
            const data = snapshot.val();
            const killedIds = data ? Object.keys(data) : [];
            callback(killedIds);
        });
    }

    // 🆕 Очистить убитых мобов при выходе из локации
    cleanupKilledEnemies(locationId) {
        if (!this.connected) return;
        this.db.ref('killed_enemies/' + locationId).remove();
    }
    initFirebase() {
        try {
            const firebaseConfig = {
                apiKey: "AIzaSyCbD8mBeil89NsnP2BUBeJpNXztU-jCyl8",
                authDomain: "mmorpg-game-c3469.firebaseapp.com",
                databaseURL: "https://mmorpg-game-c3469-default-rtdb.europe-west1.firebasedatabase.app",
                projectId: "mmorpg-game-c3469",
                storageBucket: "mmorpg-game-c3469.firebasestorage.app",
                messagingSenderId: "1040952297153",
                appId: "1:1040952297153:web:05218ca608b30c9a627640",
                measurementId: "G-BVPYX1SKNF"
            };

            firebase.initializeApp(firebaseConfig);
            this.db = firebase.database();
            this.connected = true;
            console.log('✅ Firebase подключён! Онлайн-режим активен.');

            this.db.ref('players').on('value', (snapshot) => {
                const data = snapshot.val();
                this.otherPlayers = {};

                if (data) {
                    const now = Date.now();
                    for (const [id, playerData] of Object.entries(data)) {
                        if (id === this.playerId) continue;

                        // Удаляем "призраков", которые не обновлялись 15 секунд
                        if (now - playerData.lastSeen > 15000) continue;

                        this.otherPlayers[id] = playerData;
                    }
                }

                this.updateOnlineCount();
            });

        } catch (error) {
            console.error('❌ Ошибка подключения к Firebase:', error);
            this.connected = false;
        }
    }

    // 🆕 Надёжная очистка при закрытии/сворачивании (работает на мобильных!)
    setupMobileCleanup() {
        const cleanup = () => {
            if (this.connected) {
                console.log('👋 Игрок выходит из сети, удаляем из базы...');
                this.db.ref('players/' + this.playerId).remove();
            }
        };

        // Стандартное закрытие вкладки (ПК)
        window.addEventListener('beforeunload', cleanup);

        // 📱 Надёжное закрытие/сворачивание на мобильных (iOS Safari, Chrome Android)
        window.addEventListener('pagehide', cleanup);

        // Если игрок свернул браузер, помечаем его как неактивного
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.connected) {
                // Можно временно удалить или просто дать сработать таймауту 15 сек
                // Оставим таймаут, чтобы при быстром разворачивании не было мерцания
            }
        });
    }

    setPlayerName(name) {
        this.playerName = name || 'Герой';
    }

    updatePosition(player) {
        if (!this.connected) return;

        const now = Date.now();
        if (now - this.lastUpdate < this.UPDATE_INTERVAL) return;
        this.lastUpdate = now;

        const data = {
            name: this.playerName,
            x: Math.floor(player.x),
            y: Math.floor(player.y),
            direction: player.direction,
            level: player.level,
            hp: Math.floor(player.hp),
            maxHp: player.maxHp,
            locationId: this.game.currentLocationId,
            lastSeen: now
        };

        // Используем update вместо set для лучшей производительности
        this.db.ref('players/' + this.playerId).update(data);
    }
    // 🆕 Подписка на обновления локации в реальном времени
    s    // 🆕 Подписка на обновления локации в реальном времени
    subscribeToLocationUpdates(locationId, callback) {
        if (!this.connected) {
            console.log('⚠️ Не подключён к Firebase, синхронизация отключена');
            return;
        }

        console.log('📡 Подписываемся на обновления локации: ' + locationId);

        // Очищаем старые подписки
        if (this.locationListeners) {
            this.db.ref('killed_enemies/' + this.currentLocationId).off();
            this.db.ref('opened_chests/' + this.currentLocationId).off();
        }

        this.currentLocationId = locationId;
        this.locationListeners = true;

        // Подписываемся на убитых мобов
        this.db.ref('killed_enemies/' + locationId).on('value', (snapshot) => {
            const data = snapshot.val();
            const killedIds = data ? Object.keys(data) : [];
            console.log('💀 Получено обновление убитых мобов: ' + killedIds.length);
            callback({ type: 'killedEnemies', ids: killedIds });
        });

        // Подписываемся на открытые сундуки
        this.db.ref('opened_chests/' + locationId).on('value', (snapshot) => {
            const data = snapshot.val();
            const openedIds = data ? Object.keys(data) : [];
            console.log('📦 Получено обновление открытых сундуков: ' + openedIds.length);
            callback({ type: 'openedChests', ids: openedIds });
        });
    }
    disconnect() {
        if (!this.connected) return;
        this.db.ref('players/' + this.playerId).remove();
        this.connected = false;
    }

    updateOnlineCount() {
        const count = Object.keys(this.otherPlayers).length + 1;
        const el = document.getElementById('online-count');
        if (el) el.textContent = count;
    }
    // 🆕 Сообщить всем, что сундук открыт
    reportChestOpened(chestId, locationId) {
        if (!this.connected) return;
        const key = locationId + '/' + chestId;
        this.db.ref('opened_chests/' + key).set({
            openedBy: this.playerName,
            timestamp: Date.now()
        });
        console.log(`📦 Сундук ${chestId} открыт, синхронизируем...`);
    }

    // 🆕 Получить список открытых сундуков
    getOpenedChests(locationId, callback) {
        if (!this.connected) {
            callback([]);
            return;
        }
        this.db.ref('opened_chests/' + locationId).once('value', (snapshot) => {
            const data = snapshot.val();
            const openedIds = data ? Object.keys(data) : [];
            callback(openedIds);
        });
    }
    // 🆕 Очистить открытые сундуки при выходе из локации
    cleanupOpenedChests(locationId) {
        if (!this.connected) return;
        this.db.ref('opened_chests/' + locationId).remove();
    }
    // 🆕 Подписка на волны арены
    subscribeToArenaWaves(locationId, callback) {
        if (!this.connected) return;

        console.log('📡 Подписываемся на волны арены: ' + locationId);

        // Подписываемся на номер текущей волны
        this.db.ref('arena_waves/' + locationId + '/currentWave').on('value', (snapshot) => {
            const currentWave = snapshot.val();
            if (currentWave) {
                callback({ currentWave: currentWave });
            }
        });

        // Подписываемся на убитых мобов арены
        this.db.ref('killed_enemies/' + locationId).on('value', (snapshot) => {
            const data = snapshot.val();
            const killedIds = data ? Object.keys(data) : [];
            callback({ killedMobs: killedIds });
        });
    }

    // 🆕 Отправить номер волны в Firebase
    reportArenaWave(locationId, waveNumber) {
        if (!this.connected) return;

        // Проверяем, не отправлял ли уже кто-то эту волну
        this.db.ref('arena_waves/' + locationId + '/currentWave').once('value', (snapshot) => {
            const existingWave = snapshot.val();
            if (!existingWave || waveNumber > existingWave) {
                this.db.ref('arena_waves/' + locationId + '/currentWave').set(waveNumber);
                console.log('🌊 Отправлена волна ' + waveNumber + ' в Firebase');
            }
        });
    }
}
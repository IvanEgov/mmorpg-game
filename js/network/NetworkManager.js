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
}
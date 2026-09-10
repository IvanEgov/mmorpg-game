class NetworkManager {
    constructor(game) {
        this.game = game;
        this.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        this.playerName = 'Герой';
        this.otherPlayers = {}; // { playerId: { name, x, y, direction, level, hp } }
        this.connected = false;
        this.lastUpdate = 0;
        this.UPDATE_INTERVAL = 100; // мс между отправками позиции

        this.initFirebase();
    }

    initFirebase() {
        try {
            // ⚠️ ВАЖНО: Замени этот конфиг на СВОЙ из Firebase Console!
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

            // Проверяем, что конфиг заполнен
            if (firebaseConfig.apiKey === "AIzaSyCbD8mBeil89NsnP2BUBeJpNXztU-jCyl8") {
                console.warn('⚠️ Firebase не настроен! Игра работает в оффлайн режиме.');
                console.warn('📖 Открой NetworkManager.js и замени конфиг на свой из Firebase Console.');
                return;
            }

            firebase.initializeApp(firebaseConfig);
            this.db = firebase.database();
            this.connected = true;
            console.log('✅ Firebase подключён!');

            // Слушаем изменения в списке игроков
            this.db.ref('players').on('value', (snapshot) => {
                const data = snapshot.val();
                this.otherPlayers = {};

                if (data) {
                    const now = Date.now();
                    for (const [id, playerData] of Object.entries(data)) {
                        if (id === this.playerId) continue; // пропускаем себя
                        // Удаляем игроков, которые не обновлялись 10 секунд
                        if (now - playerData.lastSeen > 10000) continue;
                        this.otherPlayers[id] = playerData;
                    }
                }

                this.updateOnlineCount();
            });

            // При закрытии вкладки — удаляем себя
            window.addEventListener('beforeunload', () => {
                this.disconnect();
            });

        } catch (error) {
            console.error('❌ Ошибка Firebase:', error);
            this.connected = false;
        }
    }

    setPlayerName(name) {
        this.playerName = name || 'Герой';
    }

    // Отправка своей позиции в Firebase
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

        this.db.ref('players/' + this.playerId).set(data);
    }

    disconnect() {
        if (!this.connected) return;
        this.db.ref('players/' + this.playerId).remove();
    }

    updateOnlineCount() {
        const count = Object.keys(this.otherPlayers).length + 1; // +1 за себя
        const el = document.getElementById('online-count');
        if (el) el.textContent = count;
    }
}
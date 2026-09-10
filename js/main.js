document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Запуск Dungeon Chronicles Online...');

    const loginScreen = document.getElementById('login-screen');
    const loginBtn = document.getElementById('login-btn');
    const nameInput = document.getElementById('player-name-input');

    // Проверяем, есть ли сохранённое имя
    const savedName = localStorage.getItem('player_name');
    if (savedName) {
        nameInput.value = savedName;
    }

    const startGame = () => {
        const name = nameInput.value.trim() || 'Герой';
        localStorage.setItem('player_name', name);

        // Скрываем экран входа, показываем игру
        loginScreen.classList.add('hidden');
        document.getElementById('game').classList.remove('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('menu-buttons').classList.remove('hidden');

        // Запускаем игру
        const game = new Game('game');
        game.network.setPlayerName(name);
        game.start();

        console.log(`✅ ${name} вошёл в мир!`);
    };

    loginBtn.addEventListener('click', startGame);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startGame();
    });

    // Фокус на поле ввода
    nameInput.focus();
});
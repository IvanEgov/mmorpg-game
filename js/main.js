document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Инициализация Dungeon Chronicles...');
    // Конструктор Game сам присвоит window.gameInstance = this;
    const game = new Game('game');
    game.start();
    console.log('✅ Игра запущена!');
});
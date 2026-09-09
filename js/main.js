// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Инициализация Dungeon Chronicles...');
    
    const game = new Game('game');
    game.start();
    
    console.log('✅ Игра запущена! Управление: WASD или ЦФЫВ');
});
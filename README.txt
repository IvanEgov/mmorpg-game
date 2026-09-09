morpg-game/
├── index.html
├── style.css
└── js/
    ├── main.js                 # Точка входа (инициализация)
    ├── core/
    │   └── Game.js             # Игровой цикл, состояние, камера
    ├── entities/
    │   ├── Player.js           # Логика и характеристики игрока
    │   └── PlayerRenderer.js   # Визуальная отрисовка игрока
    └── data/
        └── constants.js        # Глобальные константы (размеры, цвета)
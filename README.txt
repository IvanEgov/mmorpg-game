morpg-game/
├── index.html
├── style.css
└── js/
    ├── main.js                 # Точка входа (инициализация)
    ├── core/
    │   ├── Game.js             # Игровой цикл, состояние, камера
    |   └──UIManager.js	
    ├── entities/		# Управляет всеми HTML-панелями. Он читает данные из Player и обновляет DOM.
    │   ├── Player.js           # Логика и характеристики игрока
    │   └── PlayerRenderer.js   # Визуальная отрисовка игрока
    └── data/
        └── constants.js        # Глобальные константы (размеры, цвета)
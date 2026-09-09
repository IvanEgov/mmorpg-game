morpg-game/
├── index.html
├── style.css
└── js/
    ├── main.js                 # Точка входа (инициализация)
    ├── core/
    │   ├── Game.js             # Игровой цикл, состояние, камера
    |   └──UIManager.js		# Управляет всеми HTML-панелями. Он читает данные из Player и обновляет DOM.
    ├── entities/		
    │   ├── Player.js           # Логика и характеристики игрока
    │   ├── PlayerRenderer.js   # Визуальная отрисовка игрока
    |   ├── EnemyRenderer.js    # Визуальная отрисовка врага
    |   └── Enemy.js  		# Логика и характеристики врага
    └── data/
        └── constants.js        # Глобальные константы (размеры, цвета)
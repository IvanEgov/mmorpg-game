class Player {
    constructor(x, y) {
        // Позиция
        this.x = x;
        this.y = y;
        this.direction = 'down'; // 'up', 'down', 'left', 'right' (для будущих спрайтов)

        // Характеристики
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        
        this.hp = 100;
        this.maxHp = 100;
        this.mp = 50;
        this.maxMp = 50;
        
        this.baseAtk = 10;
        this.baseDef = 2;
        this.gold = 50;

        // Инвентарь и экипировка
        this.inventory = [
            { id: 'potion_hp_1', name: 'Зелье HP', icon: '🧪', type: 'consumable', heal: 30, price: 20 }
        ];
        this.equipment = {
            weapon: null, // { name, atk }
            armor: null   // { name, def }
        };

        // Состояния
        this.attackCooldown = 0;
        this.isMoving = false;
    }

    get totalAtk() {
        return this.baseAtk + (this.equipment.weapon ? this.equipment.weapon.atk : 0);
    }

    get totalDef() {
        return this.baseDef + (this.equipment.armor ? this.equipment.armor.def : 0);
    }

    move(dx, dy, map) {
        if (dx > 0) this.direction = 'right';
        if (dx < 0) this.direction = 'left';
        if (dy > 0) this.direction = 'down';
        if (dy < 0) this.direction = 'up';

        const newX = this.x + dx;
        const newY = this.y + dy;

        // Проверка коллизий со стенами
        const tileX = Math.floor((newX + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor((newY + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);

        // 1 = стена, 5 = вода (пример)
        if (tileX >= 0 && tileX < CONSTANTS.MAP_WIDTH && tileY >= 0 && tileY < CONSTANTS.MAP_HEIGHT) {
            const tile = map[tileY][tileX];
            if (tile !== 1 && tile !== 5) {
                this.x = newX;
                this.y = newY;
                this.isMoving = true;
            } else {
                this.isMoving = false;
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
    }

    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.totalDef);
        this.hp -= actualDamage;
        return actualDamage;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        
        this.maxHp += 20;
        this.hp = this.maxHp;
        this.maxMp += 10;
        this.mp = this.maxMp;
        this.baseAtk += 3;
        this.baseDef += 1;
        
        console.log(`🎉 Уровень повышен! Теперь уровень ${this.level}`);
    }

    update() {
        // Здесь будет пассивная регенерация или тик кулдаунов
        if (this.attackCooldown > 0) this.attackCooldown--;
    }
}
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.direction = 'down';

        // Базовые характеристики (очки для распределения)
        this.str = 1; // Сила (влияет на атаку)
        this.agi = 1; // Ловкость (влияет на скорость)
        this.int = 1; // Интеллект (влияет на ману)
        this.vit = 1; // Живучесть (влияет на здоровье и защиту)
        
        this.statPoints = 5; // Даем очки для теста
        this.skillPoints = 3; // Даем очки для теста

        // Навыки (уровень прокачки)
        this.skills = {
            'power_strike': 0,
            'vitality': 0,
            'agility': 0
        };

        // Инвентарь: массив { id: 'item_id', count: 1 }
        this.inventory = [
            { id: 'potion_hp', count: 3 },
            { id: 'sword_iron', count: 1 }
        ];
        
        this.equipment = {
            weapon: null,
            armor: null
        };

        this.attackCooldown = 0;
        this.isMoving = false;
    }

    // --- Вычисляемые характеристики ---
    get maxHp() { return 100 + (this.vit * 10) + (this.skills['vitality'] * 15); }
    get maxMp() { return 50 + (this.int * 10); }
    get totalAtk() { 
        let atk = 10 + (this.str * 2);
        if (this.equipment.weapon) atk += CONSTANTS.ITEMS[this.equipment.weapon].atk;
        atk *= (1 + this.skills['power_strike'] * 0.05); // +5% за уровень
        return Math.floor(atk);
    }
    get totalDef() { 
        let def = 2 + (this.vit * 1);
        if (this.equipment.armor) def += CONSTANTS.ITEMS[this.equipment.armor].def;
        return def;
    }
    get speed() { return CONSTANTS.PLAYER_SPEED + (this.skills['agility'] * 0.2); }

    // --- Управление инвентарем ---
    addItem(itemId, count = 1) {
        const existing = this.inventory.find(i => i.id === itemId);
        if (existing) {
            existing.count += count;
        } else {
            this.inventory.push({ id: itemId, count: count });
        }
    }

    removeItem(itemId, count = 1) {
        const index = this.inventory.findIndex(i => i.id === itemId);
        if (index !== -1) {
            this.inventory[index].count -= count;
            if (this.inventory[index].count <= 0) {
                this.inventory.splice(index, 1);
            }
            return true;
        }
        return false;
    }

    useItem(itemId) {
        const itemData = CONSTANTS.ITEMS[itemId];
        if (!itemData) return;

        if (itemData.type === 'consumable') {
            if (itemData.heal) this.heal(itemData.heal);
            if (itemData.mp) this.mp = Math.min(this.maxMp, this.mp + itemData.mp);
            this.removeItem(itemId, 1);
            return true;
        } else if (itemData.type === 'weapon' || itemData.type === 'armor') {
            this.equipItem(itemId);
            return true;
        }
        return false;
    }

    equipItem(itemId) {
        const itemData = CONSTANTS.ITEMS[itemId];
        const slot = itemData.type; // 'weapon' или 'armor'
        
        // Снимаем старое, если есть
        if (this.equipment[slot]) {
            this.addItem(this.equipment[slot], 1);
        }
        
        this.equipment[slot] = itemId;
        this.removeItem(itemId, 1);
    }

    // --- Прокачка ---
    allocateStat(statName) {
        if (this.statPoints > 0 && ['str', 'agi', 'int', 'vit'].includes(statName)) {
            this[statName]++;
            this.statPoints--;
        }
    }

    upgradeSkill(skillId) {
        const skill = CONSTANTS.SKILLS[skillId];
        if (this.skillPoints >= skill.costPerLevel && this.skills[skillId] < skill.maxLevel) {
            this.skills[skillId]++;
            this.skillPoints -= skill.costPerLevel;
        }
    }

    // --- Базовые методы ---
    move(dx, dy, map) {
        if (dx > 0) this.direction = 'right';
        if (dx < 0) this.direction = 'left';
        if (dy > 0) this.direction = 'down';
        if (dy < 0) this.direction = 'up';

        const newX = this.x + dx * (this.speed / CONSTANTS.PLAYER_SPEED);
        const newY = this.y + dy * (this.speed / CONSTANTS.PLAYER_SPEED);

        const tileX = Math.floor((newX + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor((newY + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);

        if (tileX >= 0 && tileX < CONSTANTS.MAP_WIDTH && tileY >= 0 && tileY < CONSTANTS.MAP_HEIGHT) {
            if (map[tileY][tileX] !== 1 && map[tileY][tileX] !== 5) {
                this.x = newX;
                this.y = newY;
                this.isMoving = true;
            } else {
                this.isMoving = false;
            }
        }
    }

    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.totalDef);
        this.hp = (this.hp || this.maxHp) - actualDamage; // инициализация при первом ударе
        return actualDamage;
    }

    heal(amount) {
        this.hp = (this.hp || this.maxHp);
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    update() {
        if (!this.hp) this.hp = this.maxHp;
        if (!this.mp) this.mp = this.maxMp;
        if (this.attackCooldown > 0) this.attackCooldown--;
    }
}
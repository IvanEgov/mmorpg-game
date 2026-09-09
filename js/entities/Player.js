class Player {
    constructor(x, y) {
        this.x = x; this.y = y; this.direction = 'down';

        // Уровень и опыт
        this.level = 1;
        this.xp = 0;
        this.maxXp = 100;

        // Очки для распределения (даем стартовые, чтобы было что тестить)
        this.statPoints = 3; 
        this.skillPoints = 1;

        // Базовые характеристики
        this.str = 1; this.agi = 1; this.int = 1; this.vit = 1;
        
        this.skills = { 'power_strike': 0, 'vitality': 0, 'agility': 0 };

        this.inventory = [
            { id: 'potion_hp', count: 3 },
            { id: 'sword_iron', count: 1 }
        ];
        this.equipment = { weapon: null, armor: null };

        this.attackCooldown = 0;
        this.isMoving = false;
    }

    // --- Вычисляемые характеристики ---
    get maxHp() { return 100 + (this.vit * 15) + (this.skills['vitality'] * 20); }
    get maxMp() { return 50 + (this.int * 10); }
    get totalAtk() { 
        let atk = 10 + (this.str * 3);
        if (this.equipment.weapon) atk += CONSTANTS.ITEMS[this.equipment.weapon].atk;
        atk *= (1 + this.skills['power_strike'] * 0.05);
        return Math.floor(atk);
    }
    get totalDef() { 
        let def = 2 + (this.vit * 1);
        if (this.equipment.armor) def += (CONSTANTS.ITEMS[this.equipment.armor]?.def || 0);
        return def;
    }
    get speed() { return CONSTANTS.PLAYER_SPEED + (this.skills['agility'] * 0.3); }

    // --- Система опыта и уровня ---
    gainXp(amount) {
        this.xp += amount;
        while (this.xp >= this.maxXp) {
            this.xp -= this.maxXp;
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.maxXp = Math.floor(this.maxXp * 1.5);
        
        // Награды за уровень
        this.statPoints += 3;
        this.skillPoints += 1;
        
        // Полное восстановление и рост базовых статов
        this.maxHp += 20; this.hp = this.maxHp;
        this.maxMp += 10; this.mp = this.maxMp;
        this.str += 1; this.vit += 1;
        
        console.log(`🎉 Уровень повышен! Теперь уровень ${this.level}`);
    }

    // --- Инвентарь и экипировка (без изменений, но проверь, что они тут) ---
    addItem(itemId, count = 1) {
        const existing = this.inventory.find(i => i.id === itemId);
        if (existing) existing.count += count;
        else this.inventory.push({ id: itemId, count: count });
    }
    removeItem(itemId, count = 1) {
        const index = this.inventory.findIndex(i => i.id === itemId);
        if (index !== -1) {
            this.inventory[index].count -= count;
            if (this.inventory[index].count <= 0) this.inventory.splice(index, 1);
            return true;
        }
        return false;
    }
    useItem(itemId) {
        const itemData = CONSTANTS.ITEMS[itemId];
        if (!itemData) return false;
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
        const slot = itemData.type;
        if (this.equipment[slot]) this.addItem(this.equipment[slot], 1);
        this.equipment[slot] = itemId;
        this.removeItem(itemId, 1);
    }

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
                this.x = newX; this.y = newY; this.isMoving = true;
            } else { this.isMoving = false; }
        }
    }

    takeDamage(amount) {
        if (!this.hp) this.hp = this.maxHp;
        const actualDamage = Math.max(1, amount - this.totalDef);
        this.hp -= actualDamage;
        return actualDamage;
    }
    heal(amount) {
        if (!this.hp) this.hp = this.maxHp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }
    update() {
        if (!this.hp) this.hp = this.maxHp;
        if (!this.mp) this.mp = this.maxMp;
        if (this.attackCooldown > 0) this.attackCooldown--;
    }
}
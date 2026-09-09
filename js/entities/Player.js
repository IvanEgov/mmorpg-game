class Player {
    
    constructor(x, y) {
        this.x = x; this.y = y; this.direction = 'down';
        this.level = 1; this.xp = 0; this.maxXp = 100;
        this.statPoints = 3; this.skillPoints = 1;
        this.str = 1; this.agi = 1; this.int = 1; this.vit = 1;
        this.skills = { 'power_strike': 0, 'vitality': 0, 'agility': 0 };
        this.inventory = [
            { id: 'potion_hp', count: 3 },
            { id: 'sword_iron', count: 1 }
        ];

        // === РАСШИРЕННАЯ ЭКИПИРОВКА ===
        this.equipment = {
            weapon: null,
            helmet: null,
            chest: null,
            legs: null,
            boots: null,
            ring: null
        };

        this.storage = [];
        this.activeQuests = [];
        this.attackCooldown = 0;
        this.isMoving = false;
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        this.gold = 50;
        this.attackAnimation = null;
        this.regenTimer = 0;
        this.REGEN_INTERVAL = 60;
        this.REGEN_HP = 1;
        this.REGEN_MP = 2;
    }

    get maxHp() {
        let hp = 100 + (this.vit * 15) + (this.skills['vitality'] * 20);
        if (this.equipment.ring && CONSTANTS.ITEMS[this.equipment.ring].hp) {
            hp += CONSTANTS.ITEMS[this.equipment.ring].hp;
        }
        return hp;
    }

    get maxMp() { return 50 + (this.int * 10); }

    get totalAtk() {
        let atk = 10 + (this.str * 3);
        if (this.equipment.weapon) atk += CONSTANTS.ITEMS[this.equipment.weapon].atk;
        if (this.equipment.ring && CONSTANTS.ITEMS[this.equipment.ring].atk) {
            atk += CONSTANTS.ITEMS[this.equipment.ring].atk;
        }
        atk *= (1 + this.skills['power_strike'] * 0.05);
        return Math.floor(atk);
    }

    get totalDef() {
        let def = 2 + (this.vit * 1);
        for (const slot of ['helmet', 'chest', 'legs', 'boots']) {
            if (this.equipment[slot]) {
                def += CONSTANTS.ITEMS[this.equipment[slot]].def || 0;
            }
        }
        return def;
    }

    get speed() {
        let speed = CONSTANTS.PLAYER_SPEED + (this.skills['agility'] * 0.3);
        if (this.equipment.boots && CONSTANTS.ITEMS[this.equipment.boots].speed) {
            speed += CONSTANTS.ITEMS[this.equipment.boots].speed;
        }
        return speed;
    }

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
        this.statPoints += 3;
        this.skillPoints += 1;
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        console.log(`🎉 Уровень ${this.level}!`);
    }

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
            if (itemData.heal) this.hp = Math.min(this.maxHp, this.hp + itemData.heal);
            if (itemData.mp) this.mp = Math.min(this.maxMp, this.mp + itemData.mp);
            this.removeItem(itemId, 1);
            return true;
        }
        // === ИСПРАВЛЕНО: Проверяем все типы экипировки ===
        else if (['weapon', 'helmet', 'chest', 'legs', 'boots', 'ring'].includes(itemData.type)) {
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
        if (this.statPoints > 0) {
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

        // === ИСПРАВЛЕНО: Правильная формула скорости ===
        const newX = this.x + dx * this.speed;
        const newY = this.y + dy * this.speed;
        const tileX = Math.floor((newX + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor((newY + CONSTANTS.TILE_SIZE / 2) / CONSTANTS.TILE_SIZE);

        if (tileX >= 0 && tileX < CONSTANTS.MAP_WIDTH && tileY >= 0 && tileY < CONSTANTS.MAP_HEIGHT) {
            if (map[tileY] && map[tileY][tileX] !== 1 && map[tileY][tileX] !== 7) {
                this.x = newX;
                this.y = newY;
                this.isMoving = true;
            } else {
                this.isMoving = false;
            }
        } else {
            this.isMoving = false;
        }
    }

    takeDamage(amount) {
        const actualDamage = Math.max(1, amount - this.totalDef);
        this.hp -= actualDamage;
        if (this.hp < 0) this.hp = 0;
        return actualDamage;
    }

    // === НОВОЕ: Атака с направлением ===
    attack(enemies) {
        if (this.attackCooldown > 0) return null;
        this.attackCooldown = CONSTANTS.ATTACK_COOLDOWN;

        let closestEnemy = null;
        let minDistance = CONSTANTS.ATTACK_RANGE;

        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.hypot(dx, dy);
            if (distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        }

        // === НОВОЕ: Запускаем анимацию атаки ===
        let attackAngle = this.getDirectionAngle(); // По умолчанию — направление персонажа
        if (closestEnemy) {
            // Направление на врага
            attackAngle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
        }
        this.startAttackAnimation(attackAngle);

        if (closestEnemy) {
            const damage = this.totalAtk;
            const killed = closestEnemy.takeDamage(damage);
            return { enemy: closestEnemy, damage: damage, killed: killed };
        }
        return null;
    }

    // === НОВОЕ: Получить угол направления персонажа ===
    getDirectionAngle() {
        switch (this.direction) {
            case 'up': return -Math.PI / 2;
            case 'down': return Math.PI / 2;
            case 'left': return Math.PI;
            case 'right': return 0;
            default: return 0;
        }
    }

    // === НОВОЕ: Запуск анимации атаки ===
    startAttackAnimation(angle) {
        this.attackAnimation = {
            active: true,
            progress: 0,
            duration: 18, // кадров
            angle: angle
        };
    }

    // === ОБНОВЛЁННЫЙ update: регенерация + анимация ===
    update() {
        if (this.attackCooldown > 0) this.attackCooldown--;

        // Обновление анимации атаки
        if (this.attackAnimation && this.attackAnimation.active) {
            this.attackAnimation.progress++;
            if (this.attackAnimation.progress >= this.attackAnimation.duration) {
                this.attackAnimation.active = false;
                this.attackAnimation = null;
            }
        }

        // Пассивная регенерация HP/MP
        this.regenTimer++;
        if (this.regenTimer >= this.REGEN_INTERVAL) {
            this.regenTimer = 0;
            if (this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.REGEN_HP);
            if (this.mp < this.maxMp) this.mp = Math.min(this.maxMp, this.mp + this.REGEN_MP);
        }
    }
    tryInteract(location, game) {
        for (const entity of location.entities) {
            if (entity instanceof NPC || entity instanceof Portal) {
                const dx = entity.x - this.x;
                const dy = entity.y - this.y;
                const distance = Math.hypot(dx, dy);
                if (distance < CONSTANTS.INTERACT_RANGE) {
                    entity.interact(this, game);
                    return true;
                }
            }
        }
        return false;
    }
        // === НОВОЕ: Методы сохранения ===
        saveToJSON() {
            return {
                x: this.x,
                y: this.y,
                direction: this.direction,
                level: this.level,
                xp: this.xp,
                maxXp: this.maxXp,
                statPoints: this.statPoints,
                skillPoints: this.skillPoints,
                str: this.str,
                agi: this.agi,
                int: this.int,
                vit: this.vit,
                skills: this.skills,
                inventory: this.inventory,
                equipment: this.equipment,
                storage: this.storage,
                activeQuests: this.activeQuests,
                hp: this.hp,
                mp: this.mp,
                gold: this.gold
            };
        }

        loadFromJSON(data) {
            Object.assign(this, data);
        }
    
}
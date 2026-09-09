class UIManager {
    constructor(player) {
        this.player = player;
        this.activePanel = null;
    }

    toggle(panelId) {
        const panel = document.getElementById(panelId);
        const isHidden = panel.classList.contains('hidden');
        document.querySelectorAll('.game-panel').forEach(p => p.classList.add('hidden'));
        if (isHidden) {
            panel.classList.remove('hidden');
            this.activePanel = panelId;
            this.render(panelId);
        } else {
            this.activePanel = null;
        }
    }

    render(panelId) {
        if (panelId === 'panel-inventory') this.renderInventory();
        if (panelId === 'panel-stats') this.renderStats();
        if (panelId === 'panel-skills') this.renderSkills();
    }

    renderInventory() {
        const container = document.getElementById('inventory-list');
        container.innerHTML = '';
        if (this.player.inventory.length === 0) {
            container.innerHTML = '<p>Пусто</p>';
            return;
        }
        this.player.inventory.forEach(itemSlot => {
            const item = CONSTANTS.ITEMS[itemSlot.id];
            const div = document.createElement('div');
            div.className = 'item-slot';
            div.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-info">
                    <div class="item-name">${item.name} x${itemSlot.count}</div>
                    <div class="item-desc">${item.desc}</div>
                </div>
                <button class="btn-use">${item.type === 'consumable' ? 'Исп.' : 'Надеть'}</button>
            `;
            div.querySelector('.btn-use').onclick = () => {
                this.player.useItem(item.id);
                this.renderInventory();
                window.gameInstance.updateHUD();
            };
            container.appendChild(div);
        });
    }

    renderStats() {
        const p = this.player;
        document.getElementById('stat-str').textContent = p.str;
        document.getElementById('stat-agi').textContent = p.agi;
        document.getElementById('stat-int').textContent = p.int;
        document.getElementById('stat-vit').textContent = p.vit;
        document.getElementById('stat-points').textContent = p.statPoints;
        document.getElementById('derived-hp').textContent = p.maxHp;
        document.getElementById('derived-mp').textContent = p.maxMp;
        document.getElementById('derived-atk').textContent = p.totalAtk;
        document.getElementById('derived-def').textContent = p.totalDef;
    }

    renderSkills() {
        document.getElementById('skill-points-display').textContent = this.player.skillPoints;
        const container = document.getElementById('skills-list');
        container.innerHTML = '';
        for (const [skillId, skillData] of Object.entries(CONSTANTS.SKILLS)) {
            const currentLevel = this.player.skills[skillId];
            const canUpgrade = this.player.skillPoints >= skillData.costPerLevel && currentLevel < skillData.maxLevel;
            const div = document.createElement('div');
            div.className = 'skill-node';
            div.innerHTML = `
                <div class="skill-icon">${skillData.icon}</div>
                <div class="skill-info">
                    <div class="skill-name">${skillData.name} (${currentLevel}/${skillData.maxLevel})</div>
                    <div class="skill-desc">${skillData.desc}</div>
                </div>
                <button class="btn-upgrade" ${canUpgrade ? '' : 'disabled'}>Прокачать</button>
            `;
            div.querySelector('.btn-upgrade').onclick = () => {
                this.player.upgradeSkill(skillId);
                this.renderSkills();
            };
            container.appendChild(div);
        }
    }

    updateHUD() {
        const p = this.player;
        document.getElementById('hp').textContent = Math.floor(p.hp);
        document.getElementById('hpMax').textContent = p.maxHp;
        document.getElementById('lvl').textContent = p.level;
        document.getElementById('gold').textContent = p.gold;
        const xpPercent = (p.xp / p.maxXp) * 100;
        document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;
        document.getElementById('xp-text').textContent = `${p.xp} / ${p.maxXp} XP`;
    }
    // === NPC ДИАЛОГ ===
    openNPCDialog(npc) {
        const panel = document.getElementById('panel-npc');
        document.getElementById('npc-name').textContent = npc.name;

        const options = document.getElementById('npc-options');
        options.innerHTML = '';

        // Опции в зависимости от типа NPC
        if (npc.type === 'mage' || npc.type === 'smith') {
            const shopBtn = document.createElement('button');
            shopBtn.textContent = '🏪 Открыть магазин';
            shopBtn.onclick = () => this.openShop(npc.type);
            options.appendChild(shopBtn);
        }

        if (npc.type === 'mage' || npc.type === 'elder') {
            const questBtn = document.createElement('button');
            questBtn.textContent = '📜 Взять квест';
            questBtn.onclick = () => this.openQuestDialog(npc.type);
            options.appendChild(questBtn);
        }

        if (npc.type === 'keeper') {
            const storageBtn = document.createElement('button');
            storageBtn.textContent = '📦 Открыть хранилище';
            storageBtn.onclick = () => this.openStorage();
            options.appendChild(storageBtn);
        }

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Уйти';
        closeBtn.className = 'btn-close';
        closeBtn.onclick = () => this.closePanel('panel-npc');
        options.appendChild(closeBtn);

        panel.classList.remove('hidden');
        this.activePanel = 'panel-npc';
    }

    // === МАГАЗИН ===
    openShop(shopType) {
        const panel = document.getElementById('panel-shop');
        const list = document.getElementById('shop-list');
        list.innerHTML = '';

        const itemIds = CONSTANTS.SHOP_ITEMS[shopType];
        itemIds.forEach(itemId => {
            const item = CONSTANTS.ITEMS[itemId];
            const div = document.createElement('div');
            div.className = 'item-slot';
            div.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-desc">${item.desc}</div>
                </div>
                <div class="item-price">💰 ${item.price}</div>
                <button class="btn-use">Купить</button>
            `;
            div.querySelector('.btn-use').onclick = () => {
                if (this.player.gold >= item.price) {
                    this.player.gold -= item.price;
                    this.player.addItem(itemId);
                    this.updateHUD();
                    alert(`Куплено: ${item.name}`);
                } else {
                    alert('Недостаточно золота!');
                }
            };
            list.appendChild(div);
        });

        panel.classList.remove('hidden');
        this.activePanel = 'panel-shop';
    }

    // === КВЕСТЫ ===
    openQuestDialog(npcType) {
        const panel = document.getElementById('panel-quests');
        const list = document.getElementById('quest-list');
        list.innerHTML = '';

        // Находим квесты для этого NPC
        const availableQuests = Object.values(CONSTANTS.QUESTS).filter(q => q.giver === npcType);

        availableQuests.forEach(quest => {
            const activeQuest = this.player.activeQuests?.find(q => q.id === quest.id);
            const div = document.createElement('div');
            div.className = 'item-slot';

            if (activeQuest) {
                // Активный квест
                const progress = activeQuest.progress || 0;
                const completed = progress >= quest.targetCount;
                div.innerHTML = `
                    <div class="item-info">
                        <div class="item-name">${quest.name}</div>
                        <div class="item-desc">${quest.description}</div>
                        <div style="color: ${completed ? '#2ecc71' : '#f39c12'};">
                            Прогресс: ${progress}/${quest.targetCount} ${completed ? '✅' : ''}
                        </div>
                    </div>
                    ${completed ? '<button class="btn-use">Сдать</button>' : ''}
                `;
                if (completed) {
                    div.querySelector('.btn-use').onclick = () => {
                        this.player.gold += quest.reward.gold;
                        this.player.gainXp(quest.reward.xp);
                        this.player.activeQuests = this.player.activeQuests.filter(q => q.id !== quest.id);
                        this.updateHUD();
                        alert(`Квест выполнен! +${quest.reward.gold}💰 +${quest.reward.xp}⭐`);
                        this.openQuestDialog(npcType);
                    };
                }
            } else {
                // Доступный квест
                div.innerHTML = `
                    <div class="item-info">
                        <div class="item-name">${quest.name}</div>
                        <div class="item-desc">${quest.description}</div>
                        <div style="color: #aaa;">Награда: ${quest.reward.gold}💰 ${quest.reward.xp}⭐</div>
                    </div>
                    <button class="btn-use">Взять</button>
                `;
                div.querySelector('.btn-use').onclick = () => {
                    if (!this.player.activeQuests) this.player.activeQuests = [];
                    this.player.activeQuests.push({ id: quest.id, progress: 0 });
                    alert(`Квест принят: ${quest.name}`);
                    this.openQuestDialog(npcType);
                };
            }
            list.appendChild(div);
        });

        if (availableQuests.length === 0) {
            list.innerHTML = '<p>Нет доступных квестов</p>';
        }

        panel.classList.remove('hidden');
        this.activePanel = 'panel-quests';
    }

    // === ХРАНИЛИЩЕ ===
    openStorage() {
        const panel = document.getElementById('panel-storage');
        const storageList = document.getElementById('storage-list');
        storageList.innerHTML = '';

        if (!this.player.storage) this.player.storage = [];

        if (this.player.storage.length === 0) {
            storageList.innerHTML = '<p>Хранилище пусто</p>';
        } else {
            this.player.storage.forEach(itemSlot => {
                const item = CONSTANTS.ITEMS[itemSlot.id];
                const div = document.createElement('div');
                div.className = 'item-slot';
                div.innerHTML = `
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-info">
                        <div class="item-name">${item.name} x${itemSlot.count}</div>
                    </div>
                    <button class="btn-use">Забрать</button>
                `;
                div.querySelector('.btn-use').onclick = () => {
                    this.player.addItem(itemSlot.id, itemSlot.count);
                    this.player.storage = this.player.storage.filter(s => s.id !== itemSlot.id);
                    this.openStorage();
                };
                storageList.appendChild(div);
            });
        }

        // Кнопка "Положить из инвентаря"
        const depositBtn = document.createElement('button');
        depositBtn.textContent = '📥 Положить из инвентаря';
        depositBtn.className = 'btn-close';
        depositBtn.style.marginTop = '10px';
        depositBtn.onclick = () => this.openDepositDialog();
        storageList.parentElement.insertBefore(depositBtn, storageList.nextSibling);

        panel.classList.remove('hidden');
        this.activePanel = 'panel-storage';
    }

    openDepositDialog() {
        const panel = document.getElementById('panel-deposit');
        const list = document.getElementById('deposit-list');
        list.innerHTML = '';

        if (this.player.inventory.length === 0) {
            list.innerHTML = '<p>Инвентарь пуст</p>';
        } else {
            this.player.inventory.forEach(itemSlot => {
                const item = CONSTANTS.ITEMS[itemSlot.id];
                const div = document.createElement('div');
                div.className = 'item-slot';
                div.innerHTML = `
                    <div class="item-icon">${item.icon}</div>
                    <div class="item-info">
                        <div class="item-name">${item.name} x${itemSlot.count}</div>
                    </div>
                    <button class="btn-use">Положить</button>
                `;
                div.querySelector('.btn-use').onclick = () => {
                    if (!this.player.storage) this.player.storage = [];
                    const existing = this.player.storage.find(s => s.id === itemSlot.id);
                    if (existing) {
                        existing.count += itemSlot.count;
                    } else {
                        this.player.storage.push({ id: itemSlot.id, count: itemSlot.count });
                    }
                    this.player.removeItem(itemSlot.id, itemSlot.count);
                    this.openDepositDialog();
                };
                list.appendChild(div);
            });
        }

        panel.classList.remove('hidden');
        this.activePanel = 'panel-deposit';
    }

    closePanel(panelId) {
        document.getElementById(panelId).classList.add('hidden');
        this.activePanel = null;
    }
}
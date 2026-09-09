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
            container.innerHTML = '<p class="empty-text">Инвентарь пуст</p>';
            return;
        }
        this.player.inventory.forEach(itemSlot => {
            const item = CONSTANTS.ITEMS[itemSlot.id];
            const div = document.createElement('div');
            div.className = 'item-slot';
            div.innerHTML = `
                <div class="item-icon">${item.icon}</div>
                <div class="item-info">
                    <div class="item-name">${item.name} ${itemSlot.count > 1 ? `x${itemSlot.count}` : ''}</div>
                    <div class="item-desc">${item.desc}</div>
                </div>
                <button class="btn-use" onclick="window.gameInstance.ui.useItem('${item.id}')">
                    ${item.type === 'consumable' ? 'Исп.' : 'Надеть'}
                </button>
            `;
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
            div.className = `skill-node ${currentLevel >= skillData.maxLevel ? 'maxed' : ''}`;
            div.innerHTML = `
                <div class="skill-icon">${skillData.icon}</div>
                <div class="skill-info">
                    <div class="skill-name">${skillData.name} (Ур. ${currentLevel}/${skillData.maxLevel})</div>
                    <div class="skill-desc">${skillData.desc}</div>
                </div>
                ${currentLevel < skillData.maxLevel ? `
                    <button class="btn-upgrade" ${canUpgrade ? '' : 'disabled'} 
                            onclick="window.gameInstance.ui.upgradeSkill('${skillId}')">
                        Прокачать
                    </button>
                ` : '<span class="maxed-text">МАКС</span>'}
            `;
            container.appendChild(div);
        }
    }

    useItem(itemId) {
        this.player.useItem(itemId);
        this.render('panel-inventory');
        window.gameInstance.updateHUD();
    }
    allocateStat(statName) {
        this.player.allocateStat(statName);
        this.render('panel-stats');
        window.gameInstance.updateHUD();
    }
    upgradeSkill(skillId) {
        this.player.upgradeSkill(skillId);
        this.render('panel-skills');
        window.gameInstance.updateHUD();
    }
    
    // Новый метод для обновления HUD (включая XP)
    updateHUD() {
        const p = this.player;
        document.getElementById('hp').textContent = Math.floor(p.hp);
        document.getElementById('hpMax').textContent = p.maxHp;
        document.getElementById('lvl').textContent = p.level;
        document.getElementById('gold').textContent = p.gold || 0;
        
        // Обновление XP бара
        const xpPercent = (p.xp / p.maxXp) * 100;
        document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;
        document.getElementById('xp-text').textContent = `${p.xp} / ${p.maxXp} XP`;
    }
}
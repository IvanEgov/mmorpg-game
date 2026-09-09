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
}
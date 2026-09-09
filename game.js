// ============ КОНСТАНТЫ ============
const TILE = 32;
const W = 30, H = 20; // размер карты в тайлах (960/32 x 640/32)
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Типы тайлов
const T = {
  FLOOR: 0, WALL: 1, GRASS: 2, ROAD: 3,
  DOOR: 4, WATER: 5, DUNGEON_FLOOR: 6, DUNGEON_WALL: 7
};

// ============ СОСТОЯНИЕ ИГРЫ ============
const Game = {
  state: 'city', // city | dungeon
  currentDungeonLevel: 1,
  map: [],
  entities: [],
  player: null,
  camera: { x: 0, y: 0 },
  keys: {},
  npcs: [],
  teleports: [],
  storage: [], // глобальное хранилище
  quests: [],
  time: 0,

  // ============ ИНИЦИАЛИЗАЦИЯ ============
  init() {
    this.player = new Player(W/2 * TILE, H/2 * TILE);
    this.loadCity();
    this.setupInput();
    this.loop();
  },

  // ============ ГЕНЕРАЦИЯ ГОРОДА ============
  loadCity() {
    this.state = 'city';
    this.entities = [];
    this.npcs = [];
    this.teleports = [];
    document.getElementById('loc').textContent = '🏰 Город Элдория';

    // Простая карта города
    const map = [];
    for (let y = 0; y < H; y++) {
      map[y] = [];
      for (let x = 0; x < W; x++) {
        if (x === 0 || y === 0 || x === W-1 || y === H-1) map[y][x] = T.WALL;
        else map[y][x] = T.GRASS;
      }
    }
    // Дороги крестом
    for (let x = 1; x < W-1; x++) map[H/2|0][x] = T.ROAD;
    for (let y = 1; y < H-1; y++) map[y][W/2|0] = T.ROAD;
    // Фонтан в центре
    map[H/2|0][W/2|0] = T.WATER;

    this.map = map;

    // NPC
    this.npcs.push(new NPC(5*TILE, 5*TILE, '🧙 Маг Элрин', 'mage', [
      { text: 'Приветствую, герой! Убей 5 слаймов в подземелье.', type: 'quest', quest: 'kill_slimes' },
      { text: 'Загляни в мою лавку!', type: 'shop' }
    ]));
    this.npcs.push(new NPC(24*TILE, 5*TILE, '⚒️ Кузнец Бром', 'smith', [
      { text: 'Лучшее оружие в городе!', type: 'shop' }
    ]));
    this.npcs.push(new NPC(5*TILE, 14*TILE, '📦 Хранитель', 'keeper', [
      { text: 'Здесь ты можешь оставить вещи.', type: 'storage' }
    ]));
    this.npcs.push(new NPC(24*TILE, 14*TILE, '👑 Старейшина', 'elder', [
      { text: 'Тьма наступает... Спаси нас, герой!', type: 'dialog' }
    ]));

    // Телепорты в данжи
    this.teleports.push(new Teleport(W/2*TILE, 2*TILE, 1, '🕳️ Подземелье ур.1 (Слаймы)'));
    this.teleports.push(new Teleport(2*TILE, H/2*TILE, 2, '🕳️ Катакомбы ур.2 (Скелеты)'));
    this.teleports.push(new Teleport(W-3*TILE, H/2*TILE, 3, '🕳️ Пещера ур.3 (Орки)'));

    this.entities.push(...this.npcs, ...this.teleports);
    this.player.x = W/2 * TILE;
    this.player.y = H/2 * TILE + TILE;
  },

  // ============ ГЕНЕРАЦИЯ ДАНЖА ============
  loadDungeon(level) {
    this.state = 'dungeon';
    this.currentDungeonLevel = level;
    this.entities = [];
    this.npcs = [];
    this.teleports = [];
    document.getElementById('loc').textContent = `⚔️ Данж ур.${level}`;

    const gen = new DungeonGenerator(W, H, level);
    this.map = gen.generate();
    this.entities = gen.entities;

    // Старт игрока в первой комнате
    const start = gen.rooms[0];
    this.player.x = (start.x + start.w/2) * TILE;
    this.player.y = (start.y + start.h/2) * TILE;

    // Телепорт назад в город
    this.teleports.push(new Teleport(
      (start.x + 1) * TILE, (start.y + 1) * TILE,
      0, '🏰 В город', true
    ));
    this.entities.push(...this.teleports);
  },

  // ============ ВВОД ============
  setupInput() {
    window.addEventListener('keydown', e => {
      this.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'i') this.togglePanel('inventory');
      if (e.key.toLowerCase() === 'q') this.togglePanel('quests');
      if (e.key === 'e') this.interact();
    });
    window.addEventListener('keyup', e => {
      this.keys[e.key.toLowerCase()] = false;
    });
  },

  interact() {
    // Ищем ближайший интерактивный объект
    for (const e of this.entities) {
      const dx = e.x - this.player.x, dy = e.y - this.player.y;
      if (Math.hypot(dx, dy) < TILE * 1.3) {
        if (e instanceof NPC) return this.openDialog(e);
        if (e instanceof Teleport) return this.useTeleport(e);
      }
    }
  },

  useTeleport(t) {
    if (t.toCity) this.loadCity();
    else this.loadDungeon(t.level);
  },

  // ============ ПАНЕЛИ UI ============
  openDialog(npc) {
    const panel = document.getElementById('dialog');
    document.getElementById('dialogTitle').textContent = npc.name;
    const btns = document.getElementById('dialogButtons');
    btns.innerHTML = '';
    document.getElementById('dialogText').textContent = npc.lines[0].text;

    npc.lines.forEach(line => {
      const b = document.createElement('button');
      b.textContent = line.text;
      b.onclick = () => {
        if (line.type === 'shop') this.openShop(npc);
        else if (line.type === 'storage') this.openStorage();
        else if (line.type === 'quest') this.acceptQuest(line.quest);
        this.closePanel('dialog');
      };
      btns.appendChild(b);
    });
    const close = document.createElement('button');
    close.textContent = 'Уйти';
    close.onclick = () => this.closePanel('dialog');
    btns.appendChild(close);

    panel.classList.remove('hidden');
  },

  openShop(npc) {
    const list = document.getElementById('shopList');
    list.innerHTML = '';
    const items = npc.type === 'mage' ? SHOP_ITEMS.magic : SHOP_ITEMS.smith;
    items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `<span>${it.icon} ${it.name} — 💰${it.price}</span>`;
      const btn = document.createElement('button');
      btn.textContent = 'Купить';
      btn.onclick = () => {
        if (this.player.gold >= it.price) {
          this.player.gold -= it.price;
          this.player.inventory.push({...it});
          this.updateHUD();
          alert(`Куплено: ${it.name}`);
        } else alert('Недостаточно золота!');
      };
      row.appendChild(btn);
      list.appendChild(row);
    });
    document.getElementById('shop').classList.remove('hidden');
  },

  openInventory() { this.renderList('invList', this.player.inventory, true); document.getElementById('inventory').classList.remove('hidden'); },
  openStorage() { this.renderList('storList', this.storage, false, true); document.getElementById('storage').classList.remove('hidden'); },
  openQuests() {
    const list = document.getElementById('questList');
    list.innerHTML = '';
    if (this.quests.length === 0) list.innerHTML = '<p>Нет активных квестов</p>';
    this.quests.forEach(q => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `<span>${q.name}: ${q.progress}/${q.target}</span>`;
      if (q.progress >= q.target) {
        const btn = document.createElement('button');
        btn.textContent = 'Сдать';
        btn.onclick = () => {
          this.player.gold += q.reward;
          this.player.xp += q.xpReward || 0;
          this.quests = this.quests.filter(x => x !== q);
          this.updateHUD();
          this.openQuests();
          alert(`Квест выполнен! +${q.reward}💰 +${q.xpReward}⭐`);
        };
        row.appendChild(btn);
      }
      list.appendChild(row);
    });
    document.getElementById('quests').classList.remove('hidden');
  },

  renderList(id, arr, equip, isStorage) {
    const list = document.getElementById(id);
    list.innerHTML = '';
    if (arr.length === 0) list.innerHTML = '<p>Пусто</p>';
    arr.forEach((it, i) => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `<span>${it.icon} ${it.name} ${it.atk ? '(+'+it.atk+' атк)' : it.def ? '(+'+it.def+' защ)' : ''}</span>`;
      if (equip && (it.atk || it.def)) {
        const b = document.createElement('button');
        b.textContent = 'Надеть';
        b.onclick = () => { this.player.equip(it); this.openInventory(); };
        row.appendChild(b);
      }
      if (it.heal) {
        const b = document.createElement('button');
        b.textContent = 'Использовать';
        b.onclick = () => {
          this.player.hp = Math.min(this.player.hpMax, this.player.hp + it.heal);
          arr.splice(i, 1); this.updateHUD();
          if (isStorage) this.openStorage(); else this.openInventory();
        };
        row.appendChild(b);
      }
      const move = document.createElement('button');
      move.textContent = isStorage ? 'Забрать' : 'В хранилище';
      move.onclick = () => {
        if (isStorage) { this.player.inventory.push(arr.splice(i,1)[0]); }
        else { this.storage.push(arr.splice(i,1)[0]); }
        if (isStorage) this.openStorage(); else this.openInventory();
      };
      row.appendChild(move);
      list.appendChild(row);
    });
  },

  acceptQuest(id) {
    if (this.quests.find(q => q.id === id)) return alert('Квест уже взят');
    if (id === 'kill_slimes') {
      this.quests.push({ id, name: 'Охота на слаймов', progress: 0, target: 5, reward: 100, xpReward: 50 });
      alert('Квест принят!');
    }
  },

  closePanel(id) { document.getElementById(id).classList.add('hidden'); },
  togglePanel(id) {
    const el = document.getElementById(id);
    el.classList.contains('hidden') ?
      (id === 'inventory' ? this.openInventory() : this.openQuests()) :
      this.closePanel(id);
  },

  respawn() {
    this.player.hp = this.player.hpMax;
    this.player.mp = this.player.mpMax;
    this.loadCity();
    document.getElementById('death').classList.add('hidden');
  },

  // ============ HUD ============
  updateHUD() {
    document.getElementById('hp').textContent = Math.max(0, Math.floor(this.player.hp));
    document.getElementById('hpMax').textContent = this.player.hpMax;
    document.getElementById('mp').textContent = this.player.mp;
    document.getElementById('mpMax').textContent = this.player.mpMax;
    document.getElementById('lvl').textContent = this.player.level;
    document.getElementById('gold').textContent = this.player.gold;
  },

  // ============ ГЛАВНЫЙ ЦИКЛ ============
  loop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  },

  update() {
    this.time++;
    if (document.querySelector('.panel:not(.hidden)')) return; // пауза в меню

    // Движение игрока
    const sp = 3;
    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['ц']) dy -= sp;
    if (this.keys['s'] || this.keys['ы']) dy += sp;
    if (this.keys['a'] || this.keys['ф']) dx -= sp;
    if (this.keys['d'] || this.keys['в']) dx += sp;
    this.player.tryMove(dx, dy, this.map);

    // Обновление сущностей
    for (const e of this.entities) if (e.update) e.update(this);

    // Подсказка
    const hint = document.getElementById('hint');
    let hintText = '';
    for (const e of this.entities) {
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < TILE * 1.3) {
        if (e instanceof NPC) hintText = `[E] Поговорить с ${e.name}`;
        else if (e instanceof Teleport) hintText = `[E] ${e.label}`;
      }
    }
    if (hintText) { hint.textContent = hintText; hint.classList.remove('hidden'); }
    else hint.classList.add('hidden');

    // Смерть
    if (this.player.hp <= 0) {
      document.getElementById('death').classList.remove('hidden');
    }

    this.updateHUD();
  },

  // ============ РЕНДЕР ============
  render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Тайлы
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        ctx.fillStyle = this.tileColor(this.map[y][x]);
        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
        if (this.map[y][x] === T.WALL || this.map[y][x] === T.DUNGEON_WALL) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x*TILE, y*TILE+TILE-4, TILE, 4);
        }
      }
    }

    // Сущности
    for (const e of this.entities) e.render(ctx);
    this.player.render(ctx);

    // HP-бары врагов
    for (const e of this.entities) {
      if (e instanceof Enemy && e.hp > 0) {
        ctx.fillStyle = '#500';
        ctx.fillRect(e.x - 16, e.y - 22, 32, 4);
        ctx.fillStyle = '#f44';
        ctx.fillRect(e.x - 16, e.y - 22, 32 * (e.hp/e.maxHp), 4);
      }
    }
  },

  tileColor(t) {
    return {
      [T.FLOOR]: '#3a3a4e', [T.WALL]: '#555',
      [T.GRASS]: '#2d5a3d', [T.ROAD]: '#8a7a5a',
      [T.DOOR]: '#6a4a2a', [T.WATER]: '#2a5a8a',
      [T.DUNGEON_FLOOR]: '#2a2a3e', [T.DUNGEON_WALL]: '#1a1a2a'
    }[t];
  }
};

// ============ КЛАССЫ ============
class Entity {
  constructor(x, y) { this.x = x; this.y = y; this.size = TILE * 0.8; }
  render(ctx) {}
  update() {}
}

class Player extends Entity {
  constructor(x, y) {
    super(x, y);
    this.hp = 100; this.hpMax = 100;
    this.mp = 50; this.mpMax = 50;
    this.level = 1; this.xp = 0;
    this.gold = 50;
    this.atk = 10; this.def = 2;
    this.inventory = [{ name: 'Зелье HP', icon: '🧪', heal: 30 }];
    this.equipment = { weapon: null, armor: null };
    this.attackCooldown = 0;
  }
  tryMove(dx, dy, map) {
    const nx = this.x + dx, ny = this.y + dy;
    const tx = Math.floor((nx + TILE/2) / TILE);
    const ty = Math.floor((ny + TILE/2) / TILE);
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return;
    const t = map[ty][tx];
    if (t === T.WALL || t === T.DUNGEON_WALL || t === T.WATER) return;
    this.x = nx; this.y = ny;
    if (this.attackCooldown > 0) this.attackCooldown--;
    this.attack();
  }
  attack() {
    if (this.attackCooldown > 0) return;
    for (const e of Game.entities) {
      if (e instanceof Enemy && e.hp > 0) {
        if (Math.hypot(e.x - this.x, e.y - this.y) < TILE * 1.2) {
          const dmg = Math.max(1, this.atk + (this.equipment.weapon?.atk || 0) - Math.random()*3);
          e.hp -= dmg;
          e.hitFlash = 5;
          this.attackCooldown = 15;
          if (e.hp <= 0) this.onKill(e);
          return;
        }
      }
    }
  }
  onKill(enemy) {
    this.gold += enemy.goldDrop;
    this.xp += enemy.xpDrop;
    // Квест
    Game.quests.forEach(q => {
      if (q.id === 'kill_slimes' && enemy.type === 'slime') q.progress++;
    });
    // Лут
    if (Math.random() < enemy.lootChance) {
      const item = LOOT_TABLE[enemy.type][Math.floor(Math.random() * LOOT_TABLE[enemy.type].length)];
      this.inventory.push({...item});
    }
    // Уровень
    while (this.xp >= this.level * 100) {
      this.xp -= this.level * 100;
      this.level++;
      this.hpMax += 20; this.hp = this.hpMax;
      this.mpMax += 10; this.mp = this.mpMax;
      this.atk += 3; this.def += 1;
    }
    // Босс убит → появляется телепорт
    if (enemy.isBoss) {
      const t = new Teleport(enemy.x, enemy.y, 0, '🏆 Выход (в город)', true);
      Game.teleports.push(t);
      Game.entities.push(t);
      this.gold += 200;
    }
  }
  equip(item) {
    if (item.atk) {
      if (this.equipment.weapon) this.inventory.push(this.equipment.weapon);
      this.equipment.weapon = item;
      this.inventory = this.inventory.filter(i => i !== item);
    } else if (item.def) {
      if (this.equipment.armor) this.inventory.push(this.equipment.armor);
      this.equipment.armor = item;
      this.inventory = this.inventory.filter(i => i !== item);
    }
  }
  render(ctx) {
    ctx.fillStyle = '#4af';
    ctx.beginPath();
    ctx.arc(this.x + TILE/2, this.y + TILE/2, TILE/2 - 4, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🦸', this.x + TILE/2, this.y + TILE/2 + 7);
  }
}

class NPC extends Entity {
  constructor(x, y, name, type, lines) {
    super(x, y); this.name = name; this.type = type; this.lines = lines;
  }
  render(ctx) {
    ctx.fillStyle = '#fc4';
    ctx.beginPath();
    ctx.arc(this.x + TILE/2, this.y + TILE/2, TILE/2 - 4, 0, Math.PI*2);
    ctx.fill();
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.name.split(' ')[0], this.x + TILE/2, this.y + TILE/2 + 7);
    // Индикатор "!"
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('!', this.x + TILE/2, this.y - 4);
  }
}

class Enemy extends Entity {
  constructor(x, y, type, level) {
    super(x, y);
    this.type = type;
    const stats = ENEMY_STATS[type];
    this.hp = stats.hp * level;
    this.maxHp = this.hp;
    this.atk = stats.atk * level;
    this.goldDrop = stats.gold * level;
    this.xpDrop = stats.xp * level;
    this.lootChance = stats.loot;
    this.speed = stats.speed;
    this.moveTimer = 0;
    this.hitFlash = 0;
  }
  update(game) {
    if (this.hp <= 0) return;
    if (this.hitFlash > 0) this.hitFlash--;
    const dx = game.player.x - this.x, dy = game.player.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < TILE * 6 && d > TILE * 0.8) {
      const nx = this.x + dx/d * this.speed;
      const ny = this.y + dy/d * this.speed;
      const tx = Math.floor((nx + TILE/2) / TILE);
      const ty = Math.floor((ny + TILE/2) / TILE);
      if (game.map[ty] && game.map[ty][tx] !== T.WALL && game.map[ty][tx] !== T.DUNGEON_WALL) {
        this.x = nx; this.y = ny;
      }
    }
    // Атака
    if (d < TILE * 1.1) {
      this.moveTimer++;
      if (this.moveTimer > 30) {
        const dmg = Math.max(1, this.atk - game.player.def - (game.player.equipment.armor?.def || 0));
        game.player.hp -= dmg;
        this.moveTimer = 0;
      }
    }
  }
  render(ctx) {
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : ENEMY_STATS[this.type].color;
    ctx.beginPath();
    ctx.arc(this.x + TILE/2, this.y + TILE/2, TILE/2 - 4, 0, Math.PI*2);
    ctx.fill();
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ENEMY_STATS[this.type].icon, this.x + TILE/2, this.y + TILE/2 + 7);
  }
}

class Boss extends Enemy {
  constructor(x, y, type, level) {
    super(x, y, type, level);
    this.isBoss = true;
    this.hp *= 5; this.maxHp = this.hp;
    this.atk *= 2;
    this.size = TILE * 1.4;
  }
  render(ctx) {
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#a22';
    ctx.beginPath();
    ctx.arc(this.x + TILE/2, this.y + TILE/2, TILE/1.5, 0, Math.PI*2);
    ctx.fill();
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ENEMY_STATS[this.type].icon, this.x + TILE/2, this.y + TILE/2 + 9);
    ctx.fillStyle = '#ff0';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('БОСС', this.x + TILE/2, this.y - 8);
  }
}

class Teleport extends Entity {
  constructor(x, y, level, label, toCity = false) {
    super(x, y); this.level = level; this.label = label; this.toCity = toCity;
  }
  render(ctx) {
    const pulse = Math.sin(Game.time * 0.1) * 4;
    ctx.fillStyle = this.toCity ? '#4f4' : '#a4f';
    ctx.beginPath();
    ctx.arc(this.x + TILE/2, this.y + TILE/2, TILE/2 + pulse, 0, Math.PI*2);
    ctx.fill();
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌀', this.x + TILE/2, this.y + TILE/2 + 7);
  }
}

// ============ ГЕНЕРАТОР ДАНЖА ============
class DungeonGenerator {
  constructor(w, h, level) {
    this.w = w; this.h = h; this.level = level;
    this.rooms = [];
    this.entities = [];
  }
  generate() {
    const map = [];
    for (let y = 0; y < this.h; y++) {
      map[y] = [];
      for (let x = 0; x < this.w; x++) map[y][x] = T.DUNGEON_WALL;
    }
    // Комнаты
    const roomCount = 5 + this.level;
    for (let i = 0; i < roomCount * 10; i++) {
      if (this.rooms.length >= roomCount) break;
      const rw = 4 + Math.floor(Math.random() * 4);
      const rh = 4 + Math.floor(Math.random() * 3);
      const rx = 1 + Math.floor(Math.random() * (this.w - rw - 2));
      const ry = 1 + Math.floor(Math.random() * (this.h - rh - 2));
      if (this.rooms.some(r =>
        rx < r.x + r.w + 1 && rx + rw + 1 > r.x &&
        ry < r.y + r.h + 1 && ry + rh + 1 > r.y)) continue;
      this.rooms.push({ x: rx, y: ry, w: rw, h: rh });
      for (let y = ry; y < ry + rh; y++)
        for (let x = rx; x < rx + rw; x++) map[y][x] = T.DUNGEON_FLOOR;
    }
    // Коридоры
    for (let i = 1; i < this.rooms.length; i++) {
      const a = this.rooms[i-1], b = this.rooms[i];
      const ax = a.x + (a.w/2|0), ay = a.y + (a.h/2|0);
      const bx = b.x + (b.w/2|0), by = b.y + (b.h/2|0);
      for (let x = Math.min(ax,bx); x <= Math.max(ax,bx); x++) map[ay][x] = T.DUNGEON_FLOOR;
      for (let y = Math.min(ay,by); y <= Math.max(ay,by); y++) map[y][bx] = T.DUNGEON_FLOOR;
    }
    // Мобы в комнатах (кроме первой)
    const types = DUNGEON_LEVELS[this.level];
    for (let i = 1; i < this.rooms.length; i++) {
      const r = this.rooms[i];
      const count = 2 + Math.floor(Math.random() * 3);
      for (let k = 0; k < count; k++) {
        const ex = (r.x + 1 + Math.floor(Math.random() * (r.w - 2))) * TILE;
        const ey = (r.y + 1 + Math.floor(Math.random() * (r.h - 2))) * TILE;
        const type = types.mobs[Math.floor(Math.random() * types.mobs.length)];
        this.entities.push(new Enemy(ex, ey, type, this.level));
      }
    }
    // Босс в последней комнате
    const last = this.rooms[this.rooms.length - 1];
    const bx = (last.x + last.w/2) * TILE;
    const by = (last.y + last.h/2) * TILE;
    this.entities.push(new Boss(bx, by, types.boss, this.level));
    return map;
  }
}

// ============ ДАННЫЕ ============
const ENEMY_STATS = {
  slime:   { hp: 20, atk: 5,  gold: 5,  xp: 10, loot: 0.3, speed: 0.8, color: '#4c4', icon: '🟢' },
  bat:     { hp: 15, atk: 7,  gold: 7,  xp: 15, loot: 0.3, speed: 1.5, color: '#646', icon: '🦇' },
  skeleton:{ hp: 35, atk: 10, gold: 12, xp: 25, loot: 0.35, speed: 1.0, color: '#ccc', icon: '💀' },
  zombie:  { hp: 50, atk: 8,  gold: 10, xp: 20, loot: 0.3, speed: 0.6, color: '#686', icon: '🧟' },
  orc:     { hp: 70, atk: 15, gold: 20, xp: 40, loot: 0.4, speed: 1.1, color: '#484', icon: '👹' },
  dragon:  { hp: 200, atk: 25, gold: 100, xp: 200, loot: 0.8, speed: 1.2, color: '#c44', icon: '🐉' }
};

const DUNGEON_LEVELS = {
  1: { mobs: ['slime', 'bat'], boss: 'slime' },
  2: { mobs: ['skeleton', 'zombie'], boss: 'skeleton' },
  3: { mobs: ['orc', 'zombie'], boss: 'orc' },
  4: { mobs: ['orc', 'skeleton'], boss: 'dragon' }
};

const LOOT_TABLE = {
  slime:    [{ name: 'Слизь', icon: '🟢', price: 3 }],
  bat:      [{ name: 'Клык', icon: '🦷', price: 5 }],
  skeleton: [{ name: 'Кость', icon: '🦴', price: 8 }, { name: 'Ржавый меч', icon: '🗡️', atk: 5, price: 30 }],
  zombie:   [{ name: 'Гнилая ткань', icon: '🧻', price: 6 }],
  orc:      [{ name: 'Орочий топор', icon: '🪓', atk: 12, price: 100 }, { name: 'Кольчуга', icon: '🛡️', def: 5, price: 80 }],
  dragon:   [{ name: 'Чешуя дракона', icon: '🐲', price: 500 }, { name: 'Меч дракона', icon: '⚔️', atk: 30, price: 1000 }]
};

const SHOP_ITEMS = {
  magic: [
    { name: 'Зелье HP', icon: '🧪', heal: 30, price: 20 },
    { name: 'Зелье MP', icon: '💙', heal: 0, price: 25 },
    { name: 'Посох ученика', icon: '🪄', atk: 8, price: 100 },
    { name: 'Мантия мага', icon: '👘', def: 4, price: 120 }
  ],
  smith: [
    { name: 'Железный меч', icon: '⚔️', atk: 15, price: 200 },
    { name: 'Стальной щит', icon: '🛡️', def: 8, price: 180 },
    { name: 'Большой меч', icon: '🗡️', atk: 25, price: 500 }
  ]
};

// ============ СТАРТ ============
Game.init();
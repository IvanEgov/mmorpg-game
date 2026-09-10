class OtherPlayer {
    constructor(id, data) {
        this.id = id;
        this.name = data.name;
        this.x = data.x;
        this.y = data.y;
        this.targetX = data.x;
        this.targetY = data.y;
        this.direction = data.direction;
        this.level = data.level;
        this.hp = data.hp;
        this.maxHp = data.maxHp;
        this.locationId = data.locationId;
        this.lastSeen = data.lastSeen;
    }

    // Плавная интерполяция позиции
    update() {
        const lerp = 0.2;
        this.x += (this.targetX - this.x) * lerp;
        this.y += (this.targetY - this.y) * lerp;
    }

    updateFromNetwork(data) {
        this.targetX = data.x;
        this.targetY = data.y;
        this.direction = data.direction;
        this.level = data.level;
        this.hp = data.hp;
        this.maxHp = data.maxHp;
        this.locationId = data.locationId;
        this.lastSeen = data.lastSeen;
    }
}
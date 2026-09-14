class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.smoothness = 0.1;
    }

    follow(targetX, targetY) {
        const targetCamX = targetX - this.canvasWidth / 2;
        const targetCamY = targetY - this.canvasHeight / 2;

        this.x += (targetCamX - this.x) * this.smoothness;
        this.y += (targetCamY - this.y) * this.smoothness;
    }

    clamp(mapWidth, mapHeight) {
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x > mapWidth - this.canvasWidth) this.x = mapWidth - this.canvasWidth;
        if (this.y > mapHeight - this.canvasHeight) this.y = mapHeight - this.canvasHeight;
    }

    apply(ctx) {
        ctx.save();
        ctx.translate(-Math.floor(this.x), -Math.floor(this.y));
    }

    restore(ctx) {
        ctx.restore();
    }

    // 🆕 Методы для определения видимой области
    getVisibleTileRange(mapWidth, mapHeight) {
        const startX = Math.max(0, Math.floor(this.x / CONSTANTS.TILE_SIZE) - 1);
        const startY = Math.max(0, Math.floor(this.y / CONSTANTS.TILE_SIZE) - 1);
        const endX = Math.min(mapWidth, Math.ceil((this.x + this.canvasWidth) / CONSTANTS.TILE_SIZE) + 1);
        const endY = Math.min(mapHeight, Math.ceil((this.y + this.canvasHeight) / CONSTANTS.TILE_SIZE) + 1);

        return { startX, startY, endX, endY };
    }

    isEntityVisible(entityX, entityY, margin = 50) {
        return entityX > this.x - margin &&
            entityX < this.x + this.canvasWidth + margin &&
            entityY > this.y - margin &&
            entityY < this.y + this.canvasHeight + margin;
    }
}
class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;
        this.y = 0;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.smoothness = 0.1; // Плавность следования (0..1)
    }

    follow(targetX, targetY) {
        // Цель: игрок должен быть в центре экрана
        const targetCamX = targetX - this.canvasWidth / 2;
        const targetCamY = targetY - this.canvasHeight / 2;

        // Плавное движение камеры
        this.x += (targetCamX - this.x) * this.smoothness;
        this.y += (targetCamY - this.y) * this.smoothness;
    }

    // Ограничиваем камеру границами карты
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
}
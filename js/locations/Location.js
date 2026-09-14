class Location {
    constructor(name) {
        this.name = name;
        this.map = [];
        this.entities = [];
        this.mapCanvas = null; // 🆕 Offscreen canvas для кэша карты
        this.mapCanvasDirty = true; // 🆕 Флаг перерисовки
    }

    update(player) {
        for (const entity of this.entities) {
            if (entity.update) entity.update(player, this);
        }
    }

    render(ctx, camera) {
        const mapW = this.mapWidth || CONSTANTS.MAP_WIDTH;
        const mapH = this.mapHeight || CONSTANTS.MAP_HEIGHT;

        // 🆕 Создаём offscreen canvas если нужно
        if (!this.mapCanvas || this.mapCanvas.width !== mapW * CONSTANTS.TILE_SIZE || this.mapCanvas.height !== mapH * CONSTANTS.TILE_SIZE) {
            this.mapCanvas = document.createElement('canvas');
            this.mapCanvas.width = mapW * CONSTANTS.TILE_SIZE;
            this.mapCanvas.height = mapH * CONSTANTS.TILE_SIZE;
            this.mapCanvasDirty = true;
        }

        // 🆕 Рисуем карту в offscreen canvas только если она изменилась
        if (this.mapCanvasDirty) {
            const mapCtx = this.mapCanvas.getContext('2d');
            for (let y = 0; y < mapH; y++) {
                for (let x = 0; x < mapW; x++) {
                    mapCtx.fillStyle = this.getTileColor(this.map[y][x]);
                    mapCtx.fillRect(x * CONSTANTS.TILE_SIZE, y * CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
                }
            }
            this.mapCanvasDirty = false;
            console.log('✅ Карта закэширована в offscreen canvas');
        }

        // 🆕 Рисуем только видимую часть карты
        const range = camera.getVisibleTileRange(mapW, mapH);
        ctx.drawImage(
            this.mapCanvas,
            range.startX * CONSTANTS.TILE_SIZE,
            range.startY * CONSTANTS.TILE_SIZE,
            (range.endX - range.startX) * CONSTANTS.TILE_SIZE,
            (range.endY - range.startY) * CONSTANTS.TILE_SIZE,
            range.startX * CONSTANTS.TILE_SIZE,
            range.startY * CONSTANTS.TILE_SIZE,
            (range.endX - range.startX) * CONSTANTS.TILE_SIZE,
            (range.endY - range.startY) * CONSTANTS.TILE_SIZE
        );

        // 🆕 Рендерим сущности только если они видны
        for (const entity of this.entities) {
            if (entity.render && camera.isEntityVisible(entity.x, entity.y)) {
                entity.render(ctx);
            }
        }
    }

    getTileColor(tile) {
        const colors = {
            0: CONSTANTS.COLORS.GRASS,
            1: CONSTANTS.COLORS.WALL,
            2: CONSTANTS.COLORS.ROAD,
            3: CONSTANTS.COLORS.WATER,
            4: CONSTANTS.COLORS.HOUSE,
            5: CONSTANTS.COLORS.ROOF,
            6: CONSTANTS.COLORS.DUNGEON_FLOOR,
            7: CONSTANTS.COLORS.DUNGEON_WALL
        };
        return colors[tile] || '#000';
    }

    isWalkable(x, y) {
        const tileX = Math.floor(x / CONSTANTS.TILE_SIZE);
        const tileY = Math.floor(y / CONSTANTS.TILE_SIZE);
        const mapW = this.mapWidth || CONSTANTS.MAP_WIDTH;
        const mapH = this.mapHeight || CONSTANTS.MAP_HEIGHT;
        if (tileX < 0 || tileY < 0 || tileX >= mapW || tileY >= mapH) return false;
        if (!this.map[tileY]) return false;
        const tile = this.map[tileY][tileX];
        return tile !== 1 && tile !== 3 && tile !== 4 && tile !== 5 && tile !== 7;
    }
}
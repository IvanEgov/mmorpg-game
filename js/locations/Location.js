class Location {
    constructor(name) {
        this.name = name;
        this.map = [];
        this.entities = [];
    }

    update(player) {
        for (const entity of this.entities) {
            if (entity.update) entity.update(player, this);
        }
    }

    render(ctx) {
        // Рендер карты
        for (let y = 0; y < CONSTANTS.MAP_HEIGHT; y++) {
            for (let x = 0; x < CONSTANTS.MAP_WIDTH; x++) {
                ctx.fillStyle = this.getTileColor(this.map[y][x]);
                ctx.fillRect(x * CONSTANTS.TILE_SIZE, y * CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE, CONSTANTS.TILE_SIZE);
            }
        }
        // Рендер сущностей
        for (const entity of this.entities) {
            if (entity.render) entity.render(ctx);
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
        if (tileX < 0 || tileY < 0 || tileX >= CONSTANTS.MAP_WIDTH || tileY >= CONSTANTS.MAP_HEIGHT) return false;
        const tile = this.map[tileY][tileX];
        return tile !== 1 && tile !== 3 && tile !== 4 && tile !== 5 && tile !== 7;
    }
}
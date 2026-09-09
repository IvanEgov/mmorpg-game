class NPC {
    constructor(x, y, type, name) {
        this.x = x;
        this.y = y;
        this.type = type; // 'mage', 'smith', 'keeper', 'elder'
        this.name = name;
        this.size = CONSTANTS.TILE_SIZE * 0.8;
    }

    render(ctx) {
        const centerX = this.x + CONSTANTS.TILE_SIZE / 2;
        const centerY = this.y + CONSTANTS.TILE_SIZE / 2;

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX, this.y + CONSTANTS.TILE_SIZE - 4, CONSTANTS.TILE_SIZE / 3, CONSTANTS.TILE_SIZE / 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Тело
        ctx.fillStyle = '#f39c12';
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Иконка
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name.split(' ')[0], centerX, centerY);

        // Индикатор "!"
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('!', centerX, this.y - 4);
    }

    interact(player, game) {
        game.ui.openNPCDialog(this);
    }
}
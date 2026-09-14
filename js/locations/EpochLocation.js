class EpochLocation extends DungeonLocation {
    constructor(epochId) {
        super('epoch_' + epochId);
        this.epochId = epochId;
        this.epochData = EPOCHS[epochId];
    }

    completeEpoch() {
        // Вызывается когда игрок завершил эпоху
        window.gameInstance.player.completeEpoch(this.epochId);
        window.gameInstance.saveGame();
    }
}
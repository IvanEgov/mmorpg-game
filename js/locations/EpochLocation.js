class EpochLocation extends DungeonLocation {
    constructor(epochId) {
        super('epoch_' + epochId); // 🆕 Это устанавливает this.dungeonId
        this.epochId = epochId;
        this.epochData = EPOCHS[epochId];
    }

    completeEpoch() {
        window.gameInstance.player.completeEpoch(this.epochId);
        window.gameInstance.saveGame();
    }
}
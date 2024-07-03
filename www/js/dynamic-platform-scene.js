export default class DynamicPlatformScene extends Phaser.Scene {
    constructor() {
        super('DynamicPlatformScene');
        this.chunks = [];
        this.chunkWidth = 100;
        this.activeChunks = 3; 
    }
    create() {
        this.generateInitialChunks();
    }
    generateInitialChunks() {
        for (let i = 0; i < this.activeChunks; i++) {
            this.createChunk((i === 0 ? this.chunkWidth : i * this.chunkWidth), 0);
        }
    }
    createChunk(x, y) {
        const chunk = new LevelChunk(this, x, y, this.chunkWidth, this.game.config.height);
        chunk.create();
        this.chunks.push(chunk);
    }
    update() {
        //
    }
}

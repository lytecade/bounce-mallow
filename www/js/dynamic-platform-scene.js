import Utils from "/js/level-chunk.js";

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
        const groundLayer = chunk.create();
        this.chunks.push(chunk);
        this.physics.add.collider(this.player.sprite, groundLayer);
    }
    update() {
        this.manageChunks();
    }
    manageChunks() {
        const playerX = this.player.sprite.x;
        const lastChunk = this.chunks[this.chunks.length - 1];
        if (playerX > lastChunk.x - this.chunkWidth) {
            this.createChunk(lastChunk.x + this.chunkWidth, 0);
        }
        if (this.chunks.length > this.activeChunks) {
            const oldChunk = this.chunks.shift();
            oldChunk.destroy();
        }
    }
}

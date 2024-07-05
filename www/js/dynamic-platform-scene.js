import LevelChunk from "/js/level-chunk.js";
import Utils from "/js/utils.js";
import { DYN_RESOURCES, BACKGROUND_RESOURCES_HILLS } from "/js/constants.js";

export default class DynamicPlatformScene extends Phaser.Scene {
    preload() {
        Utils.loadResources(this, DYN_RESOURCES);
        Utils.loadResources(this, BACKGROUND_RESOURCES_HILLS);
    }
    create() {
        this.chunks = [];
        this.chunkWidth = 100;
        this.activeChunks = 3; 
        Utils.createBackgrounds(this, 1, "background-hills", 0);
        Utils.createSceneAttributes(this);
        this.generateInitialChunks();
    }
    generateInitialChunks() {
        for (let i = 0; i < this.activeChunks; i++) {
            this.createChunk(i * this.chunkWidth, 0);
        }
    }
    createChunk(x, y) {
        const chunk = new LevelChunk(this, x, y, this.chunkWidth, this.game.config.height);
        const groundLayer = chunk.create();
        this.chunks.push(chunk);
        //this.physics.add.collider(this.player.sprite, groundLayer);
    }
    update() {
        //this.manageChunks();
    }
    manageChunks() {
        /*
        const playerX = this.player.sprite.x;
        const lastChunk = this.chunks[this.chunks.length - 1];
        if (playerX > lastChunk.x - this.chunkWidth) {
            this.createChunk(lastChunk.x + this.chunkWidth, 0);
        }
        if (this.chunks.length > this.activeChunks) {
            const oldChunk = this.chunks.shift();
            oldChunk.destroy();
        }
        */
    }
}

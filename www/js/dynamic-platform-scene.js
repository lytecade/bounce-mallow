import LevelChunk from "/js/level-chunk.js";
import Utils from "/js/utils.js";
import Player from "/js/player.js";
import { BASE_RESOURCES, BACKGROUND_RESOURCES_HILLS } from "/js/constants.js";

export default class DynamicPlatformScene extends Phaser.Scene {
    preload() {
        Utils.loadResources(this, BASE_RESOURCES);
        Utils.loadResources(this, BACKGROUND_RESOURCES_HILLS);
    }
    create() {
        this.chunks = [];
        this.chunkWidth = 88;
        this.activeChunks = 3; 
        Utils.createBackgrounds(this, 1, "background-hills", 0);
        Utils.createSceneAttributes(this, BASE_RESOURCES);
        this.player = new Player(this, 10, 10);
        this.generateInitialChunks();
        Utils.createSounds(this, BASE_RESOURCES);
    }
    generateInitialChunks() {
        for (let i = 0; i < this.activeChunks; i++) {
            this.createChunk(i * this.chunkWidth, 0);
        }
    }
    createChunk(x, y) {
        const chunk = new LevelChunk(this, x, y, this.chunkWidth);
        const groundLayer = chunk.create();
        this.chunks.push(chunk);
        this.physics.add.collider(this.player.sprite, chunk.groundLayer);
    }
    update() {
        //this.manageChunks();
        if (this.loseSequenceActive == false) {
            this.player.update();
        }
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
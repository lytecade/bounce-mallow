import LevelChunk from "/js/level-chunk.js";
import Utils from "/js/utils.js";
import Player from "/js/player.js";
import { TileSettings, BASE_RESOURCES, BACKGROUND_RESOURCES_HILLS } from "/js/constants.js";

export default class DynamicPlatformScene extends Phaser.Scene {
    preload() {
        Utils.loadResources(this, BASE_RESOURCES);
        Utils.loadResources(this, BACKGROUND_RESOURCES_HILLS);
    }
    create() {
        this.chunks = [];
        this.chunkColliders = [];
        this.chunkWidth = TileSettings.TileChunkDefaultSize;
        this.activeChunks = TileSettings.TileChunkDefaultActive; 
        this.backgroundImages = Utils.createBackgrounds(this, 1, "background-hills", 0);
        Utils.createSceneAttributes(this, BASE_RESOURCES);
        this.player = new Player(this, this.chunkWidth, 10);
        this.generateInitialChunks();
        Utils.createSounds(this, BASE_RESOURCES);
        this.cameras.main.startFollow(this.player.sprite);
        this.updateCameraBounds();
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
        const collider = this.physics.add.collider(this.player.sprite, chunk.groundLayer);
        this.chunkColliders.push(collider);
        this.updateCameraBounds();
    }
    update() {
        this.manageChunks();
        if (this.loseSequenceActive == false) {
            this.player.update();
        }
    }
    removeOldestChunk() {
        if (this.chunks.length > this.activeChunks) {
            const oldestChunk = this.chunks.shift();
            oldestChunk.destroy();
            const oldestCollider = this.chunkColliders.shift();
            this.physics.world.removeCollider(oldestCollider);
            this.updateCameraBounds();
        }
    }
    updateCameraBounds() {
        if (this.chunks.length > 0) {
            const firstChunk = this.chunks[0];
            const lastChunk = this.chunks[this.chunks.length - 1];
            const worldWidth = lastChunk.x + this.chunkWidth;
            const worldHeight = this.sys.game.config.height;
            this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        }
    }
    manageChunks() {
        const lastChunk = this.chunks[this.chunks.length - 1];
        if (this.player.sprite.x > lastChunk.x - this.chunkWidth) {
            this.createChunk(lastChunk.x + this.chunkWidth, 0);
            this.removeOldestChunk();
        }
    }
}

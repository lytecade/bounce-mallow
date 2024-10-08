import LevelChunk from "/js/level-chunk.js";
import Utils from "/js/utils.js";
import Enemy from "/js/dynamic-enemy.js";
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
        this.chunkCliffColliders = [];
        this.enemies = [];
        this.enemyTileCollider = [];        
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
        for (let i = 0; i < (this.activeChunks * 3); i++) {
            if (i < this.activeChunks) {
                this.createChunk(i * this.chunkWidth, 0, false);
            } else {
                this.createChunk(i * this.chunkWidth, 0, true);
            }
        }
    }
    createChunk(x, y, showCliff) {
        const chunk = new LevelChunk(this, x, y, this.chunkWidth, showCliff);
        const groundLayer = chunk.create();
        this.chunks.push(chunk);
        const collider = this.physics.add.collider(this.player.sprite, chunk.groundLayer);
        this.chunkColliders.push(collider);
        const loseCliffCollider = this.physics.add.overlap(
            this.player.sprite,
            chunk.loseLayer,
            () => this.setChunkLoseSequence(),
            (player, tile) => {
                return (tile.index === 1);
            },
            this
        );
        if (chunk.enemySpawnPoint) {
            this.createEnemy(this, chunk, chunk.enemySpawnPoint.x, chunk.enemySpawnPoint.y);
        }
        this.chunkCliffColliders.push(loseCliffCollider);
        this.updateCameraBounds();
    }
    update(time, delta) {
        if (this.loseSequenceActive == false) {
            this.manageChunks();
            this.player.update();
        } else {
            this.player.sprite.setAccelerationX(0);
            Utils.runLoseSequenceDynamic(this, 0, 5, true); 
        }
        this.enemies.forEach(enemy => {
            enemy.update(time, delta);
        });
    }
    createEnemy(scene, chunk, x, y) {
        const enemy = new Enemy(chunk, scene, x, y);
        this.enemyTileCollider.push(enemy.spriteCollider);
        this.enemies.push(enemy);
    }
    removeOldestChunk() {
        if (this.chunks.length > (this.activeChunks * 2)) {
            const oldestChunk = this.chunks.shift();
            const oldestChunkValueX = oldestChunk.x;
            oldestChunk.destroy();
            const oldestCollider = this.chunkColliders.shift();
            this.physics.world.removeCollider(oldestCollider);
            const oldestLoseCollider = this.chunkCliffColliders.shift();
            this.physics.world.removeCollider(oldestLoseCollider);
            this.manageOldEnemyData(this, oldestChunkValueX);
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
            this.createChunk(lastChunk.x + this.chunkWidth, 0, true);
            this.removeOldestChunk();
        }
    }
    setChunkLoseSequence() {
        this.loseSequenceActive = true;
    }
    manageOldEnemyData(chunkScene, oldChunkX) {
        let indexOfEnemies = 0;
        for (let i = 0; i < chunkScene.enemies.length; i++) {
            if (chunkScene.enemies[i].sprite.x < (oldChunkX + TileSettings.TileChunkDefaultSize)) {
                indexOfEnemies++;
            }
        }
        for (let r = 0; r < indexOfEnemies; r++) {
            const latestEnemy = chunkScene.enemies.shift();
            const enemyGroundCollider = chunkScene.enemyTileCollider.shift();
            chunkScene.physics.world.removeCollider(enemyGroundCollider);
        }
    }
}

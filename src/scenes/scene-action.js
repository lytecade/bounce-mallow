import LevelChunk from "../objects/object-level.js";
import Enemy from "../objects/object-enemy.js";
import Item from "../objects/object-item.js";
import Player from "../objects/object-player.js";
import { Helpers, LoseTileTypes, ItemTypes, TileSettings } from "../utilities/utility-helpers.js";
import Resources from "../utilities/utility-resources.js"
import UIs from "../utilities/utility-uis.js"
export default class ActionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ActionScene' });
    }
    preload() {
        Resources.createResources(this);
    }
    create() {
        this.chunks = [];
        this.chunkColliders = [];
        this.chunkLoseSeqColliders = [];
        this.enemies = [];
        this.enemyTileCollider = [];
        this.items = [];
        this.itemTileCollider = [];
        this.chunkWidth = TileSettings.TileChunkDefaultSize;
        this.activeChunks = TileSettings.TileChunkDefaultActive; 
        Resources.createBackgrounds(this, "background-hills");
        Resources.createAnimations(this);
        Resources.createSounds(this);
        this.loseSequenceActive = false;
        this.loseSequenceShatter = false;
        this.loseSequenceSound = false;
        this.player = new Player(this, this.chunkWidth, 10);
        for (let i = 0; i < (this.activeChunks * 3); i++) {
            this.setChunk(i * this.chunkWidth, 0, !(i < this.activeChunks));
        }
        this.cameras.main.startFollow(this.player.sprite);
        this.setChunkCamera();
		UIs.setHudCounter(this);
		UIs.setLifeCounter(this, this.game.registry);
		UIs.setLifeBar(this);
        UIs.setAudioStatus(this, this.game.registry);
        UIs.setAudioBar(this, this.player, this.audioBar, this.game);
    }
    update(time, delta) {
		UIs.setAudioUpdate(this);
        if (!this.loseSequenceActive) {
            if (this.player.sprite.x > this.chunks[this.chunks.length - 1].x - this.chunkWidth) {
                this.setChunk(this.chunks[this.chunks.length - 1].x + this.chunkWidth, 0, true);
                if (this.chunks.length > (this.activeChunks * 2)) {
                    const oldestChunk = this.chunks.shift();
                    const oldestChunkValueX = oldestChunk.x;
                    oldestChunk.destroy();
                    this.physics.world.removeCollider(this.chunkColliders.shift());
                    this.physics.world.removeCollider(this.chunkLoseSeqColliders.shift());
                    const indexOfEnemies = Helpers.getOutOfBoundsCount(this.enemies, (oldestChunkValueX + TileSettings.TileChunkDefaultSize))
                    const indexOfItems = Helpers.getOutOfBoundsCount(this.items, (oldestChunkValueX + TileSettings.TileChunkDefaultSize));
                    Helpers.removeObjectsByCount(indexOfEnemies, this, this.enemies, this.enemyTileCollider);
                    Helpers.removeObjectsByCount(indexOfItems, this, this.items, this.itemTileCollider);
		    		this.setChunkCamera();
                }
            }
            this.player.update();
        } else {
            this.player.sprite.setVelocityX(0);
            this.game.registry.set('settingLiveRemoved', true);
            Helpers.setLoseSequence(this, 0, 5, !this.loseSequenceShatter); 
        }
        this.items.forEach(item => {
            item.update();
        });
        this.enemies.forEach(enemy => {
            enemy.update(time, delta);
        });
    }
    setChunk(x, y, showCliff) {
        const chunk = new LevelChunk(this, x, y, this.chunkWidth, showCliff);
        const groundLayer = chunk.create();
        this.chunks.push(chunk);
        this.chunkColliders.push(this.physics.add.collider(this.player.sprite, chunk.groundLayer));
        if (chunk.enemySpawnPoint) {
            const enemy = new Enemy(chunk, this, chunk.enemySpawnPoint.x, chunk.enemySpawnPoint.y);
            this.enemyTileCollider.push(enemy.spriteCollider);
            this.enemies.push(enemy);
        }
        if (chunk.itemSpawnPoint) {
            const item = new Item(chunk, this, chunk.itemSpawnPoint.x, chunk.itemSpawnPoint.y);
            this.itemTileCollider.push(item.spriteCollider);
            this.items.push(item);
        }
        this.chunkLoseSeqColliders.push(this.physics.add.overlap(
            this.player.sprite,
            chunk.loseLayer,
            (player, tile) => {
                this.loseSequenceActive = true;
                this.loseSequenceShatter = (tile.index === LoseTileTypes.Spikes);
            },
            (player, tile) => {
                return ([LoseTileTypes.Cliff, LoseTileTypes.Spikes].includes(tile.index));
            },
            this
        ));
        this.setChunkCamera();
    }
    setChunkCamera() {
        if (this.chunks.length > 0) {
            this.cameras.main.setBounds(0, 0, 
                (this.chunks[this.chunks.length - 1].x + this.chunkWidth), 
                (this.sys.game.config.height)
            );
        }
    }
}


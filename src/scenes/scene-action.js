import LevelChunk from "../objects/object-level.js";
import Enemy from "../objects/object-enemy.js";
import Item from "../objects/object-item.js";
import Player from "../objects/object-player.js";
import { Helpers, LoseTileTypes, ItemTypes, TileSettings } from "../utilities/utility-helpers.js";
import Resources from "../utilities/utility-resources.js"

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
        Resources.createBackgrounds(this, 1, "background-hills", 0);
        Resources.createAnimations(this);
        Resources.createSounds(this);
        this.loseSequenceActive = false;
        this.loseSequenceShatter = false;
        this.loseSequenceSound = false;
        this.player = new Player(this, this.chunkWidth, 10);
        this.generateInitialChunks();
        this.cameras.main.startFollow(this.player.sprite);
        this.updateCameraBounds();

        this.hudCounters = [0, 0];
        this.hudCounterImages = [];
        this.hudBar = this.add.image(10, 9, 'sprite-hud', 16).setOrigin(1, 0).setScrollFactor(0);

        if (this.game.registry.get('settingAudioActive') === undefined) {
            this.game.registry.set('settingAudioActive', true);
            this.audioBar = this.add.image(10, 54, 'sprite-hud', 14).setOrigin(1, 0).setScrollFactor(0);
            this.sound.volume = 1;
        } else if (this.game.registry.get('settingAudioActive') === false) {
            this.audioBar = this.add.image(10, 54, 'sprite-hud', 15).setOrigin(1, 0).setScrollFactor(0);
            this.sound.volume = 0;
        } else {
            this.audioBar = this.add.image(10, 54, 'sprite-hud', 14).setOrigin(1, 0).setScrollFactor(0);
            this.sound.volume = 1;
        }

        this.liveHudCounter = 5;
        if (this.game.registry.get('settingLiveCounter') === undefined) {
            this.game.registry.set('settingLiveCounter', this.liveHudCounter);
        } else {
            this.liveHudCounter = this.game.registry.get('settingLiveCounter');
        }
        if (this.game.registry.get('settingLiveRemoved') === undefined) {
            this.game.registry.set('settingLiveRemoved', false);
        } else if (this.game.registry.get('settingLiveRemoved') === true){
            let tempCount = this.game.registry.get('settingLiveCounter');
            this.liveHudCounter = tempCount - 1;
            this.game.registry.set('settingLiveCounter', this.liveHudCounter);
            this.game.registry.set('settingLiveRemoved', false);
        }
		this.liveBarImages = [];
	    for (let h = 0; h < this.liveHudCounter; h++) {
            this.liveBarImages.push(this.add.image(10 + (h * 6), 16, 'sprite-hud', 10).setOrigin(1, 0).setScrollFactor(0));
		}	

        this.hudJumpBarCounter = 0;
        for (let i = 0; i < this.hudCounters.length; i++) {
            this.hudCounterImages.push(this.add.image(16 + (i * 4), 9, 'sprite-hud', 0).setOrigin(1, 0).setScrollFactor(0));
        }
        this.hudTimer = this.time.addEvent({ 
            delay: 1000, 
            callback: this.runHudCount, 
            callbackScope: this, 
            loop: true 
        });
        if (!Helpers.isValueEmpty(this.player)) {
            const playerReference = this.player;
            const audioBarReference = this.audioBar;
            let audioBarPressedReference = this.game; 
            this.input.on('pointerdown', function (pointer) {
                if (audioBarReference.getBounds().contains(pointer.x, pointer.y)) {
                    if (audioBarPressedReference.registry.get('settingAudioActive') === true) {
                        audioBarReference.setFrame(15);
                        audioBarPressedReference.registry.set('settingAudioActive', false);
                    } else {
                        audioBarReference.setFrame(14);
                        audioBarPressedReference.registry.set('settingAudioActive', true);
                    }
                } else {
                    if (playerReference.movementState === false) {
                        playerReference.switchMovementState();
                    } else {
                        playerReference.switchJumpState(true, false, playerReference.sprite);
                    }
                }
            });
            this.input.on('pointerup', function (pointer) {
	        if (playerReference.movementState !== false) {
	            playerReference.switchJumpState(false, true, playerReference.sprite);
	        }
            });
        } 
    }

    runHudCount() {
        if (this.player.movementState && !this.loseSequenceActive) {
            this.hudCounters[this.hudCounters.length - 1]++;
            for (let i = this.hudCounters.length - 1; i >= 0; i--) {
                if (this.hudCounters[i] > 9) {
                    this.hudCounters[i] = 0;
                    if (i > 0) {
                        this.hudCounters[i - 1]++;
                    }
                }
            }
            for (let i = 0; i < this.hudCounters.length; i++) {
                this.hudCounterImages[i].setFrame(this.hudCounters[i]);
            }
        }
    }

    generateInitialChunks() {
        for (let i = 0; i < (this.activeChunks * 3); i++) {
            this.createChunk(i * this.chunkWidth, 0, !(i < this.activeChunks));
        }
    }

    createChunk(x, y, showCliff) {
        const chunk = new LevelChunk(this, x, y, this.chunkWidth, showCliff);
        const groundLayer = chunk.create();
        this.chunks.push(chunk);
        this.chunkColliders.push(this.physics.add.collider(this.player.sprite, chunk.groundLayer));

        if (chunk.enemySpawnPoint) {
            this.createEnemy(this, chunk, chunk.enemySpawnPoint.x, chunk.enemySpawnPoint.y);
        }

        if (chunk.itemSpawnPoint) {
            this.createItem(this, chunk, chunk.itemSpawnPoint.x, chunk.itemSpawnPoint.y);
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

        this.updateCameraBounds();
    }

    update(time, delta) {
        if (this.audioBar.frame.name == 15) {
            this.sound.volume = 0;
        } else if (this.audioBar.frame.name == 14) {
            this.sound.volume = 1;
        }
        if (!this.loseSequenceActive) {
            this.manageChunks();
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

    createEnemy(scene, chunk, x, y) {
        const enemy = new Enemy(chunk, scene, x, y);
        this.enemyTileCollider.push(enemy.spriteCollider);
        this.enemies.push(enemy);
    }

    createItem(scene, chunk, x, y) {
        const item = new Item(chunk, scene, x, y);
        this.itemTileCollider.push(item.spriteCollider);
        this.items.push(item);
    }

    updateCameraBounds() {
        if (this.chunks.length > 0) {
            this.cameras.main.setBounds(0, 0, 
                (this.chunks[this.chunks.length - 1].x + this.chunkWidth), 
                (this.sys.game.config.height)
            );
        }
    }

    manageChunks() {
        if (this.player.sprite.x > this.chunks[this.chunks.length - 1].x - this.chunkWidth) {
            this.createChunk(this.chunks[this.chunks.length - 1].x + this.chunkWidth, 0, true);
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
				this.updateCameraBounds();
            }
        }
    }
}


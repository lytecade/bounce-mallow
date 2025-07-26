import Chunk from "./objects/object-chunk.js";
import Enemy from "./objects/object-enemy.js";
import Item from "./objects/object-item.js";
import Player from "./objects/object-player.js";
import { Helpers, LoseTileTypes, ItemTypes, TileSettings } from "./utilities/utility-helpers.js";
import Resources from "./utilities/utility-resources.js"
import UIs from "./utilities/utility-uis.js"

class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }
    preload() {
        Resources.createResources(this);
    }
    create() {
        const { ENTER, SPACE } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = this.input.keyboard.addKeys({ enter: ENTER, space: SPACE });
        Resources.createBackgrounds(this, "image-background");
        UIs.setBackResource(this, false);
        UIs.setButtonInput(this, this.buttonBack, this.scene.key, 'InitScene');
        UIs.setBannerResource(this);
        UIs.setBannerWording(this, "image-finalcount", 25);
        UIs.setBannerWording(this, "image-total", 44);
        UIs.setFinalCounter(this, this.game.registry);
    }
    update() {
        const { keys } = this;
        if (Phaser.Input.Keyboard.JustDown(keys.enter) || Phaser.Input.Keyboard.JustDown(keys.space)) {
            this.scene.stop(this.scene.key);
            this.scene.start('InitScene');
        }
    }
}

class ActionScene extends Phaser.Scene {
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
        this.loseSequenceActive = false;
        this.loseSequenceShatter = false;
        this.loseSequenceSound = false;
        Resources.createBackgrounds(this, "image-background");
        Resources.createAnimations(this);
        Resources.createSounds(this);
        this.setPlayerInit(this);
        UIs.setHudCounter(this);
        UIs.setLifeCounter(this, this.game.registry);
        UIs.setLifeBar(this);
        UIs.setAudioStatus(this, this.game.registry);
        UIs.setAudioBar(this, this.player, this.audioBar, this.game);
        UIs.setScreenStatus(this, this.game);
        UIs.setScreenBar(this, this.screenBar, this.game);
    }
    update(time, delta) {
        UIs.setAudioUpdate(this);
        if (!this.loseSequenceActive) {
            if (this.player.sprite.x > this.chunks[this.chunks.length - 1].x - TileSettings.TileChunkDefaultSize) {
                this.setChunk(this.chunks[this.chunks.length - 1].x + TileSettings.TileChunkDefaultSize, 0, true);
                if (this.chunks.length > (TileSettings.TileChunkDefaultActive * 2)) {
                    const oldestChunk = this.chunks.shift();
                    const oldestChunkValueX = oldestChunk.x;
                    oldestChunk.destroy();
                    this.physics.world.removeCollider(this.chunkColliders.shift());
                    this.physics.world.removeCollider(this.chunkLoseSeqColliders.shift());
                    const indexOfEnemies = Helpers.getOutOfBoundsCount(this.enemies, (oldestChunkValueX + TileSettings.TileChunkDefaultSize))
                    const indexOfItems = Helpers.getOutOfBoundsCount(this.items, (oldestChunkValueX + TileSettings.TileChunkDefaultSize));
                    Helpers.setObjectRemoveByCount(indexOfEnemies, this, this.enemies, this.enemyTileCollider);
                    Helpers.setObjectRemoveByCount(indexOfItems, this, this.items, this.itemTileCollider);
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
    setPlayerInit(scene) {
        scene.player = new Player(scene, TileSettings.TileChunkDefaultSize, 10);
        for (let i = 0; i < (TileSettings.TileChunkDefaultActive * 3); i++) {
            scene.setChunk(i * TileSettings.TileChunkDefaultSize, 0, !(i < TileSettings.TileChunkDefaultActive));
        }
        scene.cameras.main.startFollow(scene.player.sprite);
        scene.setChunkCamera();
    }
    setChunk(x, y, showCliff) {
        const chunk = new Chunk(this, x, y, TileSettings.TileChunkDefaultSize, showCliff);
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
                (this.chunks[this.chunks.length - 1].x + TileSettings.TileChunkDefaultSize), 
                (this.sys.game.config.height)
            );
        }
    }
}

class GuideScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GuideScene' });
    }
    preload() {
        Resources.createResources(this);
    }
    create() {
        const { ENTER, SPACE } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = this.input.keyboard.addKeys({ enter: ENTER, space: SPACE });
        this.slideCount = 1;
        Resources.createBackgrounds(this, "image-background");
        UIs.setBackResource(this, true);
        UIs.setButtonInput(this, this.buttonBack, this.scene.key, 'InitScene');
        UIs.setSlideButtonInput(this, this.buttonNext, true);
        UIs.setSlideButtonInput(this, this.buttonPrev, false);
        UIs.setBannerResource(this);
        UIs.setBannerWording(this, "image-controlguide", 25);
        UIs.setGuideResource(this, true);
    }
    update() {
        const { keys } = this;
        if (Phaser.Input.Keyboard.JustDown(keys.enter)) {
            this.scene.stop(this.scene.key);
            this.scene.start('InitScene');
        }
    }
}

class InitScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InitScene' });
    }
    preload() {
        Resources.createResources(this);
    }
    create() {
        const { ENTER, SPACE } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = this.input.keyboard.addKeys({ enter: ENTER, space: SPACE });
        Resources.createBackgrounds(this, "image-background");
        UIs.setTitleResource(this);
        UIs.setButtonInput(this, this.buttonPlay, this.scene.key, 'ActionScene');
        UIs.setButtonInput(this, this.buttonGuide, this.scene.key, 'GuideScene');
        Helpers.setSettingReset(this.game.registry);
        UIs.setScreenStatus(this, this.game);
        UIs.setScreenBar(this, this.screenBar, this.game);
    }
    update() {
        const { keys } = this;
        if (Phaser.Input.Keyboard.JustDown(keys.enter)) {
            this.scene.stop('InitScene');
            this.scene.start('ActionScene');
        } else if (Phaser.Input.Keyboard.JustDown(keys.space)) {
            this.scene.stop('InitScene');
            this.scene.start('GuideScene');
        }
    }
}

const game = new Phaser.Game({
    parent: "game",
    type: Phaser.AUTO,
    width: 96,
    height: 96,
    pixelArt: true,
    scene: [InitScene, ActionScene, GuideScene, EndScene],
    physics: {
        default: "arcade",
        arcade: {
            gravity: {
                y: 1000
            },
        },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
});


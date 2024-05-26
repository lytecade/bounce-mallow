import Utils from "/js/utils.js";
import { BASE_RESOURCES, BACKGROUND_RESOURCES_HILLS } from "/js/constants.js";

class Player {
    constructor(scene, x, y, sys) {
        this.scene = scene;
        this.sys = sys;
        const anims = scene.anims;
        anims.create({
            key: "player-idle",
            frames: anims.generateFrameNumbers("sprite-player", { start: 0, end: 3 }),
            frameRate: 3,
            repeat: -1,
        });
        anims.create({
            key: "player-run",
            frames: anims.generateFrameNumbers("sprite-player", { start: 8, end: 15 }),
            frameRate: 12,
            repeat: -1,
        });
        this.sprite = scene.physics.add.sprite(x, y, "sprite-player", 0).setDrag(1000, 0)
            .setMaxVelocity(150, 500)
            .setSize(7, 8);

        const { LEFT, RIGHT, UP, W, A, D } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = scene.input.keyboard.addKeys({
            left: LEFT,
            right: RIGHT,
            up: UP,
            w: W,
            a: A,
            d: D,
        });
    }
    freeze() {
        this.sprite.body.moves = false;
    }
    update() {
        const { keys, sprite } = this;
        if(sprite.body !== undefined) {
            const onGround = sprite.body.blocked.down;
            const acceleration = onGround ? 75 : 50;
            let canJump = true;
            if (keys.left.isDown || keys.a.isDown) {
                sprite.setAccelerationX(-acceleration);
                sprite.setFlipX(true);
            } else if (keys.right.isDown || keys.d.isDown) {
                sprite.setAccelerationX(acceleration);
                sprite.setFlipX(false);
            } else {
                sprite.setAccelerationX(0);
            }
            if (onGround && (keys.up.isDown || keys.w.isDown)) {
                if(this.canJump === true) {
                    sprite.setVelocityY(-250);
                    this.scene.jumpSound.play();
                    this.canJump = false;
                }
            } 
            if (onGround && (keys.up.isUp && keys.w.isUp)) {
                this.canJump = true;
            }
            if (onGround) {
                if (sprite.body.velocity.x !== 0) {
                    sprite.anims.play("player-run", true);
                }
                else { 
                    sprite.anims.play("player-idle", true);
                }
            } else {
                sprite.anims.stop();
                sprite.setTexture("sprite-player", 9);
            }
        }    
    }
    destroy() {
        this.scene.loseSound.play();
        this.sprite.destroy();
        this.scene.resetSceneCall();    
    }
}

class PlatformScene extends Phaser.Scene {
    preload() {
        Utils.loadResources(this, BASE_RESOURCES);
        Utils.loadResources(this, BACKGROUND_RESOURCES_HILLS);
    }
    create() {    
        Utils.createBackgrounds(this, 1, 'background-hills', 0);
        Utils.createBackgrounds(this, 3, 'background-hills-front', 0.25);
 
        this.player = new Player(this, 16, 56, this.sys);
        const map = this.make.tilemap({ key: "tilemap-platform" });
        const tiles = map.addTilesetImage("tileset-platform", "tileset-platform");

        this.groundLayer = map.createLayer("ground", tiles);
        this.loseLayer = map.createLayer("lose", tiles);
        this.physics.world.addCollider(this.player.sprite, this.groundLayer);
        this.groundLayer.setCollisionByProperty({ collides: true });
        this.playerLoseCollider = this.physics.add.overlap(
            this.player.sprite,
            this.loseLayer,
            () => {
                if(this.player.sprite) {
                    this.player.destroy();
                }    
            },
            (player, tile) => {
                return (tile.index === 1 || tile.index === 20);
            },
            this
        );

        Utils.createSounds(this, BASE_RESOURCES);

        this.cameras.main.startFollow(this.player.sprite);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    }
    update() {
        this.player.update();
    }

    resetSceneCall() {
        this.time.delayedCall(2000, () => { this.scene.restart(); }, [], this);
    }
}

const config = {
    parent: "game",
    type: Phaser.AUTO,
    width: 120,
    height: 72,
    pixelArt: true,
    scene: PlatformScene,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 1000 },
        },
    },
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
};

const game = new Phaser.Game(config);

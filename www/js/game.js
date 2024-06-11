import Utils from "/js/utils.js";
import Player from "/js/player.js";
import Enemy from "/js/enemy.js";
import { BASE_RESOURCES, BACKGROUND_RESOURCES_HILLS } from "/js/constants.js";

class PlatformScene extends Phaser.Scene {
    preload() {
        Utils.loadResources(this, BASE_RESOURCES);
        Utils.loadResources(this, BACKGROUND_RESOURCES_HILLS);
    }
    create() {
        Utils.createBackgrounds(this, 1, "background-hills", 0);
        Utils.createBackgrounds(this, 3, "background-hills-front", 0.25);
        const anims = this.anims;
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
                if (this.player.sprite) {
                    this.player.destroy();
                }
            },
            (player, tile) => {
                return (tile.index === 1 || tile.index === 20);
            },
            this
        );
        this.enemies = [];
        this.enemyLayer = map.getObjectLayer("enemy");
        this.enemyLayer.objects.forEach(enemyObject => {
            const enemy = new Enemy(this, enemyObject.x, enemyObject.y);
            this.enemies.push(enemy);
        });
        Utils.createSounds(this, BASE_RESOURCES);
        this.cameras.main.startFollow(this.player.sprite);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        //this.debugGraphics = this.physics.world.createDebugGraphic();
        //this.debugGraphics.setVisible(true);
    }
    update(time, delta) {
        this.player.update();
        this.enemies.forEach(enemy => {
            enemy.update(time, delta);
        });
    }
    resetSceneCall() {
        this.time.delayedCall(2000, () => {
            this.scene.restart();
        }, [], this);
    }
}

const game = new Phaser.Game({
    parent: "game",
    type: Phaser.AUTO,
    width: 120,
    height: 72,
    pixelArt: true,
    scene: PlatformScene,
    physics: {
        default: "arcade",
        arcade: {
            gravity: {
                y: 1000
            },
        },
    },
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
});


import Utils from "/js/utils.js";
import Player from "/js/player.js";
import Enemy from "/js/enemy.js";
import Item from "/js/item.js";
import { BASE_RESOURCES, BACKGROUND_RESOURCES_HILLS } from "/js/constants.js";

export default class StaticPlatformScene extends Phaser.Scene {
    preload() {
        Utils.loadResources(this, BASE_RESOURCES);
        Utils.loadResources(this, BACKGROUND_RESOURCES_HILLS);
    }
    create() {
        Utils.createBackgrounds(this, 1, "background-hills", 0);
        Utils.createBackgrounds(this, 3, "background-hills-front", 0.25);
        Utils.createSceneAttributes(this, BASE_RESOURCES);
        const map = this.make.tilemap({ key: "tilemap-platform" });
        const tiles = map.addTilesetImage("tileset-platform", "tileset-platform");
        this.player = new Player(this, 16, 56);
        this.groundLayer = map.createLayer("ground", tiles).setCollisionByProperty({ collides: true });
        this.loseLayer = map.createLayer("lose", tiles);
        this.physics.world.addCollider(this.player.sprite, this.groundLayer);
        this.enemyLayer = map.getObjectLayer("enemy");
        this.enemyLayer.objects.forEach(enemyObject => {
            const enemy = new Enemy(this, enemyObject.x, enemyObject.y);
            this.enemies.push(enemy);
        });
        this.itemLayer = map.getObjectLayer("item");
        this.itemLayer.objects.forEach(itemObject => {
            const item = new Item(this, itemObject.x, itemObject.y, itemObject.name);
            this.items.push(item);
        });
        Utils.createSceneColliders(this); 
        Utils.createSounds(this, BASE_RESOURCES);
        this.cameras.main.startFollow(this.player.sprite);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    }
    update(time, delta) {
        if (this.loseSequenceActive == false) {
            this.player.update();
        }
        this.enemies.forEach(enemy => {
            enemy.update(time, delta);
        });
        this.items.forEach(item => {
            item.update();
        });
        if (this.sound.context.state === 'suspended') {
            this.sound.context.resume().then(() => {
                if (!this.backgroundMusic.isPlaying) {
                    this.backgroundMusic.play();
                }
            });
        }
    }
}

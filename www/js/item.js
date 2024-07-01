import { ItemTypes } from "/js/constants.js";

export default class Item {
    constructor(scene, x, y, name) {
        this.scene = scene;
        this.type = this.assignType(name);
        this.activated = false;
        const anims = scene.anims;
        anims.create({
            key: "coffee",
            frames: anims.generateFrameNumbers("sprite-items", {
                start: 0,
                end: 3
            }),
            frameRate: 4,
            repeat: -1
        });
        anims.create({
            key: "camomile",
            frames: anims.generateFrameNumbers("sprite-items", {
                start: 4,
                end: 7
            }),
            frameRate: 4,
            repeat: -1
        });
        anims.create({
            key: "chocolate",
            frames: anims.generateFrameNumbers("sprite-items", {
                start: 8,
                end: 11
            }),
            frameRate: 4,
            repeat: -1
        });
        this.sprite = scene.physics.add.sprite(x, y, "sprite-items", 0)
            .setSize(8, 8);
        this.scene.physics.world.addCollider(this.sprite, scene.groundLayer);
    }
    update() {
        if (this.type === ItemTypes.Coffee) {
            this.sprite.anims.play("coffee", true);
        } else if (this.type === ItemTypes.Camomile) {
            this.sprite.anims.play("camomile", true);
        } else {
            this.sprite.anims.play("chocolate", true);
        }
    }
    assignType(nameValue) {
        if (nameValue.includes("coffee")) {
            return ItemTypes.Coffee;
        } else if (nameValue.includes("camomile")) {
            return ItemTypes.Camomile
        } else if (nameValue.includes("chocolate")) {
            return ItemTypes.Chocolate
        } else {
            return '';
        }
    } 
}

import { ItemTypes } from "/js/constants.js";

export default class Item {
    constructor(scene, x, y, name) {
        this.scene = scene;
        this.chunk = chunk;
        this.type = this.assignType(name);
        this.activated = false;
        this.setupOverlap();
        this.sprite = scene.physics.add.sprite(x, y, "sprite-items", 0).setSize(8, 8);
        this.spriteCollider = scene.physics.world.addCollider(this.sprite, chunk.groundLayer);
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
    setupOverlap() {
        const { scene } = this;
        scene.physics.add.overlap(
            this.sprite,
            scene.player.sprite,
            () => {
                console.log("Test");
            },
            null,
            this
        );
    }
}

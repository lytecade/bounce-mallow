import { ItemTypes } from "/js/constants.js";

export default class Item {
    constructor(chunk, scene, x, y, type) {
        this.scene = scene;
        this.chunk = chunk;
        this.type = type;
        this.activated = false;
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
}

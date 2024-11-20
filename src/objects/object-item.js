import { ItemTypes, Helpers } from "../utilities/utility-helpers.js";
export default class Item {
    constructor(chunk, scene, x, y) {
        this.scene = scene;
        this.chunk = chunk;
        this.activated = false;
        this.sprite = scene.physics.add.sprite(x, y, "sprite-items", 0).setSize(8, 8);
        this.spriteCollider = scene.physics.world.addCollider(this.sprite, chunk.groundLayer);
		this.setupType(this);
        this.setupOverlap();
    }
    update() {
        this.sprite.anims.play(this.type, true);
    }
    setupType(scene) {
        const typeKeys = Object.keys(ItemTypes);
		scene.type = ItemTypes[typeKeys[Math.floor(Math.random() * typeKeys.length)]];
	}
    setupOverlap() {
		const { scene } = this;
        scene.physics.add.overlap(
            this.sprite,
            scene.player.sprite,
            () => {
                Helpers.setItemSequence(scene.player, this.sprite);
            },
            null,
            this
        );
    }
}


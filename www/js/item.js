export default class Item {
    constructor(scene, x, y, name) {
        this.scene = scene;
        this.name = name;
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
        this.sprite = scene.physics.add.sprite(x, y, "sprite-items", 0)
            .setSize(8, 8);
        this.scene.physics.world.addCollider(this.sprite, scene.groundLayer);
    }
    update() {
        if (this.name.includes("coffee")) {
            this.sprite.anims.play("coffee", true);
        } else {
            this.sprite.anims.play("camomile", true);
        }
    }
}

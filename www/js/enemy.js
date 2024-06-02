export default class Enemy {
    constructor(scene, x, y) {
        this.scene = scene;
        const anims = scene.anims;
        anims.create({
            key: "enemy-idle",
            frames: anims.generateFrameNumbers("sprite-enemy-spike", {
                start: 0,
                end: 3
            }),
            frameRate: 4,
            repeat: -1,
        });
        this.sprite = scene.physics.add.sprite(x, y, "sprite-enemy-spike", 0).setSize(8, 8);
        scene.physics.world.addCollider(this.sprite, scene.groundLayer);
    }
    update(time, delta) {
        this.sprite.anims.play("enemy-idle", true);
        if (!this.moveTimer) {
            this.moveTimer = time;
        }
        if (time - this.moveTimer > 3000) {
            this.moveTimer = time;
            console.log("Three second rule!");
        }
    }
}

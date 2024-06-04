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
        anims.create({
            key: "enemy-walk",
            frames: anims.generateFrameNumbers("sprite-enemy-spike", {
                start: 4,
                end: 7
            }),
            frameRate: 4,
            repeat: -1
        });
        this.sprite = scene.physics.add.sprite(x, y, "sprite-enemy-spike", 0).setSize(8, 8);
        this.scene.physics.world.addCollider(this.sprite, scene.groundLayer);
    }
    update(time, delta) {
        this.sprite.anims.play("enemy-idle", true);
        if (!this.moveTimer) {
            this.moveTimer = time;
        }
        if (time - this.moveTimer > 3000) {
            this.moveTimer = time;
            this.moveEnemy();
        }
    }
    moveEnemy() {
        this.sprite.anims.play("enemy-walk", true);
        const moveDistance = 32;
        const moveSpeed = 1600;
        console.log(this.sprite.body.position.x);
        console.log(this.sprite.x);

        const snapshotSprite = JSON.parse(JSON.stringify(this.sprite));
        
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.sprite.x + moveDistance,
            duration: moveSpeed,
            onComplete: () => {
                console.log("First done");
                this.scene.tweens.add({
                    targets: this.sprite,
                    x: this.sprite.x - moveDistance,
                    duration: moveSpeed,
                    onComplete: () => {
                        console.log("Second done");
                        this.sprite.setPosition(snapshotSprite.x, snapshotSprite.y);
                        this.sprite.anims.play("enemy-idle", true);
                    }
                });
            }
        });
    }
}

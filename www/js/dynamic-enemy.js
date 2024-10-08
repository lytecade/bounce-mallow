export default class Enemy {
    constructor(chunk, scene, x, y) {
        this.scene = scene;
        this.chunk = chunk;
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
        this.sprite = scene.physics.add.sprite(x, y, "sprite-enemy-spike", 0)
            .setDrag(100, 0)
            .setSize(8, 8);
        this.spriteCollider = scene.physics.world.addCollider(this.sprite, chunk.groundLayer);
        scene.physics.add.overlap(
            this.sprite,
            scene.player.sprite,
            () => {
                console.log("COLLIDE " + Math.random());
            },
            null,
            this
        );
        this.isStationary = true;
        this.isForward = true;
        this.activityFactor = Math.random()
    }
    update(time, delta) {
        if (!this.moveTimer) {
            this.moveTimer = time;
        }
        if (time - this.moveTimer > 4000 || (this.activityFactor > 0 && this.activityFactor < 0.5)) {
            this.activityFactor = -1;
            this.moveTimer = time;
            this.changeEnemyActivity();
        }
        this.handleEnemyActivity();
    }
    changeEnemyActivity() {
        if (this.isStationary === true) {
           this.isStationary = false;
           this.isForward = (this.isForward === true) ? false : true;
        } else {
           this.isStationary = true;
        }
    } 
    handleEnemyActivity() {
        if (this.isStationary === true) {
            this.sprite.anims.play("enemy-idle", true);
            this.sprite.setAccelerationX(0);
        } else {
            this.sprite.anims.play("enemy-walk", true);
            if (this.isForward === true) {
                this.sprite.setAccelerationX(1);
            } else {
                this.sprite.setAccelerationX(-1);
            }
        }
        if (this.isForward === true) {
	    this.sprite.setFlipX(false);
        } else {
	    this.sprite.setFlipX(true);
        }
    }
}

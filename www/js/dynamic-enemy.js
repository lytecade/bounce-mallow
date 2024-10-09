export default class Enemy {
    constructor(chunk, scene, x, y) {
        this.scene = scene;
        this.chunk = chunk;
        this.sprite = scene.physics.add.sprite(x, y, "sprite-enemy-spike", 0)
            .setDrag(100, 0)
            .setSize(8, 8);
        this.spriteCollider = scene.physics.world.addCollider(this.sprite, chunk.groundLayer);
        scene.physics.add.overlap(
            this.sprite,
            scene.player.sprite,
            () => {
	        scene.loseSequenceActive = true;
	        scene.loseSequenceFromEnemy = true;
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
            if (this.isStationary === true) {
               this.isStationary = false;
               this.isForward = (this.isForward === true) ? false : true;
            } else {
               this.isStationary = true;
            }
        }
        if (this.isStationary === true) {
            this.sprite.anims.play("enemy-idle", true);
            this.sprite.setVelocityX(0);
        } else {
            this.sprite.anims.play("enemy-walk", true);
            if (this.isForward === true) {
                this.sprite.setVelocityX(5);
            } else {
                this.sprite.setVelocityX(-5);
            }
        }
        if (this.isForward === true) {
	    this.sprite.setFlipX(false);
        } else {
	    this.sprite.setFlipX(true);
        }
    }
}

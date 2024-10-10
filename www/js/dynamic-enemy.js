export default class Enemy {
    constructor(chunk, scene, x, y) {
        this.scene = scene;
        this.chunk = chunk;
        this.sprite = scene.physics.add.sprite(x, y, "sprite-enemy-spike", 0).setDrag(100, 0).setSize(8, 8);
        this.spriteCollider = scene.physics.world.addCollider(this.sprite, chunk.groundLayer);
        this.setupOverlap();
        this.isStationary = true;
        this.isForward = true;
        this.activityFactor = Math.random();
        this.moveTimer = null;
    }

    setupOverlap() {
        const { scene } = this;
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
    }

    update(time) {
        if (!this.moveTimer) this.moveTimer = time;

        if (this.shouldChangeState(time)) {
            this.toggleMovement();
            this.moveTimer = time;
        }
        this.updateSprite();
    }

    shouldChangeState(time) {
        return time - this.moveTimer > 4000 || (this.activityFactor > 0 && this.activityFactor < 0.5);
    }

    toggleMovement() {
        this.isStationary = !this.isStationary;
        if (!this.isStationary) this.isForward = !this.isForward;
        else this.activityFactor = -1;
    }

    updateSprite() {
        const velocity = this.isStationary ? 0 : (this.isForward ? 5 : -5);
        this.sprite.setVelocityX(velocity);
        this.sprite.anims.play(this.isStationary ? "enemy-idle" : "enemy-walk", true);
        this.sprite.setFlipX(!this.isForward);
    }
}


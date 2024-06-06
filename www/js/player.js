export default class Player {
    constructor(scene, x, y, sys) {
        this.scene = scene;
        this.sys = sys;
        const anims = scene.anims;
        anims.create({
            key: "player-idle",
            frames: anims.generateFrameNumbers("sprite-player", {
                start: 0,
                end: 3
            }),
            frameRate: 3,
            repeat: -1,
        });
        anims.create({
            key: "player-run",
            frames: anims.generateFrameNumbers("sprite-player", {
                start: 8,
                end: 15
            }),
            frameRate: 12,
            repeat: -1,
        });
        this.sprite = scene.physics.add.sprite(x, y, "sprite-player", 0)
            .setDrag(100, 0)
            .setMaxVelocity(150, 500)
            .setSize(7, 8)
            .setOffset(1, 0);
        const { LEFT, RIGHT, UP, W, A, D } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = scene.input.keyboard.addKeys({
            left: LEFT,
            right: RIGHT,
            up: UP,
            w: W,
            a: A,
            d: D,
        });
    }
    freeze() {
        this.sprite.body.moves = false;
    }
    update() {
        const { keys, sprite } = this;
        if (sprite.body !== undefined) {
            const onGround = sprite.body.blocked.down;
            const acceleration = onGround ? 40 : 20;
            let canJump = true;
            if (keys.left.isDown || keys.a.isDown) {
                sprite.setAccelerationX(-acceleration);
                sprite.setFlipX(true);
            } else if (keys.right.isDown || keys.d.isDown) {
                sprite.setAccelerationX(acceleration);
                sprite.setFlipX(false);
            } else {
                sprite.setAccelerationX(0);
            }
            if (onGround && (keys.up.isDown || keys.w.isDown)) {
                if (this.canJump === true) {
                    sprite.setVelocityY(-235);
                    this.scene.jumpSound.play();
                    this.canJump = false;
                }
            }
            if (onGround && (keys.up.isUp && keys.w.isUp)) {
                this.canJump = true;
            }
            if (onGround) {
                if (sprite.body.velocity.x !== 0) {
                    sprite.anims.play("player-run", true);
                } else {
                    sprite.anims.play("player-idle", true);
                }
            } else {
                sprite.anims.stop();
                sprite.setTexture("sprite-player", 9);
            }
        }
    }
    destroy() {
        this.scene.loseSound.play();
        this.sprite.destroy();
        this.scene.resetSceneCall();
    }
}

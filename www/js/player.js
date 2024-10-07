import { SpeedTypes } from "/js/constants.js";

export default class Player {
    constructor(scene, x, y) {
        this.movementState = false;
        this.scene = scene;
        this.baseSpeed = SpeedTypes.Normal;
        this.fastSequenceActive = false;
        this.slowSequenceActive = false;
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
        anims.create({
            key: "player-destroy",
            frames: anims.generateFrameNumbers("sprite-player", {
                start: 16,
                end: 23
            }),
            frameRate: 8,
            repeat: 0, 
        });
        this.sprite = scene.physics.add.sprite(x, y, "sprite-player", 0)
            .setDrag(1000, 10)
            .setMaxVelocity(this.baseSpeed, 240)
            .setSize(8, 8)
            .setOffset(3, 0);
        const { ENTER, SPACE } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = scene.input.keyboard.addKeys({
            enter: ENTER,
            space: SPACE,
        });
    }
    update() {
        const { keys, sprite } = this;
        if (sprite.body !== undefined) {
            let canJump = true;
            if (this.fastSequenceActive === true) {
                this.baseSpeed = SpeedTypes.Fast;
            } else if (this.slowSequenceActive === true) {
                this.baseSpeed = SpeedTypes.Slow;
            } else {
                this.baseSpeed = SpeedTypes.Normal;
            }
            sprite.body.setMaxVelocity(this.baseSpeed, 240);
            if (Phaser.Input.Keyboard.JustDown(keys.enter)) {
                this.movementState = !this.movementState;
            }
            if (this.movementState) {
                sprite.body.setAccelerationX(this.baseSpeed);
            } else {
                sprite.setAccelerationX(0);
            }    
            if (sprite.body.blocked.down && keys.space.isDown) {
                if (this.canJump === true) {
                    sprite.body.setVelocityY(-240);
                    this.scene.jumpSound.play();
                }
            }
            if (sprite.body.blocked.down && keys.space.isUp) {
                this.canJump = true;
            }
            if (sprite.body.blocked.down) {
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
}

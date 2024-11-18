import { Utils, SpeedTypes } from "./utils.js";

export default class Player {
    constructor(scene, x, y) {
        this.movementState = false;
        this.scene = scene;
        this.baseSpeed = SpeedTypes.Normal;
        this.fastSequenceActive = false;
        this.slowSequenceActive = false;
        this.sprite = scene.physics.add.sprite(x, y, "sprite-player", 0)
            .setMaxVelocity(this.baseSpeed, SpeedTypes.Jump)
            .setSize(6, 8)
            .setOffset(2, 0);
        const { ENTER, SPACE } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = scene.input.keyboard.addKeys({ enter: ENTER, space: SPACE });
        this.canJump = true;
        this.canDoubleJump = false;
    }

    update() {
        const { keys, sprite } = this;
        if (sprite.body) {
            this.baseSpeed = this.fastSequenceActive ? SpeedTypes.Fast :
                             this.slowSequenceActive ? SpeedTypes.Slow : 
                             SpeedTypes.Normal;
            sprite.body.setMaxVelocity(this.baseSpeed, SpeedTypes.Jump);
            if (Phaser.Input.Keyboard.JustDown(keys.enter)) {
                this.switchMovementState()
            }
            sprite.body.setVelocityX(this.movementState ? this.baseSpeed : 0);
            this.switchJumpState(keys.space.isDown, keys.space.isUp, sprite);
        }
    }

    switchMovementState() {
        this.movementState = !this.movementState;
    }

    switchJumpState(downActionCheck, upActionCheck, actionSprite) {
        if (actionSprite.body.blocked.down) {
            if (downActionCheck && this.canJump) {
                actionSprite.body.setVelocityY(-SpeedTypes.Jump);
                this.scene.jumpSound.play();
                this.canJump = false; 
                this.canDoubleJump = false;
            }
            if (upActionCheck) { 
                this.canJump = true; 
                this.canDoubleJump = true;
            }
            actionSprite.anims.play(actionSprite.body.velocity.x ? "player-run" : "player-idle", true);
        } else {
            if (this.scene.hudJumpBarCounter > 0) {
                if (downActionCheck && this.canDoubleJump) {
            	    this.scene.hudJumpBarCounter--;
            	    actionSprite.body.setVelocityY(-SpeedTypes.DoubleJump);
            	    this.scene.jumpSound.play();
            	    Utils.setHudBar(this.scene);
            	    this.canDoubleJump = false;
                }
                if (upActionCheck) { 
            	    this.canDoubleJump = true;
                }
            }
            actionSprite.anims.stop();
            actionSprite.setTexture("sprite-player", 9);
        }
    }
}

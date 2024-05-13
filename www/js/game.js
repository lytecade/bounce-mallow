import Utils from "/js/utils.js";
import { AUDIO_RESOURCES_STD, BACKGROUND_RESOURCES_HILLS } from "/js/constants.js";

class Player {
	constructor(scene, x, y, sys) {
		this.scene = scene;
		this.sys = sys;
		const anims = scene.anims;
		anims.create({
			key: "player-idle",
			frames: anims.generateFrameNumbers("player", { start: 0, end: 3 }),
			frameRate: 3,
			repeat: -1,
		});
		anims.create({
			key: "player-run",
			frames: anims.generateFrameNumbers("player", { start: 8, end: 15 }),
			frameRate: 12,
			repeat: -1,
		});
		this.sprite = scene.physics.add
			.sprite(x, y, "player", 0)
			.setDrag(1000, 0)
			.setMaxVelocity(150, 500)
			.setSize(9, 12)
			.setOffset(3, 4);
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
		if(sprite.body !== undefined) {
			const onGround = sprite.body.blocked.down;
			const acceleration = onGround ? 75 : 50;
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
				if(this.canJump === true) {
					sprite.setVelocityY(-250);
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
				}
				else { 
					sprite.anims.play("player-idle", true);
				}
			} else {
				sprite.anims.stop();
				sprite.setTexture("player", 9);
			}
			if (sprite.body.velocity.y >= 500) {
				this.destroy();
			}
		}	
	}
	destroy() {
		this.scene.loseSound.play();
		this.sprite.destroy();
		this.scene.resetSceneCall();	
	}
}

class PlatformScene extends Phaser.Scene {
	preload() {
		Utils.loadResources(this, AUDIO_RESOURCES_STD);
		Utils.loadResources(this, BACKGROUND_RESOURCES_HILLS);
		//this.load.image("background-hills", "/assets/images/background-hills.png");
		//this.load.image("background-hills-front", "/assets/images/background-hills-front.png");
		this.load.spritesheet("player", "/assets/spritesheets/spritesheets-player.png", {
			frameWidth:16,
			frameHeight:16,
			margin:1,
			spacing:1
		});
		this.load.image("tiles", "../assets/tilesets/tileset-platform.png");
		this.load.tilemapTiledJSON("map", "../assets/tilemaps/tilemap-platform.json");
	}
	create() {	
		Utils.createBackgrounds(this, 1, 'background-hills', 0);
		Utils.createBackgrounds(this, 3, 'background-hills-front', 0.25);

		const map = this.make.tilemap({ key: "map" });
		const tiles = map.addTilesetImage("tileset-platform", "tiles");

		this.groundLayer = map.createLayer("ground", tiles);
		this.jumpSound = this.sound.add('sfx-jump');
		this.loseSound = this.sound.add('sfx-lose');
		this.player = new Player(this, 32, 118, this.sys);
		this.physics.world.addCollider(this.player.sprite, this.groundLayer);
		this.groundLayer.setCollisionByProperty({ collides: true });
		this.cameras.main.startFollow(this.player.sprite);
		this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
	}
	update() {
		this.player.update();
	}
	resetScene() {
		this.scene.restart();
	}
	resetSceneCall() {
		this.time.delayedCall(2000, this.resetScene, [], this);
	}
}

const config = {
	parent: "game",
	type: Phaser.AUTO,
	width: 240,
	height: 150,
	pixelArt: true,
	scene: PlatformScene,
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 1000 },
		},
	},
	scale: {
		mode: Phaser.Scale.ENVELOP,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	}
};

const game = new Phaser.Game(config);

import PlatformScene from "./game-platform-scene.js";

const config = {
	parent: "game",
	type: Phaser.AUTO,
	width: 960,
	height: 540,
	pixelArt: true,
	scene: PlatformScene,
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 1000 },
		},
	},
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	}
};

const game = new Phaser.Game(config);

import PlatformScene from "./game.platform-scene.js";

const config = {
	parent: "game",
	type: Phaser.AUTO,
	width: 960,
	height: 640,
	pixelArt: true,
	scene: PlatformScene,
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 1000 },
		},
	},
};

const game = new Phaser.Game(config);

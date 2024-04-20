import PlatformScene from "./game.platform-scene.js";

const config = {
	parent: "game",
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	pixelArt: true,
	backgroundColor: "#1d212d",
	scene: PlatformScene,
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 1000 },
		},
	},
};

const game = new Phaser.Game(config);

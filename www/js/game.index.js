import PlatformScene from "./game.platform-scene.js";

const config = {
	parent: "game",
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	backgroundColor: "#e1e1e1",
	scene: PlatformScene,
};

const game = new Phaser.Game(config);

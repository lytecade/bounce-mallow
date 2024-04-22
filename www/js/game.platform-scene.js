export default class PlatformScene extends Phaser.Scene {
	preload() {
		this.load.image("background", "../assets/images/background-platformer.png");
		this.load.image("tiles", "../assets/tilesets/tileset-platformer-test.png");
		this.load.tilemapTiledJSON("map", "../assets/tilemaps/tilemap-platformer.json");
	}

	create() {
		const backgroundImage = this.add.image(0, 0, 'background');
		backgroundImage.setOrigin(0, 0);
		backgroundImage.setScale(
			this.sys.game.config.width / backgroundImage.width,
			this.sys.game.config.height / backgroundImage.height
		);
		const map = this.make.tilemap({ key: "map" });
		const tiles = map.addTilesetImage("tileset-platformer-test", "tiles");
		map.createLayer("ground", tiles);
	}
}

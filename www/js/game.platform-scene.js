export default class PlatformScene extends Phaser.Scene {
	preload() {
		this.load.image("tiles", "../assets/tilesets/tileset-platformer-test.png");
		this.load.tilemapTiledJSON("map", "../assets/tilemaps/tilemap-platformer.json");
		console.log('preload complete');
	}

	create() {
		const map = this.make.tilemap({ key: "map" });
		const tiles = map.addTilesetImage("tileset-platformer-test", "tiles");
		map.createLayer("Background", tiles);
		map.createLayer("Foreground", tiles);
		console.log('create complete');
	}
}

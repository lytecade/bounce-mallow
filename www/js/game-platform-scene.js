import Player from "./game-player.js"

export default class PlatformScene extends Phaser.Scene {
	preload() {
		this.load.image("background", "../assets/images/background-platformer.png");
		this.load.spritesheet("player", "/assets/spritesheets/spritesheets-player-2.png", {
			frameWidth:64,
			frameHeight:64,
			margin:2,
			spacing:4
		});
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
		backgroundImage.setScrollFactor(0);
		
		const map = this.make.tilemap({ key: "map" });
		const tiles = map.addTilesetImage("tileset-platformer-test", "tiles");
		this.groundLayer = map.createLayer("ground", tiles);

		this.player = new Player(this, 192, 0);
		this.physics.world.addCollider(this.player.sprite, this.groundLayer);
		this.groundLayer.setCollisionByProperty({ collides: true });

		this.cameras.main.startFollow(this.player.sprite);
		this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
	}

	update() {
		this.player.update();
	}
}

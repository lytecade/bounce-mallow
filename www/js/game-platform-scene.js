import Player from "./game-player.js"

export default class PlatformScene extends Phaser.Scene {
	preload() {
		this.load.audio('jump', 'assets/audio/sfx-jump.wav');
		this.load.image("background", "../assets/images/background-platformer-small.png");
		this.load.spritesheet("player", "/assets/spritesheets/spritesheets-player-smallx.png", {
			frameWidth:16,
			frameHeight:16,
			margin:1,
			spacing:1
		});
		this.load.image("tiles", "../assets/tilesets/tileset-platformer-test-small-2.png");
		this.load.tilemapTiledJSON("map", "../assets/tilemaps/tilemap-platformer-small-2.json");
	}

	create() {	
		const backgroundImage = this.add.image(0, 0, 'background');
		const map = this.make.tilemap({ key: "map" });
		const tiles = map.addTilesetImage("tileset-platformer-test-small-2", "tiles");
		backgroundImage.setOrigin(0, 0);
		backgroundImage.setScale(
			this.sys.game.config.width / backgroundImage.width,
			this.sys.game.config.height / backgroundImage.height
		);
		backgroundImage.setScrollFactor(0);
		this.groundLayer = map.createLayer("ground", tiles);
		this.jumpSound = this.sound.add('jump');
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

import Player from "./game-player.js"

export default class PlatformScene extends Phaser.Scene {
	preload() {
		this.load.audio('jump', 'assets/audio/sfx-jump.wav');
		this.load.audio('lose', 'assets/audio/sfx-lose.wav');
		this.load.image("background", "../assets/images/background-hills.png");
		this.load.spritesheet("player", "/assets/spritesheets/spritesheets-player.png", {
			frameWidth:32,
			frameHeight:32,
			margin:1,
			spacing:2
		});
		this.load.image("tiles", "../assets/tilesets/tileset-platform.png");
		this.load.tilemapTiledJSON("map", "../assets/tilemaps/tilemap-platform.json");
	}

	create() {	
		const backgroundImage = this.add.image(0, 0, 'background');
		const map = this.make.tilemap({ key: "map" });
		const tiles = map.addTilesetImage("tileset-platform", "tiles");
		backgroundImage.setOrigin(0, 0);
		backgroundImage.setScale(
			this.sys.game.config.width / backgroundImage.width,
			this.sys.game.config.height / backgroundImage.height
		);
		backgroundImage.setScrollFactor(0);
		this.groundLayer = map.createLayer("ground", tiles);
		this.jumpSound = this.sound.add('jump');
		this.loseSound = this.sound.add('lose');
		this.player = new Player(this, 64, 256, this.sys);
		this.physics.world.addCollider(this.player.sprite, this.groundLayer);
		this.groundLayer.setCollisionByProperty({ collides: true });
		this.cameras.main.startFollow(this.player.sprite);
		this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
	}

	update() {
		this.player.update();
	}
}

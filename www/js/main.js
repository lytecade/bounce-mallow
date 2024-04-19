class Main extends Phaser.Scene {
	constructor () {
		super('main');
	}

	preload() {
	}

	create() {
	}
}

const config = {
	parent: 'game',
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	backgroundColor: '#111111',
	scene: [ Main ]
};

const game = new Phaser.Game(config);

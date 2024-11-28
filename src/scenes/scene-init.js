import Resources from "../utilities/utility-resources.js"
export default class InitScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InitScene' });
    }
    preload() {
        Resources.createResources(this);
    }
    create() {
        Resources.createBackgrounds(this, "image-background");
		const centerX = this.cameras.main.width / 2;
        this.titleBanner = this.add.image(centerX, 8, "image-title").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        this.buttonPlay = this.add.image(centerX, 44, "image-playbutton").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        this.buttonGuide = this.add.image(centerX, 54, "image-guidebutton").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
    }
}

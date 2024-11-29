import Resources from "../utilities/utility-resources.js"
import UIs from "../utilities/utility-uis.js"
export default class InitScene extends Phaser.Scene {
    constructor() {
        super({ key: 'InitScene' });
    }
    preload() {
        Resources.createResources(this);
    }
    create() {
        Resources.createBackgrounds(this, "image-background");
		UIs.setTitleResource(this);
		UIs.setTitleInput(this, this.buttonPlay, this.buttonGuide);
		Resources
    }
}

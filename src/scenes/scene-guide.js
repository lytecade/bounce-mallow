import Resources from "../utilities/utility-resources.js"
import UIs from "../utilities/utility-uis.js"
export default class GuideScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GuideScene' });
    }
    preload() {
        Resources.createResources(this);
    }
    create() {
        const { ENTER, SPACE } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = this.input.keyboard.addKeys({ enter: ENTER, space: SPACE });
        Resources.createBackgrounds(this, "image-background");
    }
	update() {
		if (Phaser.Input.Keyboard.JustDown(keys.enter)) {
            console.log('enter button pressed');
		} else if (Phaser.Input.Keyboard.JustDown(keys.space)) {
            console.log('space button pressed');
		}
	}
}

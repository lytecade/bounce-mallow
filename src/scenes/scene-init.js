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
        const { ENTER, SPACE } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = this.input.keyboard.addKeys({ enter: ENTER, space: SPACE });
        Resources.createBackgrounds(this, "image-background");
		UIs.setTitleResource(this);
		UIs.setTitleInput(this, this.buttonPlay, this.buttonGuide);
    }
	update() {
        const { keys } = this;
		if (Phaser.Input.Keyboard.JustDown(keys.enter)) {
            console.log('play button pressed');
		} else if (Phaser.Input.Keyboard.JustDown(keys.space)) {
            console.log('guide button pressed');
		}
	}
}

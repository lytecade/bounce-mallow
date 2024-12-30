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
        this.slideCount = 1;
        Resources.createBackgrounds(this, "image-background");
        UIs.setBackResource(this, true);
        UIs.setButtonInput(this, this.buttonBack, this.scene.key, 'InitScene');
        UIs.setSlideButtonInput(this, this.buttonNext, true);
        UIs.setSlideButtonInput(this, this.buttonPrev, false);
        UIs.setBannerResource(this);
        UIs.setBannerWording(this, "image-controlguide", 13);
    }
    update() {
        const { keys } = this;
        if (Phaser.Input.Keyboard.JustDown(keys.enter)) {
            this.scene.stop(this.scene.key);
            this.scene.start('InitScene');
        }
    }
}

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
        UIs.setGuideResource(this);
        UIs.setGuideInput(this, this.buttonBack);
    }
    update() {
        const { keys } = this;
        if (Phaser.Input.Keyboard.JustDown(keys.enter)) {
            this.scene.stop('GuideScene');
            this.scene.start('InitScene');
        }
    }
}

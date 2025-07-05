import Resources from "../utilities/utility-resources.js"
import UIs from "../utilities/utility-uis.js"
import { Helpers } from "../utilities/utility-helpers.js";
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
        UIs.setButtonInput(this, this.buttonPlay, this.scene.key, 'ActionScene');
        UIs.setButtonInput(this, this.buttonGuide, this.scene.key, 'GuideScene');
        Helpers.setSettingReset(this.game.registry);
        UIs.setScreenStatus(this, this.game);
        UIs.setScreenBar(this, this.screenBar, this.game);
    }
    update() {
        const { keys } = this;
        if (Phaser.Input.Keyboard.JustDown(keys.enter)) {
            this.scene.stop('InitScene');
            this.scene.start('ActionScene');
        } else if (Phaser.Input.Keyboard.JustDown(keys.space)) {
            this.scene.stop('InitScene');
            this.scene.start('GuideScene');
        }
    }
}

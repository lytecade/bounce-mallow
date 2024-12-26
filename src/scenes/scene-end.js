import Resources from "../utilities/utility-resources.js"
import UIs from "../utilities/utility-uis.js"
export default class EndScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EndScene' });
    }
    preload() {
        Resources.createResources(this);
    }
    create() {
        const { ENTER, SPACE } = Phaser.Input.Keyboard.KeyCodes;
        this.keys = this.input.keyboard.addKeys({ enter: ENTER, space: SPACE });
        Resources.createBackgrounds(this, "image-background");
        UIs.setBackResource(this, false);
        UIs.setButtonInput(this, this.buttonBack, this.scene.key, 'InitScene');
        UIs.setBannerResource(this);
        UIs.setBannerWording(this, "image-finalcount", 13);
        UIs.setBannerWording(this, "image-total", 32);
        UIs.setFinalCounter(this, this.game.registry);
    }
    update() {
        const { keys } = this;
        if (Phaser.Input.Keyboard.JustDown(keys.enter) || Phaser.Input.Keyboard.JustDown(keys.space)) {
            this.scene.stop(this.scene.key);
            this.scene.start('InitScene');
        }
    }
}

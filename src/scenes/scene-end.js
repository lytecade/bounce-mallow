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
        UIs.setBackResource(this);
        UIs.setButtonInput(this, this.buttonBack, this.scene.key, 'InitScene');
        UIs.setBannerResource(this);
        UIs.setBannerWording(this, "image-finalcount", 13);
        UIs.setBannerWording(this, "image-total", 32);
        this.countImages = [];
        //Life1
        this.countImages.push(this.add.image(40, 20, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        this.countImages.push(this.add.image(44, 20, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        //Life2
        this.countImages.push(this.add.image(52, 20, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        this.countImages.push(this.add.image(56, 20, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        //Life3
        this.countImages.push(this.add.image(64, 20, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        this.countImages.push(this.add.image(68, 20, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        //Life4
        this.countImages.push(this.add.image(76, 20, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        this.countImages.push(this.add.image(80, 20, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        //Life5
        this.countImages.push(this.add.image(88, 20, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        this.countImages.push(this.add.image(92, 20, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        //LifeTotal
        this.countImages.push(this.add.image(64, 37, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        this.countImages.push(this.add.image(68, 37, 'sprite-hud', 20).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
    }
    update() {
        const { keys } = this;
        if (Phaser.Input.Keyboard.JustDown(keys.enter) || Phaser.Input.Keyboard.JustDown(keys.space)) {
            this.scene.stop(this.scene.key);
            this.scene.start('InitScene');
        }
    }
}

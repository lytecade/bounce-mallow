import InitScene from "./scenes/scene-init.js";
import GuideScene from "./scenes/scene-guide.js";
import ActionScene from "./scenes/scene-action.js";
import EndScene from "./scenes/scene-end.js";
const game = new Phaser.Game({
    parent: "game",
    type: Phaser.AUTO,
    width: 120,
    height: 72,
    pixelArt: true,
    scene: [InitScene, ActionScene, GuideScene, EndScene],
    physics: {
        default: "arcade",
        arcade: {
            gravity: {
                y: 1000
            },
        },
    },
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
});


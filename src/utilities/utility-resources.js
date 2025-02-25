import { ItemTypes } from "./utility-helpers.js";
export default class Resources {
    static BaseResources = new Map([
        ["sfx-fast", { type: "sounds", name: "sfx-fast", ext: "wav" }],
        ["sfx-slow", { type: "sounds", name: "sfx-slow", ext: "wav" }],
        ["sfx-jump", { type: "sounds", name: "sfx-jump", ext: "wav" }],
        ["sfx-lose", { type: "sounds", name: "sfx-lose", ext: "wav" }],
        ["sprite-player", { type: "spritesheets", name: "sprite-player", ext: "png" }],
        ["sprite-enemy-spike", { type: "spritesheets", name: "sprite-enemy-spike", ext: "png" }],
        ["sprite-hud", { type: "spritesheets", name: "sprite-hud", ext: "png" }],
        ["sprite-items", { type: "spritesheets", name: "sprite-items", ext: "png" }],
        ["tileset-platform", { type: "tilesets", name: "tileset-platform", ext: "png" }],
        ["image-background", { type: "images", name: "image-background", ext: "png" }],
        ["image-title", { type: "images", name: "image-title", ext: "png" }],
        ["image-gameover", { type: "images", name: "image-gameover", ext: "png" }],
        ["image-guidebutton", { type: "images", name: "image-guidebutton", ext: "png" }],
        ["image-playbutton", { type: "images", name: "image-playbutton", ext: "png" }],
        ["image-backbutton", { type: "images", name: "image-backbutton", ext: "png" }],
        ["image-nextbutton", { type: "images", name: "image-nextbutton", ext: "png" }],
        ["image-prevbutton", { type: "images", name: "image-prevbutton", ext: "png" }],
        ["image-banner", { type: "images", name: "image-banner", ext: "png" }],
        ["image-finalcount", { type: "images", name: "image-finalcount", ext: "png" }],
        ["image-controlguide", { type: "images", name: "image-controlguide", ext: "png" }],
        ["image-slide1", { type: "images", name: "image-slide1", ext: "png" }],
        ["image-slide2", { type: "images", name: "image-slide2", ext: "png" }],
        ["image-slide3", { type: "images", name: "image-slide3", ext: "png" }],
        ["image-total", { type: "images", name: "image-total", ext: "png" }]
    ]);
    static createResources = (scene) => {
        for (const [key, value] of this.BaseResources) {
            let resourcePath = `assets/${value.type}/${value.name}.${value.ext}`;
            switch (value.type) {
                case "sounds":
                    scene.load.audio(value.name, resourcePath);
                    break;
                case "images":
                case "tilesets":
                    scene.load.image(value.name, resourcePath);
                    break;
                case "spritesheets":
                    scene.load.spritesheet(value.name, resourcePath, { frameWidth: 8, frameHeight: 8, margin: 0, spacing: 0 });
                    break;
                default:
                    break;
            }
        }
    }
    static createAnimations = (scene) => {
        const anims = scene.anims;
        if (anims.anims.size === 0) {
            anims.create({
                key: "player-idle",
                frames: anims.generateFrameNumbers("sprite-player", { start: 0, end: 3 }),
                frameRate: 3,
                repeat: -1,
            });
            anims.create({
                key: "player-run",
                frames: anims.generateFrameNumbers("sprite-player", { start: 8, end: 15 }),
                frameRate: 12,
                repeat: -1,
            });
            anims.create({
                key: "player-destroy",
                frames: anims.generateFrameNumbers("sprite-player", { start: 16, end: 23 }),
                frameRate: 8,
                repeat: 0,
            });
            anims.create({
                key: "enemy-idle",
                frames: anims.generateFrameNumbers("sprite-enemy-spike", { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1,
            });
            anims.create({
                key: "enemy-walk",
                frames: anims.generateFrameNumbers("sprite-enemy-spike", { start: 4, end: 7 }),
                frameRate: 4,
                repeat: -1,
            });
            anims.create({
                key: ItemTypes.Coffee,
                frames: anims.generateFrameNumbers("sprite-items", { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1,
            });
            anims.create({
                key: ItemTypes.Camomile,
                frames: anims.generateFrameNumbers("sprite-items", { start: 4, end: 7 }),
                frameRate: 4,
                repeat: -1,
            });
            anims.create({
                key: ItemTypes.Chocolate,
                frames: anims.generateFrameNumbers("sprite-items", { start: 8, end: 11 }),
                frameRate: 4,
                repeat: -1,
            });
        }
    }
    static createBackgrounds = (sceneReference, texture) => {
        sceneReference.add.image(0, 0, texture).setOrigin(0, 0).setScrollFactor(0);
    }
    static createSounds = (scene) => {
        for (const [key, value] of this.BaseResources) {
            if (value.type === "sounds") {
                if (value.name.includes("jump")) {
                    scene.jumpSound = scene.sound.add(value.name);
                }
                if (value.name.includes("lose")) {
                    scene.loseSound = scene.sound.add(value.name);
                }
                if (value.name.includes("fast")) {
                    scene.fastSound = scene.sound.add(value.name);
                }
                if (value.name.includes("slow")) {
                    scene.slowSound = scene.sound.add(value.name);
                }
            }
        }
    }
}


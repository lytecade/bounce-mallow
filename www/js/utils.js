import { ItemTypes, SpeedTypes } from "/js/constants.js";

export default class Utils {
    static isValueEmpty = (resourceValue) => {
        if (resourceValue === 0 || resourceValue === undefined || resourceValue === "") {
            return true;
        }
        return false;
    }

    static loadResources = (scene, resourceCollection) => {
        for (const [key, value] of resourceCollection) {
            let resourcePath = `/assets/${value.type}/${value.name}.${value.ext}`;
            switch (value.type) {
                case "music":
                case "sounds":
                    scene.load.audio(value.name, resourcePath);
                    break;
                case "images":
                case "tilesets":
                    scene.load.image(value.name, resourcePath);
                    break;
                case "spritesheets":
                    scene.load.spritesheet(value.name, resourcePath, value.options);
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
                key: "coffee",
                frames: anims.generateFrameNumbers("sprite-items", { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1,
            });
            anims.create({
                key: "camomile",
                frames: anims.generateFrameNumbers("sprite-items", { start: 4, end: 7 }),
                frameRate: 4,
                repeat: -1,
            });
            anims.create({
                key: "chocolate",
                frames: anims.generateFrameNumbers("sprite-items", { start: 8, end: 11 }),
                frameRate: 4,
                repeat: -1,
            });
        }
    }

    static createBackgrounds = (scene, count, texture, scrollFactor) => {
        let trackingXValue = 0;
        let images = [];
        for (let i = 0; i < count; ++i) {
            const currentImage = scene.add.image(trackingXValue, 0, texture)
                .setOrigin(0, 0)
                .setScrollFactor(scrollFactor);
            trackingXValue += currentImage.width;
            images.push(currentImage);
        }
        return images;
    }

    static createSounds = (scene, resourceCollection) => {
        for (const [key, value] of resourceCollection) {
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
            if (value.type === "music") {
                if (value.name.includes("level")) {
                    scene.backgroundMusic = scene.sound.add(value.name, {
                        loop: true,
                        volume: 0.5
                    });
                }
            }
        }
    }

    static runLoseSequenceDynamic(scene, currentStage, time, byFall) {
        scene.time.delayedCall(time, () => {
            currentStage++;
            if (byFall === true) {
                if (currentStage === 1) {
                    if (scene.loseSequenceSound === false) {
                        scene.loseSound.play();
                        scene.loseSequenceSound = true;
                    }
                    scene.cameras.main.stopFollow();
                    this.runLoseSequenceDynamic(scene, currentStage, time * 400, byFall);
                } else {
                    scene.scene.restart();
                }
            } else {
                switch (currentStage) {
                    case 1:
                        if (scene.player.sprite.anims) {
                            scene.player.sprite.anims.play("player-destroy", true);
                        }
                        this.runLoseSequenceDynamic(scene, currentStage, time, byFall);
                        break;
                    case 2:
                        if (scene.loseSequenceSound === false) {
                            scene.loseSound.play();
                            scene.loseSequenceSound = true;
                        }
                        scene.cameras.main.stopFollow();
                        this.runLoseSequenceDynamic(scene, currentStage, time * 200, byFall);
                        break;
                    default:
                        scene.scene.restart();
                }
            }
        }, [], this);
    }

    static createItemSequence = (playerReference, itemSprite) => {
        const scene = playerReference.scene;
        const item = scene.items.find(i => i.sprite === itemSprite);
        if (item && item.activated === false) {
            item.activated = true;
            itemSprite.setVisible(false);
            scene.player.fastSequenceActive = false;
            scene.player.slowSequenceActive = false;
            if (item.type === ItemTypes.Coffee) {
                scene.player.fastSequenceActive = true;
                scene.fastSound.play();
            }
            if (item.type === ItemTypes.Camomile) {
                scene.player.slowSequenceActive = true;
                scene.slowSound.play();
            }
            if (item.type === ItemTypes.Chocolate) {
                scene.fastSound.play();
                scene.hudBarCounter++;
                if (scene.hudBarCounter > 3) {
                    scene.hudBarCounter = 3;
                }
                switch (scene.hudBarCounter) {
                    case 0:
                        scene.hudBar.setFrame(16);
                        break;
                    case 1:
                        scene.hudBar.setFrame(17);
                        break;
                    case 2:
                        scene.hudBar.setFrame(18);
                        break;
                    case 3:
                        scene.hudBar.setFrame(19);
                        break;
                    default:
                        break;
                }
            }
            scene.time.delayedCall(2000, () => {
                scene.player.fastSequenceActive = false;
                scene.player.slowSequenceActive = false;
            });
        }
    }
}


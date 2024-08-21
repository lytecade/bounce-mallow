import { ItemTypes, SpeedTypes } from "/js/constants.js";

export default class Utils {
    static loadResources = (scene, resourceCollection) => {
        for (const [key, value] of resourceCollection) {
            let resourcePath = (value.type != "music") ? "/assets/" + value.type + "/" + value.name + "." + value.ext : "";
            switch (value.type) {
                case "sounds": 
                    scene.load.audio(value.name, resourcePath);
                    break;
                case "music":
                    const extensions = value.ext;
                    let resourcePaths = [];
                    for (let i = 0; i < extensions.length; i++) {
                        let newExtension = "/assets/music/" + value.name + "." + extensions[i];
                        resourcePaths.push(newExtension);
                    }
                    scene.load.audio(value.name, resourcePaths);
                    break;
                case "images":
                case "tilesets":
                    scene.load.image(value.name, resourcePath);
                    break;
                case "spritesheets":
                    scene.load.spritesheet(value.name, resourcePath, value.options);
                    break;
                case "tilemaps":
                    scene.load.tilemapTiledJSON(value.name, resourcePath);
                    break;
                default:
                    break;
            }
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
    static createSceneAttributes = (scene) => {
        scene.enemies = [];
        scene.items = [];
        scene.loseSequenceActive = false;
        scene.loseSequenceSound = false;
    }
    static createSceneColliders = (scene) => {
        scene.playerLoseColliderCliff = scene.physics.add.overlap(
            scene.player.sprite,
            scene.loseLayer,
            () => this.createLoseSequence(scene, true),
            (player, tile) => {
                return (tile.index === 1);
            },
            this
        );
        scene.playerLoseColliderSpikes = scene.physics.add.overlap(
            scene.player.sprite,
            scene.loseLayer,
            () => this.createLoseSequence(scene, false),
            (player, tile) => {
                return (tile.index === 20);
            },
            this
        );
        scene.playerEnemyCollider = scene.physics.add.overlap(
            scene.player.sprite,
            scene.enemies.map(enemy => enemy.sprite),
            () => this.createLoseSequence(scene, false),
            null,
            this
        );
        scene.playerItemCollider = scene.physics.add.overlap(
            scene.player.sprite,
            scene.items.map(item => item.sprite),
            this.createItemSequence,
            null,
            this
        );
    }
    static createLoseSequence = (scene, lossByFall) => {
	if (scene.player.sprite) {
	    scene.loseSequenceActive = true;
	    this.runLoseSequence(scene, 0, 5, lossByFall);
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
                console.log("Alt sequence");
            }
        }, [], this);
    }
    static runLoseSequence(scene, currentStage, time, byFall) {
        scene.time.delayedCall(time, () => {
            currentStage++;
            if (byFall === true) {
                switch (currentStage) {
                    case 1:
                        scene.player.sprite.setVisible(false);
                        this.runLoseSequence(scene, currentStage, time, byFall);
                        break;
                    case 2:
                        if (scene.loseSequenceSound === false) {
                            scene.loseSound.play();
                            scene.loseSequenceSound = true;
                        } 
                        scene.cameras.main.stopFollow();
                        this.runLoseSequence(scene, currentStage, time * 400, byFall);
                        break;
                    default:
                        scene.scene.restart();
                }
            } else {
                switch (currentStage) {
                    case 1:
                        if (scene.player.sprite.anims) {
                            scene.player.sprite.anims.play("player-destroy", true); 
                        } 
                        this.runLoseSequence(scene, currentStage, time, byFall);
                        break;
                    case 2:
                        if (scene.loseSequenceSound === false) {
                            scene.loseSound.play();
                            scene.loseSequenceSound = true;
                        } 
                        scene.cameras.main.stopFollow();
                        this.runLoseSequence(scene, currentStage, time * 200, byFall);
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
            if (item.type == ItemTypes.Coffee) {
                scene.player.fastSequenceActive = true;
                scene.fastSound.play();
            }
            if (item.type == ItemTypes.Camomile) {
                scene.player.slowSequenceActive = true;
                scene.slowSound.play();
            }             
            if (item.type == ItemTypes.Chocolate) {
                scene.fastSound.play();
            }
            scene.time.delayedCall(2000, () => {
                scene.player.fastSequenceActive = false;
                scene.player.slowSequenceActive = false;
            });
        }
    }
}

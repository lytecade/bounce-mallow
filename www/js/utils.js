export default class Utils {
    static loadResources = (scene, resourceCollection) => {
        for (const [key, value] of resourceCollection) {
            let resourcePath = "/assets/" + value.type + "/" + value.name + "." + value.ext;
            switch (value.type) {
                case "audio":
                    scene.load.audio(value.name, resourcePath);
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
        for (let i = 0; i < count; ++i) {
            const currentImage = scene.add.image(trackingXValue, 0, texture)
                .setOrigin(0, 0)
                .setScrollFactor(scrollFactor);
            trackingXValue += currentImage.width;
        }
    }
    static createSounds = (scene, resourceCollection) => {
        for (const [key, value] of resourceCollection) {
            if (value.type === "audio") {
                if (value.name.includes("jump")) {
                    scene.jumpSound = scene.sound.add(value.name);
                }
                if (value.name.includes("lose")) {
                    scene.loseSound = scene.sound.add(value.name);
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
	    scene.runLoseSequence(0, 5, lossByFall);
	}
    }
    static createItemSequence = (player, itemSprite) => {
        const scene = player.scene;
        const item = scene.items.find(i => i.sprite === itemSprite);
        if (item && item.activated === false) {
            console.log(`Item activated: ${item.activated}`);
            item.activated = true;
        }
    }
}

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
}

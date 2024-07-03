import { TileSettings } from "/js/constants.js";

export default class LevelChunk {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.tileSize = TileSettings.TileSize; 
        this.tileRows = TileSettings.TileRows;
        this.generate();
    }
    generate() {
        console.log('Run generate');
    }
    create() {
        console.log('Run create');
    }
    destroy() {
        console.log('Run destroy');
    }
}

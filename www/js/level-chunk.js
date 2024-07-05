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
        this.tileGroundLevel = TileSettings.TileGroundLevel;
        this.tiles = [];
        this.generate();
    }
    generate() {
        const widthInTiles = Math.min(Math.floor(this.width / this.tileSize));
        const heightInTiles = this.tileRows;
        for (let x = 0; x < widthInTiles; x++) {
            this.tiles[x] = [];
            for (let y = 0; y < heightInTiles; y++) {
                this.tiles[x][y] = 0; // 0 represents empty space
            }
        }
        let currentHeight = Math.floor(heightInTiles / 2); // Start at middle height
        for (let x = 0; x < widthInTiles; x++) {
            currentHeight += Phaser.Math.Between(-1, 1);
            currentHeight = Phaser.Math.Clamp(currentHeight, 3, heightInTiles - 3);
            for (let y = currentHeight; y < heightInTiles; y++) {
                if (y < currentHeight + this.tileGroundLevel) {
                    this.tiles[x][y] = 9; // Use tile index 2 for ground
                } else {
                    this.tiles[x][y] = 3; // Use tile index 3 for underground (optional)
                }
            }
        }
    }
    create() {
        const map = this.scene.make.tilemap({
            data: this.tiles,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize
        });
        const tiles = map.addTilesetImage("tileset-platform", "tileset-platform");
        this.groundLayer = map.createLayer(0, tiles, this.x, 0);
        //this.groundLayer.setCollisionByExclusion([-1, 0]); 
    }
    destroy() {
        if (this.groundLayer) {
            this.groundLayer.destroy();
        }
    }
}

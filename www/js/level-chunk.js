import { TileSettings } from "/js/constants.js";

export default class LevelChunk {
    constructor(scene, x, y, chunkSize) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.chunkSize = chunkSize;
        this.tileSize = TileSettings.TileSize; 
        this.tileRows = TileSettings.TileRows;
        this.tileGroundLevel = TileSettings.TileGroundLevel;
        this.tiles = [];
        this.generate();
    }
    generate() {
        const widthInTiles = Math.min(Math.floor(this.chunkSize / this.tileSize));
        for (let x = 0; x < widthInTiles; x++) {
            this.tiles[x] = [];
            for (let y = 0; y < this.tileRows; y++) {
                this.tiles[x][y] = 0; 
            }
        }
        const maxFloor = (this.tileRows - this.tileGroundLevel) - 1;
        for (let y = 0; y < this.tileRows; y++) {
            for (let x = 0; x < widthInTiles; x++) {
                if ((y + 1) > maxFloor) {
                    this.tiles[y][x] = 2;
                } else if ((y + 1) == maxFloor) {
                    this.tiles[y][x] = 9;
                }
            }
        }
        console.log(this.tiles);
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

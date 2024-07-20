import { TileSettings } from "/js/constants.js";

export default class LevelChunk {
    constructor(scene, x, y, chunkSize, chunkCliffs) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.chunkSize = chunkSize;
        this.tileSize = TileSettings.TileSize; 
        this.tileRows = TileSettings.TileRows;
        this.tileGroundLevel = TileSettings.TileGroundLevel;
        this.tiles = [];
        this.cliffProbability = 0.1;
        this.cliffShow = chunkCliffs;
        this.minCliffDistance = 5;
        this.generate();
    }
    generate() {
        const widthInTiles = Math.min(Math.floor(this.chunkSize / this.tileSize));
        for (let row = 0; row < widthInTiles; row++) {
            this.tiles[row] = [];
            for (let column = 0; column < this.tileRows; column++) {
                this.tiles[row][column] = 0; 
            }
        }
        const maxFloor = (this.tileRows - this.tileGroundLevel) - 1;
        let lastCliffEnd = -this.minCliffDistance;
        for (let row = 0; row < widthInTiles; row++) {
            for (let column = 0; column < this.tileRows; column++) {
                if ((row == 0) && column - lastCliffEnd >= this.minCliffDistance && Math.random() < this.cliffProbability) {
                    lastCliffEnd = column;
                }
                if ((row + 1) > maxFloor) {
                    this.tiles[row][column] = (this.cliffShow && (column == lastCliffEnd || column == (lastCliffEnd - 1))) ? 0 : 2;
                } else if ((row + 1) == maxFloor) {
                    this.tiles[row][column] = (this.cliffShow && (column == lastCliffEnd || column == (lastCliffEnd - 1))) ? 0 : 9;
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
        this.groundLayer = map.createLayer(0, tiles, this.x, 0).setCollisionByExclusion([-1, 0]);
    }
    destroy() {
        if (this.groundLayer) {
            this.groundLayer.destroy();
        }
    }
}

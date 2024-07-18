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
        this.cliffProbability = 0.1;
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
                    console.log("start cliff");
                    console.log(this.x);
                    console.log(row);
                    console.log(column);
                    lastCliffEnd = column;
                }
                if ((row + 1) > maxFloor) {
                    this.tiles[row][column] = (column == lastCliffEnd) ? 0 : 2;
                } else if ((row + 1) == maxFloor) {
                    this.tiles[row][column] = (column == lastCliffEnd) ? 0 : 9;
                }
            }
        }
    }

    generateCliff(startRow, maxFloor) {
        const cliffWidth = 2; // Width of the cliff
        for (let row = startRow; row < startRow + cliffWidth && row < this.tiles.length; row++) {
            for (let column = 0; column < this.tileRows; column++) {
                if (column > maxFloor) {
                    // Add some visual cue for the cliff (e.g., a different tile type)
                    this.tiles[row][column] = 3; // Assuming 3 is a cliff tile
                } else {
                    this.tiles[row][column] = 0; // Empty space for the cliff
                }
            }
        }
        return startRow + cliffWidth - 1; // Return the last row of the cliff
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

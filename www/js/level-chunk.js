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
        this.loseTiles = [];
        this.cliffProbability = 0.1;
        this.cliffShow = chunkCliffs;
        this.minCliffDistance = 7;
        this.loseLayer = null;
        this.enemySpawnPoint = null;
        this.generate();
    }
    generate() {
        const widthInTiles = Math.min(Math.floor(this.chunkSize / this.tileSize));
        for (let row = 0; row < widthInTiles; row++) {
            this.tiles[row] = [];
            this.loseTiles[row] = [];
            for (let column = 0; column < this.tileRows; column++) {
                this.tiles[row][column] = 0; 
                this.loseTiles[row][column] = 0; 
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
                    if (this.cliffShow && (column == lastCliffEnd || column == (lastCliffEnd - 1))) {
                        this.tiles[row][column] = 0;
                    } else {
                        this.tiles[row][column] = 2;
                        console.log(this.tiles[row][column]);
                    }
                } else if ((row + 1) == maxFloor) {
                    if (this.cliffShow && (column == lastCliffEnd || column == (lastCliffEnd - 1))) {
                        this.tiles[row][column] = 0;
                        this.loseTiles[row][column] = 1;
                    } else {
                        this.tiles[row][column] = 9;
                    }
                }
            }
        }
        this.generatePlatforms(widthInTiles, maxFloor);
        this.findEnemySpawnPoint(widthInTiles);
    }
    generatePlatforms(widthInTiles, maxFloor) {
        const platformLevel = maxFloor - 3; 
        for (let column = 0; column < widthInTiles; column++) {
            if (Math.random() < 0.1) { 
                const platformLength = Math.floor(Math.random() * 4) + 2; 
                for (let offset = 0; offset < platformLength; offset++) {
                    if (this.cliffShow && column + offset < widthInTiles) {
                        this.tiles[platformLevel][column + offset] = 9;
                    }
                }
            }
        }
    }
    findEnemySpawnPoint(tileWidth) {
        const groundLevel = this.tileRows - this.tileGroundLevel;
        let validSpawnPoints = [];
        for (let column = 1; column < tileWidth - 1; column++) {
            if (this.tiles[groundLevel][column] === 2 &&
                this.tiles[groundLevel][column - 1] === 2 &&
                this.tiles[groundLevel][column + 1] === 2 &&
                this.tiles[groundLevel][column - 2] === 2 &&
                this.tiles[groundLevel][column + 2] === 2 &&
                this.tiles[groundLevel][column - 3] === 2 &&
                this.tiles[groundLevel][column + 3] === 2) {
                validSpawnPoints.push(column);
            }
        }
        if (validSpawnPoints.length > 0) {
            const randomIndex = Math.floor(Math.random() * 6);
            if (this.cliffShow && randomIndex >= 0 && randomIndex < validSpawnPoints.length) {
	        const spawnColumn = validSpawnPoints[randomIndex];
	        this.enemySpawnPoint = {
	            x: this.x + spawnColumn * this.tileSize,
	            y: (groundLevel - 1) * this.tileSize
	        };
            }
        }
    }
    create() {
        const map = this.scene.make.tilemap({
            data: this.tiles,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize
        });
        const loseMap = this.scene.make.tilemap({
            data: this.loseTiles,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize
        });
        const mapLoseTiles = loseMap.addTilesetImage("tileset-platform", "tileset-platform");
        const tiles = map.addTilesetImage("tileset-platform", "tileset-platform");
        this.groundLayer = map.createLayer(0, tiles, this.x, 0).setCollisionByExclusion([-1, 0]);
        this.loseLayer = loseMap.createLayer(0, mapLoseTiles, this.x, 0);
        this.loseLayer.setVisible(false);
    }
    destroy() {
        if (this.groundLayer) {
            this.groundLayer.destroy();
        }
        if (this.loseLayer) {
            this.loseLayer.destroy();
        }
    }
}

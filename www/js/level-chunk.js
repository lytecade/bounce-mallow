import { LoseTileTypes, TileSettings } from "/js/constants.js";
import Utils from "/js/utils.js";

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
        let baseRow = -1;
        for (let row = 0; row < widthInTiles; row++) {
            for (let column = 0; column < this.tileRows; column++) {
                if ((row == 0) && column - lastCliffEnd >= this.minCliffDistance && Math.random() < this.cliffProbability) {
                    lastCliffEnd = column;
                }
                if ((row + 1) > maxFloor) {
                    if (column != 0 && (column < this.tileRows - 1) && this.cliffShow && (column == lastCliffEnd || column == (lastCliffEnd - 1))) {
                        this.tiles[row][column] = 0;
                    } else {
                        this.tiles[row][column] = 2;
                        if (this.tiles[row][column - 1] == 0 && this.tiles[row][column - 2] == 2) {
                            this.tiles[row][column - 1] = 2;
                        }
                    }
                } else if ((row + 1) == maxFloor) {
                    if (column != 0 && (column < this.tileRows - 1) && this.cliffShow && (column == lastCliffEnd || column == (lastCliffEnd - 1))) {
                        this.tiles[row][column] = 0;
                        this.loseTiles[row][column] = LoseTileTypes.Cliff;
                        if (this.tiles[row][column - 1] == 9) {
                            this.tiles[row][column - 1] = 10;
                        }
                    } else {
                        baseRow = baseRow == -1 ? row : baseRow;
                        this.tiles[row][column] = 9;
                        if (this.tiles[row][column - 1] == 0) {
                            if (this.tiles[row][column - 2] == 10) {
                                this.tiles[row][column - 1] = 9;
                                this.tiles[row][column - 2] = 9;
                            } else {
                                this.tiles[row][column] = 8;
                            }
                        }
                    }
                }
            }
            if (baseRow != -1) {
                for (let column = 0; column < this.tileRows; column++) {
                    if (this.tiles[baseRow][column] == 9 &&
                        this.tiles[baseRow][column - 1] == 9 &&
                        this.tiles[baseRow][column + 1] == 9 &&
                        this.tiles[baseRow][column - 1] == 9 &&
                        this.tiles[baseRow][column + 1] == 9 &&
                        this.tiles[baseRow][column - 2] == 9 &&
                        this.tiles[baseRow][column + 2] == 9 &&
                        Math.random() < this.cliffProbability &&
                        this.cliffShow
                    ) {
                        this.tiles[baseRow][column - 1] = 10;
                        this.tiles[baseRow][column] = 19;
                        this.tiles[baseRow][column + 1] = 19;
                        this.tiles[baseRow][column + 2] = 8;
                        this.loseTiles[baseRow][column] = LoseTileTypes.Spikes;
                        this.loseTiles[baseRow][column + 1] = LoseTileTypes.Spikes;
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
            let randomIndex = Math.random();
            if (randomIndex < 0.1 && column != 0 && (column < widthInTiles - 1)) { 
                const platformLength = Math.floor(Math.random() * 4) + 1; 
                for (let offset = 0; offset < platformLength; offset++) {
                    if (this.cliffShow && column + offset < widthInTiles) {
                        this.tiles[platformLevel][column + offset] = 5;
                    } else {
                        this.tiles[platformLevel][column + offset] = 0;
                    }
                }
            }
        }
        for (let column = 0; column < widthInTiles; column++) {
            if (this.tiles[platformLevel][column] == 5) {
	        if (Utils.isValueEmpty(this.tiles[platformLevel][column - 1]) && Utils.isValueEmpty(this.tiles[platformLevel][column + 1])) {
	            this.tiles[platformLevel][column] = 1;
	        } else if (Utils.isValueEmpty(this.tiles[platformLevel][column - 1]) && !Utils.isValueEmpty(this.tiles[platformLevel][column + 1])) {
	            this.tiles[platformLevel][column] = 4;
	        } else if (!Utils.isValueEmpty(this.tiles[platformLevel][column - 1]) && Utils.isValueEmpty(this.tiles[platformLevel][column + 1])) {
	            this.tiles[platformLevel][column] = 6;
                }
            } 
        }
    }
    findEnemySpawnPoint(tileWidth) {
        const groundLevel = (this.tileRows - this.tileGroundLevel) - 2;
        let validSpawnPoints = [];
        let platformLevels = [5, 6];
        let groundLevels = [2, 8, 9, 10];
        for (let column = 1; column < tileWidth - 1; column++) {
            if (platformLevels.includes(this.tiles[groundLevel - 2][column]) &&
                platformLevels.includes(this.tiles[groundLevel - 2][column - 1]) &&
                platformLevels.includes(this.tiles[groundLevel - 2][column + 1])
            ) {
                validSpawnPoints.push({ row: (groundLevel - 4), col: column });
            } else if (groundLevels.includes(this.tiles[groundLevel][column]) &&
                groundLevels.includes(this.tiles[groundLevel][column - 1]) &&
                groundLevels.includes(this.tiles[groundLevel][column + 1]) &&
                groundLevels.includes(this.tiles[groundLevel][column - 2]) &&
                groundLevels.includes(this.tiles[groundLevel][column + 2]) 
            ) {
                validSpawnPoints.push({ row: groundLevel, col: column });
            }
        }
        if (validSpawnPoints.length > 0) {
            const randomIndex = Math.floor(Math.random() * 7);
            if (this.cliffShow && randomIndex >= 0 && randomIndex < validSpawnPoints.length) {
	        const spawnColumn = validSpawnPoints[randomIndex];
	        this.enemySpawnPoint = {
	            x: this.x + spawnColumn.col * this.tileSize,
	            y: (spawnColumn.row - 1) * this.tileSize
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
        this.groundLayer = map.createLayer(0, tiles, this.x, 0).setCollisionByExclusion([-1, 0, 19]);
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

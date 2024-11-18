export const BASE_RESOURCES = new Map([
    ["sfx-fast", { type: "sounds", name: "sfx-fast", ext: "wav" }],
    ["sfx-slow", { type: "sounds", name: "sfx-slow", ext: "wav" }],
    ["sfx-jump", { type: "sounds", name: "sfx-jump", ext: "wav" }],
    ["sfx-lose", { type: "sounds", name: "sfx-lose", ext: "wav" }],
    ["sprite-player", { type: "spritesheets", name: "sprite-player", ext: "png" }],
    ["sprite-enemy-spike", { type: "spritesheets", name: "sprite-enemy-spike", ext: "png" }],
    ["sprite-hud", { type: "spritesheets", name: "sprite-hud", ext: "png" }],
    ["sprite-items", { type: "spritesheets", name: "sprite-items", ext: "png" }],
    ["tileset-platform", { type: "tilesets", name: "tileset-platform", ext: "png" }],
    ["background-hills", { type: "images", name: "background-hills", ext: "png" }]
]);

export const ItemTypes = {
    Coffee: 'COFFEE',
    Camomile: 'CAMOMILE',
    Chocolate: 'CHOCOLATE'
};

export const SpeedTypes = {
    Normal: 60,
    Slow: 30,
    Fast: 90,
    Jump: 240,
    DoubleJump: 280
};

export const LoseTileTypes = {
    Cliff: 1,
    Spikes: 2
};

export const TileSettings = {
    TileSize: 8,
    TileRows: 11,
    TileGroundLevel: 3,
    TileChunkDefaultSize: 88,
    TileChunkDefaultActive: 4,
};


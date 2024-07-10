export const DYN_RESOURCES = new Map([
    ["tileset-platform", {
        type: "tilesets",
        name: "tileset-platform",
        ext: "png",
        options: {}
    }]
]);

export const BASE_RESOURCES = new Map([
    ["sfx-fast", {
        type: "sounds",
        name: "sfx-fast",
        ext: "wav",
        options: {}
    }],
    ["sfx-slow", {
        type: "sounds",
        name: "sfx-slow",
        ext: "wav",
        options: {}
    }],
    ["sfx-jump", {
        type: "sounds",
        name: "sfx-jump",
        ext: "wav",
        options: {}
    }],
    ["sfx-lose", {
        type: "sounds",
        name: "sfx-lose",
        ext: "wav",
        options: {}
    }],
    ["bgm-level", {
        type: "music",
        name: "bgm-level",
        ext: ["wav", "ogg"],
        options: {}
    }],
    ["sprite-player", {
        type: "spritesheets",
        name: "sprite-player",
        ext: "png",
        options: {
            frameWidth: 8,
            frameHeight: 8,
            margin: 0,
            spacing: 0
        }
    }],
    ["sprite-enemy-spike", {
        type: "spritesheets",
        name: "sprite-enemy-spike",
        ext: "png",
        options: {
            frameWidth: 8,
            frameHeight: 8,
            margin: 0,
            spacing: 0
        }
    }],
    ["sprite-items", {
        type: "spritesheets",
        name: "sprite-items",
        ext: "png",
        options: {
            frameWidth: 8,
            frameHeight: 8,
            margin: 0,
            spacing: 0
        }
    }],
    ["tileset-platform", {
        type: "tilesets",
        name: "tileset-platform",
        ext: "png",
        options: {}
    }],
    ["tilemap-platform", {
        type: "tilemaps",
        name: "tilemap-platform",
        ext: "json",
        options: {}
    }]
]);

export const BACKGROUND_RESOURCES_HILLS = new Map([
    ["background-hills", {
        type: "images",
        name: "background-hills",
        ext: "png",
        options: {}
    }],
    ["background-hills-front", {
        type: "images",
        name: "background-hills-front",
        ext: "png",
        options: {}
    }]
]);

export const ItemTypes = {
    Coffee: 'COFFEE', 
    Camomile: 'CAMOMILE',
    Chocolate: 'CHOCOLATE'
};

export const SpeedTypes = {
    Normal: 80,
    Slow: 40,
    Fast: 120
};

export const TileSettings = {
    TileSize: 8,
    TileRows: 11,
    TileGroundLevel: 3,
    TileChunkDefaultSize: 88,
    TileChunkDefaultActive: 5,
}

export const BASE_RESOURCES = new Map([
    ["sfx-jump", {
        type: "audio",
        name: "sfx-jump",
        ext: "wav",
        options: {}
    }],
    ["sfx-lose", {
        type: "audio",
        name: "sfx-lose",
        ext: "wav",
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

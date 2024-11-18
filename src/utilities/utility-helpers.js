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

export class Utils {
    static isValueEmpty = (resourceValue) => {
        if (resourceValue === 0 || resourceValue === undefined || resourceValue === "") {
            return true;
        }
        return false;
    }
    static runLoseSequenceDynamic(scene, currentStage, time, byFall) {
        scene.time.delayedCall(time, () => {
            currentStage++;
            if (byFall === true) {
                if (currentStage === 1) {
                    if (scene.loseSequenceSound === false) {
                        scene.loseSound.play();
                        scene.loseSequenceSound = true;
                    }
                    scene.cameras.main.stopFollow();
                    this.runLoseSequenceDynamic(scene, currentStage, time * 400, byFall);
                } else {
                    scene.scene.restart();
                }
            } else {
                switch (currentStage) {
                    case 1:
                        if (scene.player.sprite.anims) {
                            scene.player.sprite.anims.play("player-destroy", true);
                        }
                        this.runLoseSequenceDynamic(scene, currentStage, time, byFall);
                        break;
                    case 2:
                        if (scene.loseSequenceSound === false) {
                            scene.loseSound.play();
                            scene.loseSequenceSound = true;
                        }
                        scene.cameras.main.stopFollow();
                        this.runLoseSequenceDynamic(scene, currentStage, time * 200, byFall);
                        break;
                    default:
                        scene.scene.restart();
                }
            }
        }, [], this);
    }
    static createItemSequence = (playerReference, itemSprite) => {
        const scene = playerReference.scene;
        const item = scene.items.find(i => i.sprite === itemSprite);
        if (item && item.activated === false) {
            item.activated = true;
            itemSprite.setVisible(false);
            scene.player.fastSequenceActive = false;
            scene.player.slowSequenceActive = false;
            if (item.type === ItemTypes.Coffee) {
                scene.player.fastSequenceActive = true;
                scene.fastSound.play();
            }
            if (item.type === ItemTypes.Camomile) {
                scene.player.slowSequenceActive = true;
                scene.slowSound.play();
            }
            if (item.type === ItemTypes.Chocolate) {
                scene.fastSound.play();
                scene.hudJumpBarCounter++;
                if (scene.hudJumpBarCounter > 3) {
                    scene.hudJumpBarCounter = 3;
                }
                this.setHudBar(scene);
            }
            scene.time.delayedCall(2000, () => {
                scene.player.fastSequenceActive = false;
                scene.player.slowSequenceActive = false;
            });
        }
    }
    static setHudBar = (sceneReference) => {
	switch (sceneReference.hudJumpBarCounter) {
	    case 0:
		sceneReference.hudBar.setFrame(16);
		break;
	    case 1:
		sceneReference.hudBar.setFrame(17);
		break;
	    case 2:
		sceneReference.hudBar.setFrame(18);
		break;
	    case 3:
		sceneReference.hudBar.setFrame(19);
		break;
	    default:
		break;
	}
    }
}

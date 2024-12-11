import UIs from "./utility-uis.js"
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
export class Helpers {
    static isValueEmpty = (resourceValue) => {
        if (resourceValue === 0 || resourceValue === undefined || resourceValue === "") {
            return true;
        }
        return false;
    }
    static getOutOfBoundsCount = (objectList, xValue) => {
        let baseIndexCount = 0;
        for (let i = 0; i < objectList.length; i++) {
            if (objectList[i].sprite.x < xValue) {
                baseIndexCount = baseIndexCount + 1;
            }
        }
        return baseIndexCount;
    }
    static setObjectRemoveByCount = (countValue, scene, sceneObject, sceneObjectCollider) => {
        for (let r = 0; r < countValue; r++) {
            sceneObject.shift();
            scene.physics.world.removeCollider(sceneObjectCollider.shift());
        }
    }    
    static setLoseSequence = (scene, currentStage, time, byFall) => {
        scene.time.delayedCall(time, () => {
            currentStage++;
            if (byFall === true) {
                if (currentStage === 1) {
                    if (scene.loseSequenceSound === false) {
                        scene.loseSound.play();
                        scene.loseSequenceSound = true;
                    }
                    scene.cameras.main.stopFollow();
                    this.setLoseSequence(scene, currentStage, time * 400, byFall);
                } else {
                    scene.scene.restart();
                }
            } else {
                switch (currentStage) {
                    case 1:
                        if (scene.player.sprite.anims) {
                            scene.player.sprite.anims.play("player-destroy", true);
                        }
                        this.setLoseSequence(scene, currentStage, time, byFall);
                        break;
                    case 2:
                        if (scene.loseSequenceSound === false) {
                            scene.loseSound.play();
                            scene.loseSequenceSound = true;
                        }
                        scene.cameras.main.stopFollow();
                        this.setLoseSequence(scene, currentStage, time * 200, byFall);
                        break;
                    default:
                        if (scene.lifeBarCounter > 1) {
                            scene.scene.restart();
                        } else {
                            scene.scene.stop(scene.scene.key);
                            scene.scene.start('EndScene');
                        }
                }
            }
        }, [], this);
    }
    static setItemSequence = (playerReference, itemSprite) => {
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
                UIs.setHudBar(scene);
            }
            scene.time.delayedCall(2000, () => {
                scene.player.fastSequenceActive = false;
                scene.player.slowSequenceActive = false;
            });
        }
    }
    static setScoreCounter = (counterReference) => {
        let currentScoreCounter = 0;
        for (let i = 0; i < counterReference[0]; i++) {
            currentScoreCounter = currentScoreCounter + 10;
        }
        for (let j = 0; j < counterReference[1]; j++) {
            currentScoreCounter = currentScoreCounter + 1;
        }
        return currentScoreCounter;
    }
    static setScoreRegister = (settingsReference, counterValue) => {
        if (settingsReference.get('settingScoreSet') === undefined) {
            settingsReference.set('settingScoreSet', []);
        }
        let scoreSetting = settingReference.get('settingScoreSet');
        if (counterValue != undefined && counterValue != null) {
            scoreSetting.push(counterValue);
            settingsReference.set('settingScoreSet', scoreSetting);
        }
    }
}


export default class UIs {
    static setHudCounter = (scene) => {
        scene.hudCounters = [0, 0];
        scene.hudCounterImages = [];
        scene.hudBar = scene.add.image(10, 9, 'sprite-hud', 16).setOrigin(1, 0).setScrollFactor(0);
        scene.hudJumpBarCounter = 0;
        for (let i = 0; i < scene.hudCounters.length; i++) {
            scene.hudCounterImages.push(scene.add.image(16 + (i * 4), 9, 'sprite-hud', 0).setOrigin(1, 0).setScrollFactor(0));
        }
        scene.hudTimer = scene.time.addEvent({ 
            delay: 1000, 
            callback: () => {
                if (scene.player.movementState && !scene.loseSequenceActive) {
                    scene.hudCounters[scene.hudCounters.length - 1]++;
                    for (let i = scene.hudCounters.length - 1; i >= 0; i--) {
                        if (scene.hudCounters[i] > 9) {
                            scene.hudCounters[i] = 0;
                            if (i > 0) {
                                scene.hudCounters[i - 1]++;
                            }
                        }
                    }
                    for (let i = 0; i < scene.hudCounters.length; i++) {
                        scene.hudCounterImages[i].setFrame(scene.hudCounters[i]);
                    }
                }
            }, 
            callbackScope: scene, 
            loop: true 
        });
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
    static setLifeCounter = (scene, settings) => {
        scene.lifeBarCounter = 5;
        if (settings.get('settingLiveCounter') === undefined) {
            settings.set('settingLiveCounter', scene.lifeBarCounter);
        } else {
            scene.lifeBarCounter = settings.get('settingLiveCounter');
        }
        if (settings.get('settingLiveRemoved') === undefined) {
            settings.set('settingLiveRemoved', false);
        } else if (settings.get('settingLiveRemoved') === true){
            let tempCount = settings.get('settingLiveCounter');
            scene.lifeBarCounter = tempCount - 1;
            settings.set('settingLiveCounter', scene.lifeBarCounter);
            settings.set('settingLiveRemoved', false);
        }
    }
    static setLifeBar = (scene) => {
        scene.lifeBarImages = [];
        for (let h = 0; h < scene.lifeBarCounter; h++) {
            scene.lifeBarImages.push(scene.add.image(10 + (h * 6), 16, 'sprite-hud', 10).setOrigin(1, 0).setScrollFactor(0));
        }    
    }
    static setAudioStatus = (scene, settings) => {
        if (settings.get('settingAudioActive') === undefined) {
            settings.set('settingAudioActive', true);
            scene.audioBar = scene.add.image(10, 54, 'sprite-hud', 14).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
            scene.sound.volume = 1;
        } else if (settings.get('settingAudioActive') === false) {
            scene.audioBar = scene.add.image(10, 54, 'sprite-hud', 15).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
            scene.sound.volume = 0;
        } else {
            scene.audioBar = scene.add.image(10, 54, 'sprite-hud', 14).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
            scene.sound.volume = 1;
        }
    }
    static setAudioUpdate = (scene) => {
        if (scene.audioBar.frame.name == 15) {
            scene.sound.volume = 0;
        } else if (scene.audioBar.frame.name == 14) {
            scene.sound.volume = 1;
        }
    }
    static setAudioBar = (scene, playerReference, audioBarReference, audioBarPressedReference) => {
        scene.input.on('pointerdown', function (pointer) {
            if (audioBarReference.getBounds().contains(pointer.x, pointer.y)) {
                if (audioBarPressedReference.registry.get('settingAudioActive') === true) {
                    audioBarReference.setFrame(15);
                    audioBarPressedReference.registry.set('settingAudioActive', false);
                } else {
                    audioBarReference.setFrame(14);
                    audioBarPressedReference.registry.set('settingAudioActive', true);
                }
            } else {
                if (playerReference.movementState === false) {
                    playerReference.switchMovementState();
                } else {
                    playerReference.switchJumpState(true, false, playerReference.sprite);
                }
            }
        });
        scene.input.on('pointerup', function (pointer) {
            if (playerReference.movementState !== false) {
                playerReference.switchJumpState(false, true, playerReference.sprite);
            }
        });
    }
    static setTitleResource = (scene) => {
		const centerX = scene.cameras.main.width / 2;
        scene.titleBanner = scene.add.image(centerX, 8, "image-title").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        scene.buttonPlay = scene.add.image(centerX, 44, "image-playbutton").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        scene.buttonGuide = scene.add.image(centerX, 54, "image-guidebutton").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
	}
	static setTitleInput = (scene, playReference, guideReference) => {
        scene.input.on('pointerdown', function (pointer) {
            if (playReference.getBounds().contains(pointer.x, pointer.y)) {
                scene.scene.stop('InitScene');
				scene.scene.start('ActionScene');
			}
            if (guideReference.getBounds().contains(pointer.x, pointer.y)) {
                console.log('guide button pressed');
			}
		});
	}

}


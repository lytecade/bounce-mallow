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
        if (settings.get('settingLiveCounter') === null || settings.get('settingLiveCounter') === undefined) {
            settings.set('settingLiveCounter', scene.lifeBarCounter);
        } else {
            scene.lifeBarCounter = settings.get('settingLiveCounter');
        }
        if (settings.get('settingLiveRemoved') === null || settings.get('settingLiveRemoved') === undefined) {
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
    static setFinalCounter = (scene, settingsReference) => {
        let scoreSetting = settingsReference.get('settingScoreSet');
        let leftCounter = 40;
        let rightCounter = 44;
        let totalCount = 0;
        scene.countImages = [];
        for (let i = 0; i < 5; i++) {
            let leftScore = 0;
            let rightScore = 0;
            if (scoreSetting[i]) {
                rightScore = scoreSetting[i] % 10;
                leftScore = scoreSetting[i] - rightScore;
                totalCount = totalCount + scoreSetting[i];
            }
            scene.countImages.push(scene.add.image(leftCounter, 20, 'sprite-hud', (leftScore <= 0 ? 20 : (leftScore / 10) + 20)).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
            scene.countImages.push(scene.add.image(rightCounter, 20, 'sprite-hud', (20 + rightScore)).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
            leftCounter = leftCounter + 12;
            rightCounter = rightCounter + 12;
        }
        let rightTotal = totalCount % 10;
        let leftTotal = totalCount - rightTotal;
        scene.countImages.push(scene.add.image(64, 37, 'sprite-hud', (leftTotal <= 0 ? 20 : (leftTotal / 10) + 20)).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
        scene.countImages.push(scene.add.image(68, 37, 'sprite-hud', (20 + rightTotal)).setOrigin(1, 0).setScrollFactor(0).setDepth(101));
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
        scene.titleBanner = scene.add.image(centerX, 10, "image-title").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        scene.buttonPlay = scene.add.image(centerX, 43, "image-playbutton").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        scene.buttonGuide = scene.add.image(centerX, 53, "image-guidebutton").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
    }
    static setGuideResource = (scene) => {
        const centerX = scene.cameras.main.width / 2;
        if (scene.slideBanner1 == undefined || scene.slideBanner2 == undefined || scene.slideBanner3 == undefined || 
            scene.slideBanner1 == null || scene.slideBanner2 == null || scene.slideBanner3 == null) {
            scene.slideBanner1 = scene.add.image(centerX, 22, "image-slide1").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
            scene.slideBanner2 = scene.add.image(centerX, 22, "image-slide2").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
            scene.slideBanner3 = scene.add.image(centerX, 22, "image-slide3").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        }
        switch(scene.slideCount) {
            case 3:
                scene.slideBanner3.setVisible(true);
                scene.slideBanner2.setVisible(false);
                scene.slideBanner1.setVisible(false);
                scene.buttonPrev.setVisible(true);
                scene.buttonNext.setVisible(false);
            break;
            case 2:
                scene.slideBanner3.setVisible(false);
                scene.slideBanner2.setVisible(true);
                scene.slideBanner1.setVisible(false);
                scene.buttonPrev.setVisible(true);
                scene.buttonNext.setVisible(true);
            break;
            case 1:
            default:
                scene.slideBanner3.setVisible(false);
                scene.slideBanner2.setVisible(false);
                scene.slideBanner1.setVisible(true);
                scene.buttonPrev.setVisible(false);
                scene.buttonNext.setVisible(true);
        }
    }
    static setBannerResource = (scene) => {
        const centerX = scene.cameras.main.width / 2;
        scene.screenBanner = scene.add.image(centerX, 10, "image-banner").setOrigin(0.5, 0).setScrollFactor(0);
    }
    static setBannerWording = (scene, title, yindex) => {
        const centerX = scene.cameras.main.width / 2;
        scene.bannerTitle = scene.add.image(centerX, yindex, title).setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
    }
    static setBackResource = (scene, addNextAndPrev) => {
        const centerX = scene.cameras.main.width / 2;
        scene.buttonBack = scene.add.image(centerX, 53, "image-backbutton").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        if (addNextAndPrev === true) {
            scene.buttonNext = scene.add.image(centerX + 30, 53, "image-nextbutton").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
            scene.buttonPrev = scene.add.image(centerX - 30, 53, "image-prevbutton").setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
        }
    }
    static setButtonInput = (scene, buttonReference, stopKey, startKey) => {
        scene.input.on('pointerdown', function (pointer) {
            if (buttonReference.getBounds().contains(pointer.x, pointer.y)) {
                scene.scene.stop(stopKey);
                scene.scene.start(startKey);
            }
        });
    }
    static setSlideButtonInput = (scene, buttonReference, goForward) => {
        let utilityContext = this; 
        scene.input.on('pointerdown', function (pointer) {
            if (buttonReference.getBounds().contains(pointer.x, pointer.y)) {
                scene.slideCount = goForward === true ? scene.slideCount + 1 : scene.slideCount - 1;
                if (scene.slideCount > 3) {
                    scene.slideCount = 3;
                } else if (scene.slideCount < 1) {
                    scene.slideCount = 1;
                }
            }
            utilityContext.setGuideResource(scene);
        });
    }
}


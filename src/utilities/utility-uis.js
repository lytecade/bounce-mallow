export default class UIs {
	static setHudCounter = (scene) => {
		const currentUI = this;
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
                currentUI.runHudCount(scene)
			}, 
            callbackScope: scene, 
            loop: true 
        });
	}
    static runHudCount = (scene) => {
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


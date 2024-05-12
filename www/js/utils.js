export default class Utils {
	static loadResources = (scene, resourceCollection) => {
		for (const [key, value] of resourceCollection) {
			let resourcePath = "/assets/" + value.type + "/" + value.name + "." + value.ext;
			console.log(resourcePath);
			if(value.type === 'audio') {
				scene.load.audio(value.name, resourcePath);
			}
		}
	}
	static createBackgrounds = (scene, count, texture, scrollFactor) => {
		let trackingXValue = 0;
		for(let i = 0; i < count; ++i) {
			const currentImage = scene.add.image(trackingXValue, 0, texture)
				.setOrigin(0, 0)
				.setScrollFactor(scrollFactor);
			trackingXValue += currentImage.width;
		}	
	}
}

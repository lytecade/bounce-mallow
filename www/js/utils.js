export default class Util {
	static loadResources = (resourceCollection) => {
		for (const [key, value] of resourceCollection) {
			console.log(`Key: ${key}, Type: ${value.type}, Name: ${value.name}`);
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

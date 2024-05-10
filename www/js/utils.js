export default class Util {
	static createAlignedBackground = (scene, count, texture, scrollFactor) => {
		let trackingXValue = 0;
		for(let i = 0; i < count; ++i) {
			const backgroundImage = scene.add.image(trackingXValue, 0, texture)
				.setOrigin(0, 0)
				.setScrollFactor(scrollFactor);
			trackingXValue += backgroundImage.width;
		}	
	}
}

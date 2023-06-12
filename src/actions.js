const { combineRgb, splitRgb } = require('@companion-module/base');

const colorsys = require('colorsys');

module.exports = {
	initActions: function () {
		let self = this;
		let actions = {};

		actions.turnOn = {
			name: 'Turn On',
			options: [],
			callback: async function (action) {
				self.GOVEE.turnOn()
				.then((data) => {
					self.INFO.power = 'on';
					self.checkVariables();
					self.checkFeedbacks();
				})
				.catch((error) => {
					self.processError(error);
				});
			}
		}

		actions.turnOff = {
			name: 'Turn Off',
			options: [],
			callback: async function (action) {
				self.GOVEE.turnOff()
				.then((data) => {
					self.INFO.power = 'off';
					self.checkVariables();
					self.checkFeedbacks();
				})
				.catch((error) => {
					self.processError(error);
				});
			}
		}

		actions.changeBrightness = {
			name: 'Change Brightness',
			options: [
				{
					type: 'number',
					label: 'Brightness',
					id: 'brightness',
					default: 100,
					min: 0,
					max: 100,
					required: true,
					range: false,
				}
			],
			callback: async function (action) {
				self.GOVEE.setBrightness(action.options.brightness)
				.then((data) => {
					self.INFO.power = 'on';
					self.INFO.brightness = action.options.brightness;
					self.checkVariables();
					self.checkFeedbacks();
				})
				.catch((error) => {
					self.processError(error);
				});
			}
		}

		actions.changeColor = {
			name: 'Change Color',
			options: [
				{
					type: 'colorpicker',
					label: 'Color',
					id: 'color',
					default: combineRgb(255, 255, 255),
					required: true,
				}
			],
			callback: async function (action) {
				let color = splitRgb(action.options.color);
				try {
					let hex = colorsys.rgbToHex(color.r, color.g, color.b);
					self.GOVEE.setColor(hex)
					.then((data) => {
						self.INFO.power = 'on';
						self.INFO.color = hex;
						self.checkVariables();
						self.checkFeedbacks();
					})
					.catch((error) => {
						self.processError(error);
					});
				}
				catch(error) {
					//probably error converting to hex
					self.log('error', 'Error changing color: ' + error.toString());
				}
			}
		}

		self.setActionDefinitions(actions);
	}
}
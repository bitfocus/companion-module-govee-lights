const { combineRgb, splitRgb } = require('@companion-module/base');

const colorsys = require('colorsys');

module.exports = {
	initActions: function () {
		let self = this;
		let actions = {};

		actions.power = {
			name: 'Power',
			options: [
				{
					type: 'dropdown',
					label: 'Power',
					id: 'power',
					default: 'on',
					choices: [
						{ id: 'on', label: 'On' },
						{ id: 'off', label: 'Off' },
						{ id: 'toggle', label: 'Toggle' },
					]
				}
			],
			callback: async function (action) {
				if (action.options.power === 'on') {
					if (self.config.verbose) {
						self.log('info', 'Setting power to on');
					}
					self.GOVEE.turnOn()
					.then((data) => {
						self.updateApiCalls('power');
						self.INFO.power = 'on';
						self.checkVariables();
						self.checkFeedbacks();
					})
					.catch((error) => {
						self.processError(error);
					});
				}
				else if (action.options.power === 'off') {
					if (self.config.verbose) {
						self.log('info', 'Setting power to off');
					}
					self.GOVEE.turnOff()
					.then((data) => {
						self.updateApiCalls('power');
						self.INFO.power = 'off';
						self.checkVariables();
						self.checkFeedbacks();
					})
					.catch((error) => {
						self.processError(error);
					});
				}
				else if (action.options.power === 'toggle') {
					if (self.INFO.power === 'on') {
						if (self.config.verbose) {
							self.log('info', 'Setting power to off');
						}
						self.GOVEE.turnOff()
						.then((data) => {
							self.updateApiCalls('power');
							self.INFO.power = 'off';
							self.checkVariables();
							self.checkFeedbacks();
						})
						.catch((error) => {
							self.processError(error);
						});
					}
					else {
						if (self.config.verbose) {
							self.log('info', 'Setting power to on');
						}
						self.GOVEE.turnOn()
						.then((data) => {
							self.updateApiCalls('power');
							self.INFO.power = 'on';
							self.checkVariables();
							self.checkFeedbacks();
						})
						.catch((error) => {
							self.processError(error);
						});
					}
				}
			}
		};

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

		/*actions.changeBrightnessAndColor = {
			name: 'Change Brightness and Color',
			options: [
				{
					type: 'number',
					label: 'Brightness',
					description: 'Enter a value between 1 - 100',
					id: 'brightness',
					default: 100,
					min: 1,
					max: 100,
					required: true,
					range: false,
				},
				{
					type: 'colorpicker',
					label: 'Color',
					id: 'color',
					default: combineRgb(255, 255, 255),
					required: true,
				}
			],
			callback: async function (action) {
				let brightness = action.options.brightness;
				if (self.INFO.brightness !== brightness) {
					if (self.config.verbose) {
						self.log('info', 'Setting brightness to ' + brightness);
					}
					self.GOVEE.setBrightness(action.options.brightness)
					.then((data) => {
						self.updateApiCalls('brightness');
						self.INFO.power = 'on';
						self.INFO.brightness = action.options.brightness;
						self.checkVariables();
						self.checkFeedbacks();
					})
					.catch((error) => {
						self.processError(error);
					});
				}

				let color = splitRgb(action.options.color);
				try {
					let hex = colorsys.rgbToHex(color.r, color.g, color.b);
					if (self.INFO.color !== hex) {
						if (self.config.verbose) {
							self.log('info', 'Setting color to ' + hex);
						}
						self.GOVEE.setColor(hex)
						.then((data) => {
							self.updateApiCalls('color');
							self.INFO.power = 'on';
							self.INFO.color = hex;
							self.checkVariables();
							self.checkFeedbacks();
						})
						.catch((error) => {
							self.processError(error);
						});
					}
				}
				catch(error) {
					//probably error converting to hex
					self.log('error', 'Error changing color: ' + error.toString());
				}
			}
		}*/

		self.setActionDefinitions(actions);
	}
}
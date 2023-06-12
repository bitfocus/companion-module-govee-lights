const { combineRgb } = require('@companion-module/base');

module.exports = {
	initFeedbacks: function () {
		let self = this;
		let feedbacks = {};

		const foregroundColor = combineRgb(255, 255, 255) // White
		const backgroundColorRed = combineRgb(255, 0, 0) // Red

		feedbacks.powerState = {
			type: 'boolean',
			name: 'Last Power State',
			description: 'Indicate if Device is On or Off based on last known power state',
			defaultStyle: {
				color: foregroundColor,
				bgcolor: backgroundColorRed,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Indicate in X State',
					id: 'option',
					default: 'on',
					choices: [
						{ id: 'off', label: 'Off' },
						{ id: 'on', label: 'On' },
					],
				},
			],
			callback: function (feedback, bank) {
				var opt = feedback.options
				if (self.INFO && self.INFO.power) {
					if (self.INFO.power === opt.option) {
						return true;
					}
				}

				return false
			}
		}

		self.setFeedbackDefinitions(feedbacks);
	}
}

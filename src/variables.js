module.exports = {
	initVariables: function () {
		let self = this;

		let variables = [];

		variables.push({ variableId: 'device', name: 'MAC Address' })
		variables.push({ variableId: 'model', name: 'Model' })
		variables.push({ variableId: 'device_name', name: 'Device Name' })
				
		variables.push({ variableId: 'power', name: 'Last Set Power State' })
		variables.push({ variableId: 'brightness', name: 'Last Set Brightness' })
		variables.push({ variableId: 'color', name: 'Last Set Color' })

		self.setVariableDefinitions(variables);
	},

	checkVariables: function () {
		let self = this;

		try {
			let variableObj = {};

			variableObj.power = self.INFO.power;
			variableObj.brightness = self.INFO.brightness;
			variableObj.color = self.INFO.color;

			self.setVariableValues(variableObj);
		}
		catch(error) {
			self.log('error', 'Error setting variables: ' + error);
		}
	}
}

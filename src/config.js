const { Regex } = require('@companion-module/base')

module.exports = {
	getConfigFields() {
		let self = this;

		return [
			{
				type: 'static-text',
				id: 'info',
				width: 12,
				label: 'Information',
				value: 'This module controls Govee lights. See the HELP file for more information and how to get started.',
			},
			{
				type: 'textinput',
				id: 'api_key',
				label: 'Govee API Key',
				width: 12,
				default: '',
			},
			{
				type: 'dropdown',
				id: 'govee_device',
				label: 'Govee Device (Auto Detected)',
				width: 12,
				default: self.GOVEE_DEVICES[0].id,
				choices: self.GOVEE_DEVICES,
			},
			{
				type: 'textinput',
				id: 'device_mac',
				label: 'Manually Specify Govee Device MAC Address',
				width: 12,
				default: '',
				isVisible: (configValues) => configValues.govee_device === 'manual',
			},
			{
				type: 'textinput',
				id: 'model',
				label: 'Govee Device Model',
				width: 12,
				default: 'H610A',
				isVisible: (configValues) => configValues.govee_device === 'manual',
			},
			/*{
				type: 'checkbox',
				id: 'intervalEnabled',
				label: 'Enable Update Interval (Periodically request new information from the device)',
				width: 12,
				default: false
			},*/
			{
				type: 'static-text',
				id: 'info2',
				label: 'Verbose Logging',
				width: 12,
				value: `
					<div class="alert alert-info">
						Enabling this option will put more detail in the log, which can be useful for troubleshooting purposes.
					</div>
				`
			},
			{
				type: 'checkbox',
				id: 'verbose',
				label: 'Enable Verbose Logging',
				default: false,
				width: 12
			},
		]
	}
}
const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base')
const UpgradeScripts = require('./src/upgrades')

const config = require('./src/config')
const actions = require('./src/actions')
const feedbacks = require('./src/feedbacks')
const variables = require('./src/variables')
const presets = require('./src/presets')

const api = require('./src/api')

class goveeInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...api,
		})

		this.INTERVAL = null; //used to poll the device every second

		this.GOVEE = null;

		this.GOVEE_DEVICES = [
			{ id: 'select', label: 'No Devices Detected. Enter your API key, click "Save", wait a moment, and then return to this config to choose a device.' },
			{ id: 'manual', label: 'Manually Enter Device MAC Address and Model' }
		];

		this.INFO = {
			power: 'off',
			brightness: '',
			color: '',
		};
	}

	async destroy() {
		let self = this;

		if (self.INTERVAL) {
			clearInterval(self.INTERVAL);
			self.INTERVAL = null;
		}
	}

	async init(config) {
		this.configUpdated(config)
	}

	async configUpdated(config) {
		this.config = config

		if (this.config.verbose) {
			this.log('info', 'Verbose mode enabled. Log entries will contain detailed information.');
		}
	
		this.updateStatus(InstanceStatus.Connecting);

		if (this.config.api_key !== undefined && this.config.api_key !== '') {
			this.initConnection();

			this.initActions();
			this.initFeedbacks();
			this.initVariables();
			this.initPresets();
		
			this.checkFeedbacks();
			this.checkVariables();
		}
		else {
			this.updateStatus(InstanceStatus.Connecting, 'Please enter your Govee API key.');
		}
	}
}

runEntrypoint(goveeInstance, UpgradeScripts);
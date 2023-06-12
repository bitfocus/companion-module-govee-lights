
const { InstanceStatus } = require('@companion-module/base')

const Govee = require('node-govee-led');

module.exports = {
	initConnection: function () {
		let self = this;
	
		if (self.config.api_key !== '') {
			if (self.config.govee_device === 'select') {
				if (self.GOVEE_DEVICES[0].id == 'select' && self.GOVEE_DEVICES.length < 3) { //the list hasn't been loaded yet if there's only 2 entries
					//just get the list of available devices and update the config with the list so they can choose one
					self.GOVEE = new Govee({apiKey: self.config.api_key, mac: '', model: ''});
					self.getGoveeDevices();
				}
			}
			else if (self.config.govee_device === 'manual') {
				//they selected manual, so load it the manual way
				if (self.config.device_mac !== '' && self.config.model !== '') {
					self.GOVEE = new Govee({apiKey: self.config.api_key, mac: self.config.device_mac, model: self.config.model});
					self.getInformation(self.config.device_mac); //get information once on startup
					self.setupInterval();
				}
			}
			else {
				//they selected a device, so load it
				let goveeDevice = self.GOVEE_DEVICES.find(device => device.id === self.config.govee_device);
				if (goveeDevice) {
					self.updateStatus(InstanceStatus.Ok, 'Connected to ' + goveeDevice.label);
					self.GOVEE = new Govee({apiKey: self.config.api_key, mac: goveeDevice.id, model: goveeDevice.model});
					self.getInformation(goveeDevice.id); //get information once on startup
					self.setupInterval();
				}
				else {
					//self.log('error', 'Invalid Govee Device Selected.');
					self.GOVEE = new Govee({apiKey: self.config.api_key, mac: '', model: ''});
					self.getGoveeDevices();
				}
			}
		}
		else {
			self.log('error', 'No API Key Specified.');
		}
	},
	
	setupInterval: function() {
		let self = this;
	
		self.stopInterval();
	
		if (self.config.intervalEnabled == true) {
			self.INTERVAL = setInterval(self.getState.bind(self), 60000); //every minute
			self.log('info', 'Starting Update Interval.');
		}
	},
	
	stopInterval: function() {
		let self = this;
	
		if (self.INTERVAL !== null) {
			self.log('info', 'Stopping Update Interval.');
			clearInterval(self.INTERVAL);
			self.INTERVAL = null;
		}
	},

	getGoveeDevices: function () {
		let self = this;

		self.log('info', 'Getting Govee Devices on Network.');

		self.GOVEE.getDevices()
		.then(function(data) {
			self.log('info', 'Govee Devices Auto-Detected.');
			self.buildDeviceList.bind(self)(data);
			
			//might need to do a check here to see if the device they had selected is still in the list, if not, change it back to 'select'
			if (self.config.govee_device !== 'select' && self.config.govee_device !== 'manual') {
				let goveeDevice = self.GOVEE_DEVICES.find(device => device.id === self.config.govee_device);
				if (!goveeDevice) {
					self.config.govee_device = 'select';
				}
			}
			self.getConfigFields();
			self.configUpdated(self.config);
			self.updateStatus(InstanceStatus.Connecting, 'Devices Auto-Detected. Please select a device.');
		})
		.catch(function(error) {
			console.log(error);
		});
	},

	buildDeviceList: function (data) {
		let self = this;
		if (data.devices.length > 0) {
			let devices = [];

			let selectDeviceObj = {};
			selectDeviceObj.id = 'select';
			selectDeviceObj.label = '(Select a Device)';
			devices.push(selectDeviceObj);

			for (let i = 0; i < data.devices.length; i++) {
				let deviceObj = {...data.devices[i]};
				deviceObj.id = data.devices[i].device;
				deviceObj.label = `${data.devices[i].deviceName} (${data.devices[i].model})`;
				deviceObj.model = data.devices[i].model;
				devices.push(deviceObj);
			}

			let manualDeviceObj = {};
			manualDeviceObj.id = 'manual';
			manualDeviceObj.label = '(Manually Specify Device MAC Address and Model)';
			devices.push(manualDeviceObj);

			self.GOVEE_DEVICES = devices;
		}
	},
	
	getInformation: async function (mac) {
		//Get all information from Device
		let self = this;

		self.GOVEE.getDevices()
		.then(function(data) {
			self.buildDeviceList.bind(self)(data);

			//loop through govee devices, find ours, and grab its data
			let goveeDevice = self.GOVEE_DEVICES.find(device => device.id === mac);
			if (goveeDevice) {
				let variableObj = {
					'device': goveeDevice.device,
					'model': goveeDevice.model,
					'device_name': goveeDevice.deviceName,
				};
				self.setVariableValues(variableObj);
			}
			else {
				self.log('error', `Invalid Govee Device Selected: ${mac}`);
			}
		})
		.catch(function(error) {
			self.processError(error);
		});
	},

	getState: function () {
		let self = this;

		console.log('get state ran')

		self.GOVEE.getState()
		.then(function(data) {
			console.log(data);
		})
		.catch(function(error) {
			self.processError(error);
		});
	},

	processError: function(err) {
		let self = this;

		if (err.status == 400) {  //bad request
			if (err.response && err.response.body) {
				//convert response.res.text to json and get error message
				try {
					let error = err.response.body;
					if (error && error.message) {
						if (error.message == 'Device Not Found') {
							self.log('error', 'Device Not Found. Are you sure this is the correct MAC address?');
						}
						else {
							self.log('error', 'Unknown error: ' + error.message);
						}
					}
				}
				catch(e) {
					self.log('error', 'Error parsing error response: ' + e);
				}
			}
			else {
				self.log('error', 'Unknown error occured.');
			}
		}
		else if (err.status == 429) { //Too many requests
			self.log('error', 'Too many requests. Please wait a few seconds and try again.');
		}
		else {
			self.log('error', 'Unknown error occurred.');
			console.log(err);
		}
	}
}
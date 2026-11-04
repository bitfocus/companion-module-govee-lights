const { test } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const https = require('node:https')
const Govee = require('node-govee-led')
const api = require('../src/api')
const actions = require('../src/actions')
const feedbacks = require('../src/feedbacks')
const variables = require('../src/variables')

const waitFor = async (predicate) => {
	for (let i = 0; i < 200; i++) {
		if (predicate()) return
		await new Promise((resolve) => setTimeout(resolve, 5))
	}
	assert.fail('Timed out waiting for module callback')
}

test('Govee discovery, state, actions, variables, feedbacks and errors over loopback', async (t) => {
	const originalRequest = https.request
	https.request = () => { throw new Error('External HTTPS is forbidden in this test') }
	t.after(() => { https.request = originalRequest })
	const requests = []
	let rejectControl = false
	const device = { device: 'AA:BB:CC:DD:EE:FF', model: 'H6001', deviceName: 'Fixture light' }
	const server = http.createServer(async (req, res) => {
		let body = ''
		for await (const chunk of req) body += chunk
		requests.push({ method: req.method, url: req.url, headers: req.headers, body: JSON.parse(body || '{}') })
		res.setHeader('Content-Type', 'application/json')
		if (rejectControl && req.url.endsWith('/control')) {
			res.writeHead(429)
			res.end(JSON.stringify({ message: 'Too many requests' }))
		} else if (req.url === '/v1/devices') {
			res.end(JSON.stringify({ data: { devices: [device] } }))
		} else {
			res.end(JSON.stringify({ code: 200, data: { properties: [{ powerState: 'on' }] } }))
		}
	})
	await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
	t.after(() => new Promise((resolve) => server.close(resolve)))
	const logs = []
	const instance = {
		...api, ...actions, ...feedbacks, ...variables,
		config: { verbose: false, intervalEnabled: false, govee_device: 'select' },
		GOVEE: new Govee({ apiKey: 'fixture-key', mac: device.device, model: device.model }),
		GOVEE_DEVICES: [], INFO: { power: 'off', brightness: '', color: '', api_calls_remaining: 10 },
		log: (...args) => logs.push(args), updateStatus: () => {}, checkFeedbacks: () => {},
		setVariableValues(values) { this.values = { ...this.values, ...values } },
		setActionDefinitions(value) { this.actions = value },
		setFeedbackDefinitions(value) { this.feedbacks = value },
	}
	instance.GOVEE.basePath = `http://127.0.0.1:${server.address().port}/v1/devices`
	instance.getGoveeDevices()
	await waitFor(() => instance.GOVEE_DEVICES.length === 3)
	assert.equal(instance.GOVEE_DEVICES[1].label, 'Fixture light (H6001)')
	instance.getInformation(device.device)
	await waitFor(() => instance.values?.device === device.device)
	assert.equal(instance.values.model, device.model)
	instance.getState()
	await waitFor(() => requests.some((r) => r.url.includes('/state?')))
	instance.initActions()
	instance.initFeedbacks()
	for (const [power, expected] of [['on', 'on'], ['toggle', 'off'], ['toggle', 'on'], ['off', 'off']]) {
		await instance.actions.power.callback({ options: { power } })
		await waitFor(() => instance.INFO.power === expected)
		assert.equal(instance.feedbacks.powerState.callback({ options: { option: expected } }), true)
		assert.equal(instance.feedbacks.powerState.callback({ options: { option: expected === 'on' ? 'off' : 'on' } }), false)
	}
	await instance.actions.changeBrightness.callback({ options: { brightness: 42 } })
	await waitFor(() => instance.INFO.brightness === 42)
	await instance.actions.changeColor.callback({ options: { color: 0x123456 } })
	await waitFor(() => instance.INFO.color === '#123456')
	const commands = requests.filter((r) => r.method === 'PUT')
	assert.deepEqual(commands.map((r) => r.body.cmd), [
		{ name: 'turn', value: 'on' }, { name: 'turn', value: 'off' },
		{ name: 'turn', value: 'on' }, { name: 'turn', value: 'off' },
		{ name: 'brightness', value: 42 }, { name: 'color', value: { r: 18, g: 52, b: 86 } },
	])
	for (const request of requests) {
		assert.equal(request.headers['govee-api-key'], 'fixture-key')
		if (request.method === 'PUT') {
			assert.equal(request.body.device, device.device)
			assert.equal(request.body.model, device.model)
		}
	}
	rejectControl = true
	await instance.actions.power.callback({ options: { power: 'off' } })
	await waitFor(() => logs.some((entry) => entry[0] === 'error'))
	assert.equal(instance.INFO.power, 'on', 'Failed requests must not change the last known state')
	assert.throws(() => instance.GOVEE.setBrightness(0), /Not From 1-100/, 'Supported dependency already rejects the UI minimum of zero')
})

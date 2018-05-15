const EventEmitter = require('events');
const {buildDeviceState} = require('neeo-sdk');
const debug = require('debug')('neeo:driver:ring-doorbell:server');
const RingAPI = require('ring-api');
const {getDriverSettings} = require('./settings');

class DoorbellController {
  constructor() {
    debug('Creating doorbell service');

    this.settings = getDriverSettings();
    this.ringApi = RingAPI(this.settings.credentials);
    this.deviceState = buildDeviceState();
    this.findDoorbells = this.findDoorbells.bind(this);
    this.onActivity = this.onActivity.bind(this);
    this.ringApi.events.on('activity', this.onActivity);
    this.motionTimeoutId = null;
    this.dingTimeoutId = null;
  }

  registerSubscriptionFunction(sendUpdateToBrain) {
    debug('Registering subscription function');
    this.sendUpdateToBrain = sendUpdateToBrain;
  }

  onActivity(activity) {
    debug('Doorbell activity detected, updating devices');

    switch (activity.kind) {
      case 'ding':
        this.setDingState(activity.doorbot_id, true);
        break;
      case 'motion':
        this.setMotionState(activity.doorbot_id, true);
        break;
    }
  }

  findDoorbells() {
    debug('Finding doorbell devices');
    return this.ringApi.devices().then(devices => {
      devices.doorbells.forEach(device => {
        this.deviceState.addDevice(device.id, Object.assign(device, {
          motionDetected: false,
          dingDetected: false
        }));
      });

      return this.deviceState.getAllDevices().map(device => ({
        id: device.id,
        name: device.clientObject.description,
        reachable: device.reachable
      }));
    });
  }

  getMotionState(id, value) {
    debug('Getting motion sensor state');
    const device = this.deviceState.getClientObjectIfReachable(id);

    if (!device) {
      return false;
    }

    return device.motionDetected;
  }

  setMotionState(id, value) {
    debug('Setting motion sensor state');
    const device = this.deviceState.getClientObjectIfReachable(id);

    if (!device || !this.sendUpdateToBrain) {
      return;
    }

    clearTimeout(this.motionTimeoutId);

    this.sendUpdateToBrain({
      uniqueDeviceId: id,
      component: 'ring-doorbell-motion',
      value
    }).catch(error => debug('FAILED_TO_SET_MOTION_STATE', error.message));

    if (value) {
        this.motionTimeoutId = setTimeout(() => this.setMotionState(id, false), this.settings.sensorResetTime);
    }
  }

  getDingState(id) {
    debug('Getting ding sensor state');
    const device = this.deviceState.getClientObjectIfReachable(id);

    if (!device) {
      return false;
    }

    return device.dingDetected;
  }

  setDingState(id, value) {
    debug('Setting ding sensor state');
    const device = this.deviceState.getClientObjectIfReachable(id);

    if (!device || !this.sendUpdateToBrain) {
      return;
    }

    clearTimeout(this.dingTimeoutId);

    this.sendUpdateToBrain({
      uniqueDeviceId: id,
      component: 'ring-doorbell-ding',
      value
    }).catch(error => debug('FAILED_TO_SET_DING_STATE', error.message));

    if (value) {
      this.dingTimeoutId = setTimeout(() => this.setDingState(id, false), this.settings.sensorResetTime);
    }
  }
}

module.exports = DoorbellController;

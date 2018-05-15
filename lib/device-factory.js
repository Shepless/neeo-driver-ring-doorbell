const {buildDevice} = require('neeo-sdk');
const debug = require('debug')('neeo:driver:ring-doorbell');
const DISCOVERY_INCTRUCTIONS = {
  headerText: 'Discover Ring Doorbells',
  description: 'Please make sure your doorbell(s) are online'
};

module.exports = {
  create(controller) {
    debug('Building doorbell device');

    return buildDevice('Doorbell')
      .addCapability('alwaysOn')
      .setManufacturer('Ring')
      .addAdditionalSearchToken('ring doorbell')
      .setType('ACCESSORY')
      .enableDiscovery(
        DISCOVERY_INCTRUCTIONS,
        controller.findDoorbells
      )
      .addSwitch(
        { name: 'ring-doorbell-motion', label: 'motion detector' },
        { getter: (deviceId) => controller.getMotionState(deviceId), setter: () => {} }
      )
      .addSwitch(
        { name: 'ring-doorbell-ding', label: 'ding detector' },
        { getter: (deviceId) => controller.getDingState(deviceId), setter: () => {} }
      )
      .registerSubscriptionFunction(updateFn => controller.registerSubscriptionFunction(updateFn));
  }
}

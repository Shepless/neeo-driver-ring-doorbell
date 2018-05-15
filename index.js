const {buildDevice, startServer, discoverOneBrain} = require('neeo-sdk');
const debug = require('debug')('neeo:driver:ring-doorbell');
const {loadSettingsSchema, setDriverSettings, getDriverSettings, generateSettingsFile} = require('./lib/settings');

/* The below 3 functions will live in the SDK and (probably) run when buildDevice() is called?
* The idea is to abstract as much of this away from users and developers to keep it simple.
*
* FOR DRIVER DEVELOPERS:
* Look in the package.json. There is a neeo section with settings. We use Joi
* along with some related packages to automatically take the settings definition
* to load and validate settings provided by end users of the driver. All the
* developer needs to do is define those rules, especially if we bundle the below
* 3 functions into the SDK and auto run them when building a device.
*
* FOR END USERS:
* Because the 3 methods below will be run automatically all the user needs to do
* is create a settings.json. I have also included a function called "generateSettingsFile()"
* which will take the definition provided by the developer in the package and create
* the settings.json in the correct location and with the correct structure. We could
* possibly bundle this into the CLI you guys are working on. If the user tries to run
* a driver that has specified settings but has no settings.json, then there are friendly
* messages along the way explaining why the driver won't start.
*
* WHY?
* I have seen many drivers that require you to clone and then modify as they have
* hard coded values for things like username, password, IP addresses etc.
* Using something like this combined with the new CLI would allow developers to
* account for this in a simple way but will also benefit end users with generated
* settings.json files and auto validation so they know why a driver failed to run.
* All of this is completely optional - if no setting schema is defined in the package.json
* then it is ignore, if a developer uses the "generateSettingsFile()" without specifying
* a settings schema then a useful message is also show.
*/
// generateSettingsFile();
loadSettingsSchema();
setDriverSettings();

const DoorbellController = require('./lib/doorbell-controller');
const DeviceFactory = require('./lib/device-factory');
const controller = new DoorbellController();
const doorbell = DeviceFactory.create(controller);

// FOR DRIVER DEVELOPERS: this function is the only one they will need to interact with
const settings = getDriverSettings();

controller.findDoorbells()
  .then(() => discoverOneBrain())
  .then((brain) => startServer({
    brain,
    port: settings.port,
    name: 'ring-doorbell',
    devices: [doorbell]
  }))
  .then(() => debug('Ring doorbell driver now running'));

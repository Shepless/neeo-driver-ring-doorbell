// TODO: Fork the SDK and look to integrate this
const path = require('path');
const fs = require('fs');
const debug = require('debug')('neeo:driver:ring-doorbell');
const Joi = require('joi');
const Enjoi = require('enjoi');
const Felicity = require('felicity');
const packageJsonPath = path.resolve(process.cwd(), 'package.json');

let settings = null;
let settingsLocation = null;
let schema = null;
let packageJson = require(packageJsonPath);

function getSettingsLocation () {
  return path.resolve(process.cwd(), packageJson.neeo.settings.location || './', 'settings.json');
}

function loadSettingsSchema () {
  if (!packageJson.neeo && !packageJson.neeo.settings) {
    debug('NO_SETTINGS_DEFINED');
    return;
  }

  if (!packageJson.neeo.settings.schema) {
    debug('NO_SETTING_SCHEMA_FOUND');
    return;
  }

  debug('CREATING_SETTING_SCHEMA');
  schema = Enjoi(packageJson.neeo.settings.schema);
}

function setDriverSettings() {
  if (!packageJson.neeo && !packageJson.neeo.settings) {
    debug('NO_SETTINGS_DEFINED %', 'Skipping setting driver settings');
    return;
  }

  const settingsLocation = getSettingsLocation();

  if (!fs.existsSync(settingsLocation)) {
    debug('FAILED_TO_LOAD_SETTINGS %s', settingsLocation);
    throw new Error('FAILED_TO_LOAD_SETTINGS');
  }

  const userSettings = require(path.resolve(process.cwd(), settingsLocation));
  const {error, value} = Joi.validate(userSettings, schema);

  if (error) {
    debug('SETTINGS_VALIDATION_FAILED %o', error.details.map(detail => detail.message));
    throw new Error('SETTINGS_VALIDATION_FAILED');
  }

  debug('ASSIGNING_SETTINGS: %o', value);
  settings = value;
}

function getDriverSettings () {
  if (!settings) {
    const error = new Error(
      'This driver has no settings defined. Please use the NEEO SDK to generate the required settings.json file'
    );

    debug('NO_SETTINGS_DEFINED %o', error.message);
    throw error;
  }

  return settings;
}

function generateSettingsFile() {
  loadSettingsSchema();
  const settingsLocation = getSettingsLocation();
  const FelicityConstructor = Felicity.entityFor(schema);
  const felicityInstance = new FelicityConstructor();

  if (fs.existsSync(settingsLocation)) {
    debug('OVERWRITTING_EXISTING_SETTINGS_FILE %s', settingsLocation);
  }

  fs.writeFileSync(settingsLocation, JSON.stringify(felicityInstance, null, 2), 'utf8');
}

module.exports.loadSettingsSchema = loadSettingsSchema;
module.exports.getSettingsLocation = getSettingsLocation;
module.exports.setDriverSettings = setDriverSettings;
module.exports.getDriverSettings = getDriverSettings;
module.exports.generateSettingsFile = generateSettingsFile;

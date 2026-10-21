const { withEntitlementsPlist } = require('expo/config-plugins');

// expo-notifications always writes aps-environment, and a free Apple developer team cannot sign it.
// Local notifications do not use it, so it is removed. Keep this listed before expo-notifications in app.json,
// because expo-notifications would otherwise add the key back after this runs.
module.exports = (config) =>
  withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });

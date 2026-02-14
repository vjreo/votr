const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    newArchEnabled: false, // avoids HostFunction boolean/string errors in Expo Go
    android: {
      ...appJson.expo.android,
      edgeToEdgeEnabled: Boolean(appJson.expo.android?.edgeToEdgeEnabled),
      predictiveBackGestureEnabled: Boolean(appJson.expo.android?.predictiveBackGestureEnabled),
    },
  },
};

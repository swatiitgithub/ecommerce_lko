const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      // Force react-native-paper to resolve from compiled CommonJS lib
      // This fixes "Unable to resolve module RadioButton" errors in Metro
      if (moduleName === 'react-native-paper') {
        return {
          filePath: path.resolve(
            __dirname,
            'node_modules/react-native-paper/lib/commonjs/index.js'
          ),
          type: 'sourceFile',
        };
      }
      // Default resolution for everything else
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

module.exports = function (api) {
    api.cache(true);
    return {
        // This preset is for Expo projects:
        presets: ['babel-preset-expo'],

        plugins: [
            // Reanimated plugin has to be listed last:
            'react-native-reanimated/plugin',
        ],
    };
};

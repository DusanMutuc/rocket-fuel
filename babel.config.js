module.exports = function (api) {
    api.cache(true);
    return {
        // This preset is for Expo projects:
        presets: ['babel-preset-expo'],
    };
};

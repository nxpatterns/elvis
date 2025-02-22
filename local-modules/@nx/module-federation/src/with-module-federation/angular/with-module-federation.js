"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withModuleFederation = withModuleFederation;
const utils_1 = require("./utils");
const webpack_1 = require("@module-federation/enhanced/webpack");
async function withModuleFederation(options, configOverride) {
    if (global.NX_GRAPH_CREATION) {
        return (config) => config;
    }
    const { sharedLibraries, sharedDependencies, mappedRemotes } = await (0, utils_1.getModuleFederationConfig)(options);
    return (config) => {
        const updatedConfig = {
            ...(config ?? {}),
            output: {
                ...(config.output ?? {}),
                uniqueName: options.name,
                publicPath: 'auto',
            },
            optimization: {
                ...(config.optimization ?? {}),
                runtimeChunk: false,
            },
            resolve: {
                ...(config.resolve ?? {}),
                alias: {
                    ...(config.resolve?.alias ?? {}),
                    ...sharedLibraries.getAliases(),
                },
            },
            experiments: {
                ...(config.experiments ?? {}),
                outputModule: true,
            },
            plugins: [
                ...(config.plugins ?? []),
                new webpack_1.ModuleFederationPlugin({
                    name: options.name.replace(/-/g, '_'),
                    filename: 'remoteEntry.mjs',
                    exposes: options.exposes,
                    remotes: mappedRemotes,
                    shared: {
                        ...sharedDependencies,
                    },
                    library: {
                        type: 'module',
                    },
                    /**
                     * Apply user-defined config override
                     */
                    ...(configOverride ? configOverride : {}),
                    runtimePlugins: process.env.NX_MF_DEV_REMOTES &&
                        !options.disableNxRuntimeLibraryControlPlugin
                        ? [
                            ...(configOverride?.runtimePlugins ?? []),
                            require.resolve('@nx/module-federation/src/utils/plugins/runtime-library-control.plugin.js'),
                        ]
                        : configOverride?.runtimePlugins,
                    virtualRuntimeEntry: true,
                }),
                sharedLibraries.getReplacementPlugin(),
            ],
        };
        // The env var is only set from the module-federation-dev-server
        // Attach the runtime plugin
        updatedConfig.plugins.push(new (require('webpack').DefinePlugin)({
            'process.env.NX_MF_DEV_REMOTES': process.env.NX_MF_DEV_REMOTES,
        }));
        return updatedConfig;
    };
}

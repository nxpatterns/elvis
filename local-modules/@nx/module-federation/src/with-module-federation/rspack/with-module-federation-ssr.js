"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withModuleFederationForSSR = withModuleFederationForSSR;
const core_1 = require("@rspack/core");
const utils_1 = require("./utils");
async function withModuleFederationForSSR(options, configOverride) {
    if (global.NX_GRAPH_CREATION) {
        return (config) => config;
    }
    const { sharedLibraries, sharedDependencies, mappedRemotes } = await (0, utils_1.getModuleFederationConfig)(options, {
        isServer: true,
    });
    return (config, { context }) => {
        config.target = 'async-node';
        config.output.uniqueName = options.name;
        config.output.library = {
            type: 'commonjs-module',
        };
        config.optimization = {
            ...(config.optimization ?? {}),
            runtimeChunk: false,
        };
        config.plugins.push(
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        new (require('@module-federation/enhanced/rspack').ModuleFederationPlugin)({
            name: options.name.replace(/-/g, '_'),
            filename: 'remoteEntry.js',
            exposes: options.exposes,
            remotes: mappedRemotes,
            shared: {
                ...sharedDependencies,
            },
            isServer: true,
            library: {
                type: 'commonjs-module',
            },
            remoteType: 'script',
            /**
             * Apply user-defined config overrides
             */
            ...(configOverride ? configOverride : {}),
            experiments: {
                federationRuntime: 'hoisted',
                // We should allow users to override federationRuntime
                ...(configOverride?.experiments ?? {}),
            },
            runtimePlugins: process.env.NX_MF_DEV_REMOTES &&
                !options.disableNxRuntimeLibraryControlPlugin
                ? [
                    ...(configOverride?.runtimePlugins ?? []),
                    require.resolve('@module-federation/node/runtimePlugin'),
                    require.resolve('@nx/module-federation/src/utils/plugins/runtime-library-control.plugin.js'),
                ]
                : [
                    ...(configOverride?.runtimePlugins ?? []),
                    require.resolve('@module-federation/node/runtimePlugin'),
                ],
            virtualRuntimeEntry: true,
        }, {}), sharedLibraries.getReplacementPlugin());
        // The env var is only set from the module-federation-dev-server
        // Attach the runtime plugin
        config.plugins.push(new core_1.DefinePlugin({
            'process.env.NX_MF_DEV_REMOTES': process.env.NX_MF_DEV_REMOTES,
        }));
        return config;
    };
}

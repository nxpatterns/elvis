"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withModuleFederation = withModuleFederation;
const rspack_1 = require("@module-federation/enhanced/rspack");
const core_1 = require("@rspack/core");
const utils_1 = require("./utils");
const isVarOrWindow = (libType) => libType === 'var' || libType === 'window';
/**
 * @param {ModuleFederationConfig} options
 * @param {NxModuleFederationConfigOverride} configOverride
 */
async function withModuleFederation(options, configOverride) {
    if (global.NX_GRAPH_CREATION) {
        return function makeConfig(config) {
            return config;
        };
    }
    const { sharedDependencies, sharedLibraries, mappedRemotes } = await (0, utils_1.getModuleFederationConfig)(options);
    const isGlobal = isVarOrWindow(options.library?.type);
    return function makeConfig(config, { context }) {
        config.output.uniqueName = options.name;
        config.output.publicPath = 'auto';
        if (isGlobal) {
            config.output.scriptType = 'text/javascript';
        }
        config.optimization = {
            ...(config.optimization ?? {}),
            runtimeChunk: false,
        };
        if (config.mode === 'development' &&
            Object.keys(mappedRemotes).length > 1 &&
            !options.exposes) {
            config.optimization.runtimeChunk = 'single';
        }
        config.plugins.push(new rspack_1.ModuleFederationPlugin({
            name: options.name.replace(/-/g, '_'),
            filename: 'remoteEntry.js',
            exposes: options.exposes,
            remotes: mappedRemotes,
            shared: {
                ...sharedDependencies,
            },
            /**
             * remoteType: 'script' is required for the remote to be loaded as a script tag.
             * remotes will need to be defined as:
             *  { appX: 'appX@http://localhost:3001/remoteEntry.js' }
             *  { appY: 'appY@http://localhost:3002/remoteEntry.js' }
             */
            ...(isGlobal ? { remoteType: 'script' } : {}),
            /**
             * Apply user-defined config overrides
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
        }), sharedLibraries.getReplacementPlugin());
        // The env var is only set from the module-federation-dev-server
        // Attach the runtime plugin
        config.plugins.push(new core_1.DefinePlugin({
            'process.env.NX_MF_DEV_REMOTES': process.env.NX_MF_DEV_REMOTES,
        }));
        return config;
    };
}

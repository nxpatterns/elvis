"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ANGULAR_PACKAGES_TO_SHARE = exports.DEFAULT_NPM_PACKAGES_TO_AVOID = void 0;
exports.applyDefaultEagerPackages = applyDefaultEagerPackages;
exports.getFunctionDeterminateRemoteUrl = getFunctionDeterminateRemoteUrl;
exports.getModuleFederationConfig = getModuleFederationConfig;
const utils_1 = require("../../utils");
const devkit_1 = require("@nx/devkit");
const project_graph_1 = require("nx/src/project-graph/project-graph");
function applyDefaultEagerPackages(sharedConfig) {
    const DEFAULT_PACKAGES_TO_LOAD_EAGERLY = [
        '@angular/localize',
        '@angular/localize/init',
    ];
    for (const pkg of DEFAULT_PACKAGES_TO_LOAD_EAGERLY) {
        if (!sharedConfig[pkg]) {
            continue;
        }
        sharedConfig[pkg] = { ...sharedConfig[pkg], eager: true };
    }
}
exports.DEFAULT_NPM_PACKAGES_TO_AVOID = [
    'zone.js',
    '@nx/angular/mf',
    '@nrwl/angular/mf',
];
exports.DEFAULT_ANGULAR_PACKAGES_TO_SHARE = [
    '@angular/core',
    '@angular/animations',
    '@angular/common',
];
function getFunctionDeterminateRemoteUrl(isServer = false) {
    const target = 'serve';
    const remoteEntry = isServer ? 'server/remoteEntry.js' : 'remoteEntry.mjs';
    return function (remote) {
        const mappedStaticRemotesFromEnv = process.env
            .NX_MF_DEV_SERVER_STATIC_REMOTES
            ? JSON.parse(process.env.NX_MF_DEV_SERVER_STATIC_REMOTES)
            : undefined;
        if (mappedStaticRemotesFromEnv && mappedStaticRemotesFromEnv[remote]) {
            return `${mappedStaticRemotesFromEnv[remote]}/${remoteEntry}`;
        }
        let remoteConfiguration = null;
        try {
            remoteConfiguration = (0, project_graph_1.readCachedProjectConfiguration)(remote);
        }
        catch (e) {
            throw new Error(`Cannot find remote "${remote}". Check that the remote name is correct in your module federation config file.\n`);
        }
        const serveTarget = remoteConfiguration?.targets?.[target];
        if (!serveTarget) {
            throw new Error(`Cannot automatically determine URL of remote (${remote}). Looked for property "host" in the project's "serve" target.\n
      You can also use the tuple syntax in your webpack config to configure your remotes. e.g. \`remotes: [['remote1', 'http://localhost:4201']]\``);
        }
        const host = serveTarget.options?.host ??
            `http${serveTarget.options.ssl ? 's' : ''}://localhost`;
        const port = serveTarget.options?.port ?? 4201;
        return `${host.endsWith('/') ? host.slice(0, -1) : host}:${port}/${remoteEntry}`;
    };
}
async function getModuleFederationConfig(mfConfig, options = { isServer: false }) {
    let projectGraph;
    try {
        projectGraph = (0, devkit_1.readCachedProjectGraph)();
    }
    catch (e) {
        projectGraph = await (0, devkit_1.createProjectGraphAsync)();
    }
    if (!projectGraph.nodes[mfConfig.name]?.data) {
        throw Error(`Cannot find project "${mfConfig.name}". Check that the name is correct in module-federation.config.js`);
    }
    const dependencies = (0, utils_1.getDependentPackagesForProject)(projectGraph, mfConfig.name);
    if (mfConfig.shared) {
        dependencies.workspaceLibraries = dependencies.workspaceLibraries.filter((lib) => mfConfig.shared(lib.importKey, {}) !== false);
        dependencies.npmPackages = dependencies.npmPackages.filter((pkg) => mfConfig.shared(pkg, {}) !== false);
    }
    const sharedLibraries = (0, utils_1.shareWorkspaceLibraries)(dependencies.workspaceLibraries);
    const npmPackages = (0, utils_1.sharePackages)(Array.from(new Set([
        ...exports.DEFAULT_ANGULAR_PACKAGES_TO_SHARE,
        ...dependencies.npmPackages.filter((pkg) => !exports.DEFAULT_NPM_PACKAGES_TO_AVOID.includes(pkg)),
    ])));
    exports.DEFAULT_NPM_PACKAGES_TO_AVOID.forEach((pkgName) => {
        if (pkgName in npmPackages) {
            delete npmPackages[pkgName];
        }
    });
    const sharedDependencies = {
        ...sharedLibraries.getLibraries(projectGraph.nodes[mfConfig.name].data.root),
        ...npmPackages,
    };
    applyDefaultEagerPackages(sharedDependencies);
    (0, utils_1.applySharedFunction)(sharedDependencies, mfConfig.shared);
    (0, utils_1.applyAdditionalShared)(sharedDependencies, mfConfig.additionalShared, projectGraph);
    const determineRemoteUrlFn = options.determineRemoteUrl ||
        getFunctionDeterminateRemoteUrl(options.isServer);
    const mapRemotesFunction = options.isServer ? utils_1.mapRemotesForSSR : utils_1.mapRemotes;
    const mappedRemotes = !mfConfig.remotes || mfConfig.remotes.length === 0
        ? {}
        : mapRemotesFunction(mfConfig.remotes, 'mjs', determineRemoteUrlFn);
    return { sharedLibraries, sharedDependencies, mappedRemotes };
}

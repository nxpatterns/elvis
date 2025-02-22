"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRemotes = getRemotes;
exports.getModuleFederationConfig = getModuleFederationConfig;
const devkit_1 = require("@nx/devkit");
const internal_1 = require("@nx/js/src/internal");
const find_matching_projects_1 = require("nx/src/utils/find-matching-projects");
const pc = require("picocolors");
const path_1 = require("path");
const fs_1 = require("fs");
function extractRemoteProjectsFromConfig(config, pathToManifestFile) {
    const remotes = [];
    const dynamicRemotes = [];
    if (pathToManifestFile && (0, fs_1.existsSync)(pathToManifestFile)) {
        const moduleFederationManifestJson = (0, fs_1.readFileSync)(pathToManifestFile, 'utf-8');
        if (moduleFederationManifestJson) {
            // This should have shape of
            // {
            //   "remoteName": "remoteLocation",
            // }
            const parsedManifest = JSON.parse(moduleFederationManifestJson);
            if (Object.keys(parsedManifest).every((key) => typeof key === 'string' && typeof parsedManifest[key] === 'string')) {
                dynamicRemotes.push(...Object.keys(parsedManifest));
            }
        }
    }
    const staticRemotes = config.remotes?.map((r) => (Array.isArray(r) ? r[0] : r)) ?? [];
    remotes.push(...staticRemotes);
    return { remotes, dynamicRemotes };
}
function collectRemoteProjects(remote, collected, context) {
    const remoteProject = context.projectGraph.nodes[remote]?.data;
    if (!context.projectGraph.nodes[remote] || collected.has(remote)) {
        return;
    }
    collected.add(remote);
    const remoteProjectRoot = remoteProject.root;
    const remoteProjectTsConfig = remoteProject.targets['build'].options.tsConfig;
    const remoteProjectConfig = getModuleFederationConfig(remoteProjectTsConfig, context.root, remoteProjectRoot);
    const { remotes: remoteProjectRemotes } = extractRemoteProjectsFromConfig(remoteProjectConfig);
    remoteProjectRemotes.forEach((r) => collectRemoteProjects(r, collected, context));
}
function getRemotes(devRemotes, skipRemotes, config, context, pathToManifestFile) {
    const collectedRemotes = new Set();
    const { remotes, dynamicRemotes } = extractRemoteProjectsFromConfig(config, pathToManifestFile);
    remotes.forEach((r) => collectRemoteProjects(r, collectedRemotes, context));
    const remotesToSkip = new Set((0, find_matching_projects_1.findMatchingProjects)(skipRemotes, context.projectGraph.nodes) ?? []);
    if (remotesToSkip.size > 0) {
        devkit_1.logger.info(`Remotes not served automatically: ${[...remotesToSkip.values()].join(', ')}`);
    }
    const knownRemotes = Array.from(collectedRemotes).filter((r) => !remotesToSkip.has(r));
    // With dynamic remotes, the manifest file may contain the names with `_` due to MF limitations on naming
    // The project graph might contain these names with `-` rather than `_`. Check for both.
    // This can occur after migration of existing remotes past Nx 19.8
    let normalizedDynamicRemotes = dynamicRemotes.map((r) => {
        if (context.projectGraph.nodes[r.replace(/_/g, '-')]) {
            return r.replace(/_/g, '-');
        }
        return r;
    });
    const knownDynamicRemotes = normalizedDynamicRemotes.filter((r) => !remotesToSkip.has(r) && context.projectGraph.nodes[r]);
    devkit_1.logger.info(`NX Starting module federation dev-server for ${pc.bold(context.projectName)} with ${[...knownRemotes, ...knownDynamicRemotes].length} remotes`);
    const devServeApps = new Set(!devRemotes
        ? []
        : Array.isArray(devRemotes)
            ? (0, find_matching_projects_1.findMatchingProjects)(devRemotes, context.projectGraph.nodes)
            : (0, find_matching_projects_1.findMatchingProjects)([devRemotes], context.projectGraph.nodes));
    const staticRemotes = knownRemotes.filter((r) => !devServeApps.has(r));
    const devServeRemotes = [...knownRemotes, ...knownDynamicRemotes].filter((r) => devServeApps.has(r));
    const staticDynamicRemotes = knownDynamicRemotes.filter((r) => !devServeApps.has(r));
    const remotePorts = [...devServeRemotes, ...staticDynamicRemotes].map((r) => context.projectGraph.nodes[r].data.targets['serve'].options.port);
    const staticRemotePort = Math.max(...[
        ...remotePorts,
        ...staticRemotes.map((r) => context.projectGraph.nodes[r].data.targets['serve'].options.port),
    ]) +
        (remotesToSkip.size + 1);
    return {
        staticRemotes,
        devRemotes: devServeRemotes,
        dynamicRemotes: staticDynamicRemotes,
        remotePorts,
        staticRemotePort,
    };
}
function getModuleFederationConfig(tsconfigPath, workspaceRoot, projectRoot, pluginName = 'react') {
    const moduleFederationConfigPathJS = (0, path_1.join)(workspaceRoot, projectRoot, 'module-federation.config.js');
    const moduleFederationConfigPathTS = (0, path_1.join)(workspaceRoot, projectRoot, 'module-federation.config.ts');
    let moduleFederationConfigPath = moduleFederationConfigPathJS;
    // create a no-op so this can be called with issue
    const fullTSconfigPath = tsconfigPath.startsWith(workspaceRoot)
        ? tsconfigPath
        : (0, path_1.join)(workspaceRoot, tsconfigPath);
    let cleanupTranspiler = () => { };
    if ((0, fs_1.existsSync)(moduleFederationConfigPathTS)) {
        cleanupTranspiler = (0, internal_1.registerTsProject)(fullTSconfigPath);
        moduleFederationConfigPath = moduleFederationConfigPathTS;
    }
    try {
        const config = require(moduleFederationConfigPath);
        cleanupTranspiler();
        return config.default || config;
    }
    catch {
        throw new Error(`Could not load ${moduleFederationConfigPath}. Was this project generated with "@nx/${pluginName}:host"?\nSee: https://nx.dev/concepts/more-concepts/faster-builds-with-module-federation`);
    }
}

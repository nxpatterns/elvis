"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDependentPackagesForProject = getDependentPackagesForProject;
const typescript_1 = require("./typescript");
const devkit_1 = require("@nx/devkit");
function getDependentPackagesForProject(projectGraph, name) {
    const { npmPackages, workspaceLibraries } = collectDependencies(projectGraph, name);
    return {
        workspaceLibraries: [...workspaceLibraries.values()],
        npmPackages: [...npmPackages],
    };
}
function collectDependencies(projectGraph, name, dependencies = {
    workspaceLibraries: new Map(),
    npmPackages: new Set(),
}, seen = new Set()) {
    if (seen.has(name)) {
        return dependencies;
    }
    seen.add(name);
    (projectGraph.dependencies[name] ?? []).forEach((dependency) => {
        if (dependency.target.startsWith('npm:')) {
            dependencies.npmPackages.add(dependency.target.replace('npm:', ''));
        }
        else {
            dependencies.workspaceLibraries.set(dependency.target, {
                name: dependency.target,
                root: projectGraph.nodes[dependency.target].data.root,
                importKey: getLibraryImportPath(dependency.target, projectGraph),
            });
            collectDependencies(projectGraph, dependency.target, dependencies, seen);
        }
    });
    return dependencies;
}
function getLibraryImportPath(library, projectGraph) {
    let buildLibsFromSource = true;
    if (process.env.NX_BUILD_LIBS_FROM_SOURCE) {
        buildLibsFromSource = process.env.NX_BUILD_LIBS_FROM_SOURCE === 'true';
    }
    const libraryNode = projectGraph.nodes[library];
    let sourceRoots = [libraryNode.data.sourceRoot];
    if (!buildLibsFromSource && process.env.NX_BUILD_TARGET) {
        const buildTarget = (0, devkit_1.parseTargetString)(process.env.NX_BUILD_TARGET, projectGraph);
        sourceRoots = (0, devkit_1.getOutputsForTargetAndConfiguration)(buildTarget, {}, libraryNode);
    }
    const tsConfigPathMappings = (0, typescript_1.readTsPathMappings)();
    for (const [key, value] of Object.entries(tsConfigPathMappings)) {
        for (const src of sourceRoots) {
            if (value.find((path) => path.startsWith(src))) {
                return key;
            }
        }
    }
    return undefined;
}

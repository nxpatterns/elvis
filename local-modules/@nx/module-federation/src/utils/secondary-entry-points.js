"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectWorkspaceLibrarySecondaryEntryPoints = collectWorkspaceLibrarySecondaryEntryPoints;
exports.getNonNodeModulesSubDirs = getNonNodeModulesSubDirs;
exports.recursivelyCollectSecondaryEntryPointsFromDirectory = recursivelyCollectSecondaryEntryPointsFromDirectory;
exports.collectPackageSecondaryEntryPoints = collectPackageSecondaryEntryPoints;
const path_1 = require("path");
const fs_1 = require("fs");
const devkit_1 = require("@nx/devkit");
const package_json_1 = require("nx/src/utils/package-json");
function collectWorkspaceLibrarySecondaryEntryPoints(library, tsconfigPathAliases) {
    const libraryRoot = (0, path_1.join)(devkit_1.workspaceRoot, library.root);
    const needsSecondaryEntryPointsCollected = (0, fs_1.existsSync)((0, path_1.join)(libraryRoot, 'ng-package.json'));
    const secondaryEntryPoints = [];
    if (needsSecondaryEntryPointsCollected) {
        const tsConfigAliasesForLibWithSecondaryEntryPoints = Object.entries(tsconfigPathAliases).reduce((acc, [tsKey, tsPaths]) => {
            if (!tsKey.startsWith(library.importKey)) {
                return { ...acc };
            }
            if (tsPaths.some((path) => path.startsWith(`${library.root}/`))) {
                acc = { ...acc, [tsKey]: tsPaths };
            }
            return acc;
        }, {});
        for (const [alias] of Object.entries(tsConfigAliasesForLibWithSecondaryEntryPoints)) {
            const pathToLib = (0, path_1.dirname)((0, path_1.join)(devkit_1.workspaceRoot, tsconfigPathAliases[alias][0]));
            let searchDir = pathToLib;
            while (searchDir !== libraryRoot) {
                if ((0, fs_1.existsSync)((0, path_1.join)(searchDir, 'ng-package.json'))) {
                    secondaryEntryPoints.push({ name: alias, path: pathToLib });
                    break;
                }
                searchDir = (0, path_1.dirname)(searchDir);
            }
        }
    }
    return secondaryEntryPoints;
}
function getNonNodeModulesSubDirs(directory) {
    return (0, fs_1.readdirSync)(directory)
        .filter((file) => file !== 'node_modules')
        .map((file) => (0, path_1.join)(directory, file))
        .filter((file) => (0, fs_1.lstatSync)(file).isDirectory());
}
function recursivelyCollectSecondaryEntryPointsFromDirectory(pkgName, pkgVersion, pkgRoot, mainEntryPointExports, directories, collectedPackages) {
    for (const directory of directories) {
        const packageJsonPath = (0, path_1.join)(directory, 'package.json');
        const relativeEntryPointPath = (0, path_1.relative)(pkgRoot, directory);
        const entryPointName = (0, devkit_1.joinPathFragments)(pkgName, relativeEntryPointPath);
        if ((0, fs_1.existsSync)(packageJsonPath)) {
            try {
                // require the secondary entry point to try to rule out sample code
                require.resolve(entryPointName, { paths: [devkit_1.workspaceRoot] });
                const { name } = (0, devkit_1.readJsonFile)(packageJsonPath);
                // further check to make sure what we were able to require is the
                // same as the package name
                if (name === entryPointName) {
                    collectedPackages.push({ name, version: pkgVersion });
                }
            }
            catch { }
        }
        else if (mainEntryPointExports) {
            // if the package.json doesn't exist, check if the directory is
            // exported by the main entry point
            const entryPointExportKey = `./${relativeEntryPointPath}`;
            const entryPointInfo = mainEntryPointExports[entryPointExportKey];
            if (entryPointInfo) {
                collectedPackages.push({
                    name: entryPointName,
                    version: pkgVersion,
                });
            }
        }
        const subDirs = getNonNodeModulesSubDirs(directory);
        recursivelyCollectSecondaryEntryPointsFromDirectory(pkgName, pkgVersion, pkgRoot, mainEntryPointExports, subDirs, collectedPackages);
    }
}
function collectPackagesFromExports(pkgName, pkgVersion, exports, collectedPackages) {
    for (const [relativeEntryPoint, exportOptions] of Object.entries(exports)) {
        const defaultExportOptions = typeof exportOptions?.['default'] === 'string'
            ? exportOptions?.['default']
            : exportOptions?.['default']?.['default'];
        if (defaultExportOptions?.search(/\.(js|mjs|cjs)$/)) {
            let entryPointName = (0, devkit_1.joinPathFragments)(pkgName, relativeEntryPoint);
            if (entryPointName.endsWith('.json')) {
                entryPointName = (0, path_1.dirname)(entryPointName);
            }
            if (entryPointName === '.') {
                continue;
            }
            if (collectedPackages.find((p) => p.name === entryPointName)) {
                continue;
            }
            collectedPackages.push({ name: entryPointName, version: pkgVersion });
        }
    }
}
function collectPackageSecondaryEntryPoints(pkgName, pkgVersion, collectedPackages) {
    let pathToPackage;
    let packageJsonPath;
    let packageJson;
    try {
        ({ path: packageJsonPath, packageJson } = (0, package_json_1.readModulePackageJson)(pkgName));
        pathToPackage = (0, path_1.dirname)(packageJsonPath);
    }
    catch {
        // the package.json might not resolve if the package has the "exports"
        // entry and is not exporting the package.json file, fall back to trying
        // to find it from the top-level node_modules
        pathToPackage = (0, path_1.join)(devkit_1.workspaceRoot, 'node_modules', pkgName);
        packageJsonPath = (0, path_1.join)(pathToPackage, 'package.json');
        if (!(0, fs_1.existsSync)(packageJsonPath)) {
            // might not exist if it's nested in another package, just return here
            return;
        }
        packageJson = (0, devkit_1.readJsonFile)(packageJsonPath);
    }
    const { exports } = packageJson;
    if (exports) {
        collectPackagesFromExports(pkgName, pkgVersion, exports, collectedPackages);
    }
    const subDirs = getNonNodeModulesSubDirs(pathToPackage);
    recursivelyCollectSecondaryEntryPointsFromDirectory(pkgName, pkgVersion, pathToPackage, exports, subDirs, collectedPackages);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readRootPackageJson = exports.getDependentPackagesForProject = exports.mapRemotesForSSR = exports.mapRemotes = exports.sharePackages = exports.shareWorkspaceLibraries = exports.getNpmPackageSharedConfig = exports.applyAdditionalShared = exports.applySharedFunction = void 0;
const share_1 = require("./share");
Object.defineProperty(exports, "applyAdditionalShared", { enumerable: true, get: function () { return share_1.applyAdditionalShared; } });
Object.defineProperty(exports, "applySharedFunction", { enumerable: true, get: function () { return share_1.applySharedFunction; } });
Object.defineProperty(exports, "getNpmPackageSharedConfig", { enumerable: true, get: function () { return share_1.getNpmPackageSharedConfig; } });
Object.defineProperty(exports, "sharePackages", { enumerable: true, get: function () { return share_1.sharePackages; } });
Object.defineProperty(exports, "shareWorkspaceLibraries", { enumerable: true, get: function () { return share_1.shareWorkspaceLibraries; } });
const remotes_1 = require("./remotes");
Object.defineProperty(exports, "mapRemotes", { enumerable: true, get: function () { return remotes_1.mapRemotes; } });
Object.defineProperty(exports, "mapRemotesForSSR", { enumerable: true, get: function () { return remotes_1.mapRemotesForSSR; } });
const dependencies_1 = require("./dependencies");
Object.defineProperty(exports, "getDependentPackagesForProject", { enumerable: true, get: function () { return dependencies_1.getDependentPackagesForProject; } });
const package_json_1 = require("./package-json");
Object.defineProperty(exports, "readRootPackageJson", { enumerable: true, get: function () { return package_json_1.readRootPackageJson; } });

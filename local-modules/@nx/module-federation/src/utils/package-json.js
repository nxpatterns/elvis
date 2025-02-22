"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readRootPackageJson = readRootPackageJson;
const fs_1 = require("fs");
const devkit_1 = require("@nx/devkit");
function readRootPackageJson() {
    const pkgJsonPath = (0, devkit_1.joinPathFragments)(devkit_1.workspaceRoot, 'package.json');
    if (!(0, fs_1.existsSync)(pkgJsonPath)) {
        throw new Error('NX MF: Could not find root package.json to determine dependency versions.');
    }
    return (0, devkit_1.readJsonFile)(pkgJsonPath);
}

import { ModuleFederationConfig, SharedLibraryConfig } from '../../utils';
export declare function applyDefaultEagerPackages(sharedConfig: Record<string, SharedLibraryConfig>): void;
export declare const DEFAULT_NPM_PACKAGES_TO_AVOID: string[];
export declare const DEFAULT_ANGULAR_PACKAGES_TO_SHARE: string[];
export declare function getFunctionDeterminateRemoteUrl(isServer?: boolean): (remote: string) => string;
export declare function getModuleFederationConfig(mfConfig: ModuleFederationConfig, options?: {
    isServer: boolean;
    determineRemoteUrl?: (remote: string) => string;
}): Promise<{
    sharedLibraries: import("../../utils").SharedWorkspaceLibraryConfig;
    sharedDependencies: {
        [x: string]: SharedLibraryConfig;
    };
    mappedRemotes: Record<string, string>;
}>;

import { ModuleFederationConfig } from '../../utils';
export declare function getFunctionDeterminateRemoteUrl(isServer?: boolean): (remote: string) => string;
export declare function getModuleFederationConfig(mfConfig: ModuleFederationConfig, options?: {
    isServer: boolean;
    determineRemoteUrl?: (remote: string) => string;
}): Promise<{
    sharedLibraries: import("../../utils").SharedWorkspaceLibraryConfig;
    sharedDependencies: {
        [x: string]: import("../../utils").SharedLibraryConfig;
    };
    mappedRemotes: {};
}>;

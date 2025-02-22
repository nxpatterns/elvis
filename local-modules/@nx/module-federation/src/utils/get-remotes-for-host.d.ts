import { type ProjectGraph } from '@nx/devkit';
import { ModuleFederationConfig } from './models';
interface ModuleFederationExecutorContext {
    projectName: string;
    projectGraph: ProjectGraph;
    root: string;
}
export declare function getRemotes(devRemotes: string[], skipRemotes: string[], config: ModuleFederationConfig, context: ModuleFederationExecutorContext, pathToManifestFile?: string): {
    staticRemotes: string[];
    devRemotes: any[];
    dynamicRemotes: any[];
    remotePorts: any[];
    staticRemotePort: number;
};
export declare function getModuleFederationConfig(tsconfigPath: string, workspaceRoot: string, projectRoot: string, pluginName?: 'react' | 'angular'): any;
export {};

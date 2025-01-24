import { ModuleFederationConfig, NxModuleFederationConfigOverride } from '../../utils';
/**
 * @param {ModuleFederationConfig} options
 */
export declare function withModuleFederation(options: ModuleFederationConfig, configOverride?: NxModuleFederationConfigOverride): Promise<(config: any, ctx: any) => any>;

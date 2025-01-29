import { ModuleFederationConfig, NxModuleFederationConfigOverride } from '../../utils';
export declare function withModuleFederationForSSR(options: ModuleFederationConfig, configOverride?: NxModuleFederationConfigOverride): Promise<(config: any) => any>;

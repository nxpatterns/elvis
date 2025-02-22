import { ParsedCommandLine } from 'typescript';
export declare function readTsPathMappings(tsConfigPath?: string): ParsedCommandLine['options']['paths'];
export declare function readTsConfig(tsConfigPath: string): ParsedCommandLine;
export declare function getRootTsConfigPath(): string | null;

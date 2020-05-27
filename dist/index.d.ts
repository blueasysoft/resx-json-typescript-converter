export interface res2TsOptions {
    mergeCulturesToSingleFile: boolean;
    generateTypeScriptResourceManager: boolean;
    searchRecursive: boolean;
    defaultResxCulture: string;
}
export default function execute(resxInput: string | string[], outputFolder: string, options?: res2TsOptions): void;

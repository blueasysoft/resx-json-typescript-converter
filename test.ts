import resxConv from './index';
resxConv('./test/', 'resOut', {defaultResxCulture: 'de', mergeCulturesToSingleFile: true, generateTypeScriptResourceManager: true, searchRecursive: true });

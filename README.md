# resx-json-typescript-converter
Source code for node module: [resx-json-typescript-converter](https://www.npmjs.com/package/resx-json-typescript-converter)

## Description
A node module for generating json-files and (optionally) an additional TypeScript resourceManager based on one or multiple resx-files.  
This module is usually used in grunt or other taskrunners during development to make text resources from resx-files available in JavaScript and Typescript

## Installation
```
npm install --save-dev resx-json-typescript-converter
```

## Usage
The resx-json-typescript-converter is exported as a commonjs module. To use it in your environment (e.g. with Grunt) you need to require or import the corresponding function from the module.  
Example usage:   
```
let resxConverter = require('resx-json-converter');
resxConverter.convertResx(['./App_GlobalResources/ResourceBase.en.resx', './App_GlobalResources/ResourceBase.fr.resx', './App_GlobalResources/ResourceBase.resx'], './App_Assets/TS/resources', { defaultResxCulture: 'de', mergeCulturesToSingleFile: true, generateTypeScriptResourceManager: true, searchRecursive: true });
```

### Parameters
A call to the *convertResx* function has a few required and optional parameters:  
**resxInput** - A single string or an array of strings pointing either to individual resx files or to folders containing resx files that should be included.  
**outputFolder** - The output folder where the generated *.json files and the optionally generated resourceManager should be created/saved.  
**options** - The option for the conversion is an Object with following keys:  
```
{ 
    defaultResxCulture: 'de', 
    mergeCulturesToSingleFile: true, 
    generateTypeScriptResourceManager: true, 
    searchRecursive: true 
}
```
#### Option-Parameters
**defaultResxCulture** - The default resx culture is used in two cases. First there might be resx-files that do not contain a culture in their filename (e.g. *ResourceBase.resx*, as opposed to *ResourceBase.fr.resx* fr is used as culture of the resource file). For this files the defaultResxCulture is used. *(Default: 'en')*  
**mergeCulturesToSingleFile** - Combine teh cultures of a resource file into one json file or export a separate json for ech culture version. *(Default: true)*  
**generateTypeScriptResourceManager** - Generate a TypeScript resourceManager module that imports the json files for simple access to the resources in TypeScript. *(Default: true)*  
**searchRecursive** - Determines if input folders should be searched for *.resx files recursively. *(Default: false)*  

### Usage of the JSON-files
If you are not using the generated TypeScript resourceManager you are free to import, ajax-load or otherwise use the json files.

### Usage of the TypeScript resourceManager
*Needs some documentation*

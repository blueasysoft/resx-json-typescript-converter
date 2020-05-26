# node-resx-to-typescript

Source code for node module: resx-to-typescript

Node module for generating TypeScript (models) files based on resx files.

To use this node module at a reference to your project package.json dependencies.

{
    "dependencies": {
        "resx-to-typescript": "1.0.16"
    }
}

The script requires one parameter, the virtual path to the TypeScript file you want to add.

So, to use the module in for instance a gulp task:

var resxToTypeScript = require('resx-to-typescript');
    
resxToTypeScript.execute('exampleApp.resources', '/Resources', '/App/Resources');

where the parameters stand for:

'exampleApp.resources'  -> TypeScript namespace for the resource models.
'/Resources'            -> Relative folder to scan for .resx files.
'/App/Resources'        -> Output directory for TypeScript files

Voilá, the TypeScript models for your resx files are added to your project and ready to use in typescript development/mvc bundling.

UPDATES:

2017-25-01 Removed runtime node deprecation warning. (v 1.0.15)
2016-08-19 Refactored code and added support for multi line resources. (v 1.0.12)





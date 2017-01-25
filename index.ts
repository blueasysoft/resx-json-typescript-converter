declare const __dirname: string;
declare const require: any;

const addTypeScriptFile = require('add-typescript-file-to-project');
const fs = require('fs');
const mkpath = require('mkpath');
const search = require('recursive-search');
const xml2js = require('xml2js');

export function execute(typeScriptResourcesNamespace: string, virtualResxFolder: string, virtualTypeScriptFolder: string): void {
    let files: any = null;
    const virtualProjectRoot = '\\..\\..\\..\\';

    if (virtualResxFolder === undefined || virtualResxFolder === '') {
        files = search.recursiveSearchSync(/.resx$/, __dirname + virtualProjectRoot );   
    } 
    else {
        virtualResxFolder = virtualResxFolder.replace(/\//g, '\\');
        
        let safeVirtualFolder = virtualResxFolder;
        
        if (safeVirtualFolder.charAt(0) === '\\')
        {
            safeVirtualFolder = safeVirtualFolder.substr(1);
        } 
        if (safeVirtualFolder.charAt(safeVirtualFolder.length-1) === '\\')
        {
            safeVirtualFolder = safeVirtualFolder.substr(0, safeVirtualFolder.length-1);
        } 
        
        files = search.recursiveSearchSync(/.resx$/, __dirname + virtualProjectRoot + safeVirtualFolder );      
    }
    
    if (files !== undefined)
    {
        const filesAsString = JSON.stringify(files).replace('[', "").replace(']', "");
        const splittedFiles = filesAsString.split(',');
        
        for (let i = 0, length = splittedFiles.length; i < length; i++)
        {   
            const resxFilename = splittedFiles[i].trim().replace(/"/g,"").replace(/\\\\/g,"\\");
            
            convertResxToTypeScriptModel(resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder);
        }
    }
    
    function convertResxToTypeScriptModel(resxFilename: string, typeScriptResourcesNamespace: string, virtualTypeScriptFolder: string): void {
        fs.readFile(resxFilename, function(err: any, data: any) {
            const parser = new xml2js.Parser();

            parser.parseString(data, function (err: any, result: any) {
                 if (result !== undefined)
                 {
                     convertXmlToTypeScriptModelFile(result, resxFilename, typeScriptResourcesNamespace, virtualTypeScriptFolder);                       
                 }
            });  
        });    
    }

    function convertXmlToTypeScriptModelFile(xmlObject: any, resxFilename: string, typeScriptResourcesNamespace: string, virtualTypeScriptFolder: string): void {
        const projectRoot = getProjectRoot();
        const relativeResxFilename = resxFilename.replace(projectRoot, "").replace(/\\/g, "/");
        const className = resxFilename.substr(resxFilename.lastIndexOf("\\") + 1).replace('.resx', '');
        const resources: Array<any> = [];
        let content = '// TypeScript Resx model for: ' + relativeResxFilename + '\n' + 
                      '// Auto generated by resx-to-typescript (npm package)' + '\n' + '\n';

        content = content + 'namespace ' + typeScriptResourcesNamespace + ' {\n';
        content = content + '   export class ' + className + ' {\n';

        if (xmlObject.root.data !== undefined) {
            for (let i = 0, nrOfResourcesInFile = xmlObject.root.data.length; i < nrOfResourcesInFile; i++)
            {
                const name = xmlObject.root.data[i].$.name;       
                const value =  xmlObject.root.data[i].value.toString().replace(/'/g, "\\'");   
                     
                resources.push({ name: name, value: value });  
            }           
        }
                    
        for(let j = 0, nrOfResources = resources.length; j < nrOfResources; j++) 
        {
            content = content + '       public ' + decapitalizeFirstLetter(resources[j].name) + ': string = `' + resources[j].value + '`;\n';
        }
        
        content = content + '   }\n';
        content = content + '}\n';
        
        // Write model if resources found
        if (resources.length > 0) {
            const relativeTsFilename = relativeResxFilename.replace('.resx', '.ts');
            const tsFileName = resxFilename.replace('.resx', '.ts');
            
            if (virtualTypeScriptFolder === undefined || virtualTypeScriptFolder === '')
            {
                // Write the file aside of the the resx file.
                fs.writeFileSync(tsFileName, content, null);                           

                addTypeScriptFile.execute(tsFileName);                          
            }
            else
            {
                // Write the file to the given output folder.
                const tsFileNameWithoutPath = tsFileName.substr(tsFileName.lastIndexOf('\\') + 1);
                const outputFileName = (projectRoot + virtualTypeScriptFolder + '\\' + tsFileNameWithoutPath).split('/').join('\\');
                const relativeOutputFileName = virtualTypeScriptFolder + '/' + tsFileNameWithoutPath;

                mkpath.sync(projectRoot + virtualTypeScriptFolder, '0700');
                
                fs.writeFileSync(outputFileName, content, null); 
                
                addTypeScriptFile.execute(relativeOutputFileName);                          
            }
        }
    }
    
    function getProjectRoot(): string {
        const splittedDirName = __dirname.split('\\');
        const spliitedRootDirName: Array<string> = [];
        
        for (let i = 0, length = splittedDirName.length - 3; i < length; i++) {
            spliitedRootDirName.push(splittedDirName[i]);
        }
        
        return spliitedRootDirName.join('\\');
    }

    function decapitalizeFirstLetter(input: string) {
        return input.charAt(0).toLowerCase() + input.slice(1);
    }
}

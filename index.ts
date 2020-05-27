declare const __dirname: string;
declare const require: any;

import * as fs from 'fs';
import * as path from 'path';
import fileseek from 'fileseek_plus';
import { Parser as XmlParser } from 'xml2js';
import { SlowBuffer } from 'buffer';

export interface res2TsOptions {
    mergeCulturesToSingleFile: boolean;
    generateTypeScriptResourceManager: boolean;
    searchRecursive: boolean;
    defaultResxCulture: string;
}

class Options implements res2TsOptions {

    public mergeCulturesToSingleFile: boolean = true;
    public generateTypeScriptResourceManager: boolean = true;
    public searchRecursive: boolean = false;
    public defaultResxCulture: string = 'en';

    constructor(optionsObject: res2TsOptions) {
        if(optionsObject == null) {
            return;
        }

        if(optionsObject.hasOwnProperty('mergeCulturesToSingleFile') && typeof optionsObject.mergeCulturesToSingleFile == 'boolean') {
            this.mergeCulturesToSingleFile = optionsObject.mergeCulturesToSingleFile;
        }

        if(optionsObject.hasOwnProperty('generateTypeScriptResourceManager') && typeof optionsObject.generateTypeScriptResourceManager == 'boolean') {
            this.generateTypeScriptResourceManager = optionsObject.generateTypeScriptResourceManager;
        }

        if(optionsObject.hasOwnProperty('searchRecursive') && typeof optionsObject.searchRecursive == 'boolean') {
            this.searchRecursive = optionsObject.searchRecursive;
        }

        if(optionsObject.hasOwnProperty('defaultResxCulture') && typeof optionsObject.defaultResxCulture == 'string') {
            this.defaultResxCulture = optionsObject.defaultResxCulture;
        }
    }
}

export default function execute(resxInput: string, outputFolder: string, options: res2TsOptions = null): void {

    // Read and validate the users options
    let OptionsInternal = new Options(options);

    // Check if an Input-Path was given
    if (resxInput === undefined || resxInput === '') {
        // files = search.recursiveSearchSync(/.resx$/, __dirname + virtualProjectRoot );
        console.error('No input-path given');
        return;
    }

    // Normalize the input and output path
    resxInput = path.normalize(resxInput);
    outputFolder = path.normalize(outputFolder);

    // Get the resx-file(s) from the input path
    let files: string[] = [];
    files = findFiles(resxInput, OptionsInternal.searchRecursive)

    // Check wether there are some files in the Input path
    if(files.length < 1) {
        console.log('No *.resx-files found in the input path.');
        return;
    }

    // Sort the files for their base resource and their culture
    let filesSorted = sortFilesByRes(files, OptionsInternal.defaultResxCulture);

    // Generate the JSON from the files (and get a list of all keys for the resource-manager generation)
    let resourceNameList = generateJson(filesSorted, outputFolder, OptionsInternal.mergeCulturesToSingleFile)

    // Generate the resource-manager (if set in the options)
    if(OptionsInternal.generateTypeScriptResourceManager) {
        generateResourceManager(resourceNameList);
    }

    return;
}


let parser: XmlParser;

function findFiles(resxInput: string, recursiveSearch: boolean): string[] {
    let files: string [] = [];

    if(resxInput == null) {
        console.error('No input filepath given');
        return files;
    }

    if(resxInput.endsWith('.resx') ) {
        if(!fs.existsSync(resxInput)) {
            console.warn('Specified file not found');
            return files;
        }
        files.push(resxInput);
        return files;
    }

    //TODO wait for the fileseek maintainer to merge my pull request
    files = fileseek(resxInput, /.resx$/, recursiveSearch);

    return files;
}

function sortFilesByRes(inputFiles: string [], defaultCulture: string): resxFiles {

    let sorted: resxFiles = {}

    for (let file of inputFiles)
    {
        //Filename and Culture
        let info = getResxFileInfo(file);

        if(info.culture == null) {
            info.culture = defaultCulture;
        }

        if(!sorted.hasOwnProperty(info.name)) {
            sorted[info.name] = {}
        }

        sorted[info.name][info.culture] = file;
    }

    return sorted;
}

function generateJson(resxFiles: resxFiles, outputFolder: string, mergeCultures: boolean): resourceFileKeyCollection {
    if(parser == undefined || parser == null) {
        parser = new XmlParser()
    }

    //Create the Directory before we write to it
    if(!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, {recursive: true})
    }

    let resourceFileKeyCollection: resourceFileKeyCollection = {};

    for (const resxFileName in resxFiles) {
        let cultureFiles = resxFiles[resxFileName];

        let resourceKeys: resxFileKeys;

        if(mergeCultures) {
            resourceKeys = generateJsonMerged(outputFolder, cultureFiles, resxFileName);
        } else {
            resourceKeys = generateJsonSingle(outputFolder, cultureFiles, resxFileName);
        }

        resourceFileKeyCollection[resxFileName] = resourceKeys;
    }

    return resourceFileKeyCollection;
}

function generateJsonMerged(outputFolder: string, cultureFiles: resxFileCulture, resourceName: string): resxFileKeys {

    let resKeys: string[] = [];

    let o: {[key: string]: resxKeyValues} = {};
    
    for (let culture in cultureFiles)
    {
        let file = cultureFiles[culture];

        let resxContentObject = getResxKeyValues(file);

        o[culture] = resxContentObject;

        // Add the ResourceKeys to the key collection
        resKeys = resKeys.concat(Object.keys(resxContentObject))
    }

    //Json stringify
    let content: string = JSON.stringify(o);

    //Write the file
    let targetFileName = `${resourceName}.json `;
    let targetPath = path.join(outputFolder, targetFileName);
    fs.writeFileSync(targetPath, content, {encoding: 'utf-8'});

    return {
        filename: resourceName,
        keys: new Set(resKeys)
    }
}

function generateJsonSingle(outputFolder: string, cultureFiles: resxFileCulture, resourceName: string): resxFileKeys {
    let resKeys: string[] = [];

    for (let culture in cultureFiles)
    {
        let file = cultureFiles[culture];

        let resxContentObject = getResxKeyValues(file);

        let o: {[key: string]: resxKeyValues} = {};
        o[culture] = resxContentObject;

        //Json strinify
        let content: string = JSON.stringify(o);

        //Write the file
        let targetFileName = `${resourceName}.${culture}.json `;
        let targetPath = path.join(outputFolder, targetFileName);
        fs.writeFileSync(targetPath, content, {encoding: 'utf-8'});

        // Add the ResourceKeys to the key collection
        resKeys = resKeys.concat(Object.keys(resxContentObject))
    }

    return {
        filename: resourceName,
        keys: new Set(resKeys)
    }
}

function generateResourceManager(resourceNameList: resourceFileKeyCollection) {

    //TODO

}

function getResxFileInfo(filePath: string): resxFileInfo {
    let fileCulture: string = null;
    let nameClean: string;

    let filename: string = path.basename(filePath);
    let filenameSplit = filename.split('.');
    filenameSplit.pop();

    if(filenameSplit.length > 1) {
        fileCulture = filenameSplit.pop();
    }

    nameClean = filenameSplit.join('.');

    return {
        name: nameClean,
        culture: fileCulture
    }
}

function getResxKeyValues(filepath: string): resxKeyValues {

    const resources: resxKeyValues = {};

    parser.reset();

    let fileContentString = fs.readFileSync(filepath, {encoding: 'utf-8'})

    parser.parseString(fileContentString, function (err: any, xmlObject: any) {

        if(xmlObject == undefined ||
            xmlObject == null ||
            !xmlObject.hasOwnProperty('root') ||
            !xmlObject.root.hasOwnProperty('data') ||
            xmlObject.root.data == undefined) {

            return;
        }

        for (let i in xmlObject.root.data)
        {
            const name = xmlObject.root.data[i].$.name;
            const value =  xmlObject.root.data[i].value.toString().replace(/'/g, "\\'");

            resources[name] = value;
        }

    });

    return resources;
}

interface resxFileInfo {
    name: string;
    culture: string;
}

interface resxFiles {
    [key: string]: resxFileCulture;
}

interface resxFileCulture {
    [key: string]: string;
}

interface resxKeyValues {
    [key: string]: string;
}

interface resxFileKeys {
    filename: string;
    keys: Set<string>;
}

interface resourceFileKeyCollection {
    [resourceFileName: string]: resxFileKeys
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const fileseek_plus_1 = require("fileseek_plus");
const xml2js_1 = require("xml2js");
class Options {
    constructor(optionsObject) {
        this.mergeCulturesToSingleFile = true;
        this.generateTypeScriptResourceManager = true;
        this.searchRecursive = false;
        this.defaultResxCulture = 'en';
        if (optionsObject == null) {
            return;
        }
        if (optionsObject.hasOwnProperty('mergeCulturesToSingleFile') && typeof optionsObject.mergeCulturesToSingleFile == 'boolean') {
            this.mergeCulturesToSingleFile = optionsObject.mergeCulturesToSingleFile;
        }
        if (optionsObject.hasOwnProperty('generateTypeScriptResourceManager') && typeof optionsObject.generateTypeScriptResourceManager == 'boolean') {
            this.generateTypeScriptResourceManager = optionsObject.generateTypeScriptResourceManager;
        }
        if (optionsObject.hasOwnProperty('searchRecursive') && typeof optionsObject.searchRecursive == 'boolean') {
            this.searchRecursive = optionsObject.searchRecursive;
        }
        if (optionsObject.hasOwnProperty('defaultResxCulture') && typeof optionsObject.defaultResxCulture == 'string') {
            this.defaultResxCulture = optionsObject.defaultResxCulture;
        }
    }
}
function execute(resxInput, outputFolder, options = null) {
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
    let files = [];
    files = findFiles(resxInput, OptionsInternal.searchRecursive);
    // Check wether there are some files in the Input path
    if (files.length < 1) {
        console.log('No *.resx-files found in the input path.');
        return;
    }
    // Sort the files for their base resource and their culture
    let filesSorted = sortFilesByRes(files, OptionsInternal.defaultResxCulture);
    // Generate the JSON from the files (and get a list of all keys for the resource-manager generation)
    let resourceNameList = generateJson(filesSorted, outputFolder, OptionsInternal.mergeCulturesToSingleFile);
    // Generate the resource-manager (if set in the options)
    if (OptionsInternal.generateTypeScriptResourceManager) {
        generateResourceManager(resourceNameList);
    }
    return;
}
exports.default = execute;
let parser;
function findFiles(resxInput, recursiveSearch) {
    let files = [];
    if (resxInput == null) {
        console.error('No input filepath given');
        return files;
    }
    if (resxInput.endsWith('.resx')) {
        if (!fs.existsSync(resxInput)) {
            console.warn('Specified file not found');
            return files;
        }
        files.push(resxInput);
        return files;
    }
    //TODO wait for the fileseek maintainer to merge my pull request
    files = fileseek_plus_1.default(resxInput, /.resx$/, recursiveSearch);
    return files;
}
function sortFilesByRes(inputFiles, defaultCulture) {
    let sorted = {};
    for (let file of inputFiles) {
        //Filename and Culture
        let info = getResxFileInfo(file);
        if (info.culture == null) {
            info.culture = defaultCulture;
        }
        if (!sorted.hasOwnProperty(info.name)) {
            sorted[info.name] = {};
        }
        sorted[info.name][info.culture] = file;
    }
    return sorted;
}
function generateJson(resxFiles, outputFolder, mergeCultures) {
    if (parser == undefined || parser == null) {
        parser = new xml2js_1.Parser();
    }
    //Create the Directory before we write to it
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }
    let resourceFileKeyCollection = {};
    for (const resxFileName in resxFiles) {
        let cultureFiles = resxFiles[resxFileName];
        let resourceKeys;
        if (mergeCultures) {
            resourceKeys = generateJsonMerged(outputFolder, cultureFiles, resxFileName);
        }
        else {
            resourceKeys = generateJsonSingle(outputFolder, cultureFiles, resxFileName);
        }
        resourceFileKeyCollection[resxFileName] = resourceKeys;
    }
    return resourceFileKeyCollection;
}
function generateJsonMerged(outputFolder, cultureFiles, resourceName) {
    let resKeys = [];
    let o = {};
    for (let culture in cultureFiles) {
        let file = cultureFiles[culture];
        let resxContentObject = getResxKeyValues(file);
        o[culture] = resxContentObject;
        // Add the ResourceKeys to the key collection
        resKeys = resKeys.concat(Object.keys(resxContentObject));
    }
    //Json stringify
    let content = JSON.stringify(o);
    //Write the file
    let targetFileName = `${resourceName}.json `;
    let targetPath = path.join(outputFolder, targetFileName);
    fs.writeFileSync(targetPath, content, { encoding: 'utf-8' });
    return {
        filename: resourceName,
        keys: new Set(resKeys)
    };
}
function generateJsonSingle(outputFolder, cultureFiles, resourceName) {
    let resKeys = [];
    for (let culture in cultureFiles) {
        let file = cultureFiles[culture];
        let resxContentObject = getResxKeyValues(file);
        let o = {};
        o[culture] = resxContentObject;
        //Json strinify
        let content = JSON.stringify(o);
        //Write the file
        let targetFileName = `${resourceName}.${culture}.json `;
        let targetPath = path.join(outputFolder, targetFileName);
        fs.writeFileSync(targetPath, content, { encoding: 'utf-8' });
        // Add the ResourceKeys to the key collection
        resKeys = resKeys.concat(Object.keys(resxContentObject));
    }
    return {
        filename: resourceName,
        keys: new Set(resKeys)
    };
}
function generateResourceManager(resourceNameList) {
    //TODO
}
function getResxFileInfo(filePath) {
    let fileCulture = null;
    let nameClean;
    let filename = path.basename(filePath);
    let filenameSplit = filename.split('.');
    filenameSplit.pop();
    if (filenameSplit.length > 1) {
        fileCulture = filenameSplit.pop();
    }
    nameClean = filenameSplit.join('.');
    return {
        name: nameClean,
        culture: fileCulture
    };
}
function getResxKeyValues(filepath) {
    const resources = {};
    parser.reset();
    let fileContentString = fs.readFileSync(filepath, { encoding: 'utf-8' });
    parser.parseString(fileContentString, function (err, xmlObject) {
        if (xmlObject == undefined ||
            xmlObject == null ||
            !xmlObject.hasOwnProperty('root') ||
            !xmlObject.root.hasOwnProperty('data') ||
            xmlObject.root.data == undefined) {
            return;
        }
        for (let i in xmlObject.root.data) {
            const name = xmlObject.root.data[i].$.name;
            const value = xmlObject.root.data[i].value.toString().replace(/'/g, "\\'");
            resources[name] = value;
        }
    });
    return resources;
}
//# sourceMappingURL=index.js.map
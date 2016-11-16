/*
 * grunt-webext-builder
 * https://github.com/MobDev-Hobby/grunt-webext-builder
 *
 * Copyright (c) 2016 MobDev
 * Licensed under the MIT license.
 */

'use strict';

module.exports = (grunt) => {

    const fs = require("fs");
    const path = require("path");
    const Promise = require("es6-promise").Promise;
    const decamelize = require('decamelize');
    
    grunt.registerMultiTask('webext_builder', 'Grunt plugin for build chrome, firefox, opera and safari extensions', function () {

        const readManifest = (srcDir) => {

            return new Promise((successCallback, errorCallback) => {

                let manifestPath = srcDir + "/manifest.json";
                if (grunt.file.exists(manifestPath)) {

                    let manifest = grunt.file.readJSON(manifestPath);
                    grunt.log.writeln("Found manifest for extension '" + manifest.name + "' version '" + manifest.version + "'");

                    successCallback(manifest);

                } else {

                    grunt.log.error("No manifest.json found in srcDir " + srcDir);
                    errorCallback();

                }
            });
        };

        const getFileName = (destDir, manifest, ext) => {

            return destDir
            + "/"
            + decamelize(manifest.name.replace(/[^\w\.]/gi, '')).replace('git_hub', 'github')
            + "-" + manifest.version
            + ext;

        };

        const getPrivateKey = () => {

            if (!this.data.privateKey) {

                grunt.log.warn("No privateKey property defined, use './.private.pem'");
            }

            let privateKeyPath = path.resolve(this.data.privateKey || "./.private.pem");

            if (!grunt.file.exists(privateKeyPath)) {

                const rsa = require('node-rsa');

                grunt.log.warn("No private key found at '" + privateKeyPath + "', generate new one");
                let key = new rsa({b: 2048});
                let keyVal = key.exportKey('pkcs1-private-pem');
                grunt.file.write(privateKeyPath, keyVal);
            }

            return grunt.file.read(privateKeyPath);
        };

        const signFirefox = (srcFile, destDir, manifest) => {

            grunt.log.writeln("Try to sign extension '" + srcFile + "' with AMO");
            return new Promise((successCallback, errorCallback) => {

                if(!this.data.jwtIssuer){
                    grunt.log.error("Error, can't sign extension with AMO, no jwtIssuer defined!");
                    grunt.log.error("Go to https://addons.mozilla.org/en-US/developers/addon/api/key/ to get credentials");
                    errorCallback();
                }

                if(!this.data.jwtSecret){
                    grunt.log.error("Error, can't sign extension with AMO, no jwtSecret defined!");
                    grunt.log.error("Go to https://addons.mozilla.org/en-US/developers/addon/api/key/ to get credentials");
                    errorCallback();
                }

                const signAddon = require('sign-addon').default;

                signAddon({
                    xpiPath: srcFile,
                    apiKey: this.data.jwtIssuer,
                    apiSecret: this.data.jwtSecret,
                    version: manifest.version,
                    id: manifest.id,
                    downloadDir: destDir
                }).then((result)=>{
                    console.log("Signed",result);
                    successCallback(result);
                },(err)=>{
                    grunt.log.error("Error, can't sign extension'");
                    grunt.log.error(err);
                    errorCallback(err);
                }).catch(grunt.log.error);

            });
        };

        const packFirefox = (srcDir, destDir) => {

            return new Promise((successCallback, errorCallback) => {

                readManifest(srcDir).then((manifest) => {

                    const archiveBuilder = require('archiver');

                    grunt.log.writeln("Load extension sources from '" + srcDir + "'");

                    let fileName = getFileName(destDir,manifest, "-raw.xpi")

                    let outStream = fs.createWriteStream(fileName);
                    let archive = archiveBuilder.create("zip");

                    archive.on('finish', ((fileName) => {
                        return () => {
                            grunt.log.writeln("ZIP archive generated '" + fileName + "'");
                            signFirefox(fileName,destDir,manifest)
                                .then(()=>successCallback)
                                .catch(()=>errorCallback);
                        }
                    })(fileName));

                    archive.on('error', ((fileName) => {
                        return (err) => {
                            grunt.log.error("Error, can't write " + fileName);
                            grunt.log.error(err);
                            errorCallback();
                        }
                    })(fileName));

                    grunt.log.writeln("Write output zip '" + fileName + "'");

                    archive.pipe(outStream);
                    archive.directory(path.resolve(srcDir),"");
                    archive.finalize();

                });
            });
        };


        const packChrome = (srcDir, destDir) => {
            return new Promise((successCallback, errorCallback) => {

                readManifest(srcDir).then((manifest) => {

                    const crxBuilder = require("crx");

                    let crx = new crxBuilder({
                        "privateKey": getPrivateKey()
                    });

                    grunt.log.writeln("Load extension sources from '" + srcDir + "'");

                    crx.load(path.resolve(srcDir)).then((crx) => {

                        grunt.log.writeln("Pack extension");
                        crx.pack().then((crxBuffer) => {

                            let fileName = getFileName(destDir, manifest, "-signed.crx");

                            grunt.log.writeln("Write output crx '" + fileName + "'");
                            grunt.file.write(fileName, crxBuffer);
                            grunt.log.writeln("Done!");
                            successCallback();

                        }, (err) => {

                            grunt.log.error("Error, can't pack extension");
                            grunt.log.error(err);
                            errorCallback();

                        });

                    }, (err) => {

                        grunt.log.error("Error, can't load extension from '" + srcDir + "'");
                        grunt.log.error(err);
                        errorCallback();

                    });

                });
            });
        };

        this.files.forEach((file) => {

            file.src.forEach((srcDir) => {
                if (!grunt.file.exists(srcDir)) {
                    grunt.log.error("No srcDir '" + srcDir + "' exists");
                }

                let destDir = path.resolve(file.dest);

                if (!grunt.file.exists(destDir)) {

                    grunt.file.mkdir(destDir);
                    grunt.log.writeln("Create '" + destDir + "' directory");

                }

                if (this.data.targets.includes("chrome-crx")) {

                    grunt.log.writeln("Build chrome CRX");
                    let done = this.async();
                    packChrome(srcDir, destDir).then(done).catch(done);

                }

                if (this.data.targets.includes("firefox-xpi")) {

                    grunt.log.writeln("Build Firefox Signed XPI");
                    let done = this.async();
                    packFirefox(srcDir, destDir).then(done).catch(done);
                }

            });
        });
    });
};

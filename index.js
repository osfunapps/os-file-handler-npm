const fs = require('fs');
const path = require('path');

const self = module.exports = {

        /**
         * Will recursively create a directory, and all of the directories to it's path, if needed
         */
        createDir: function (dirPath) {
            fs.mkdirSync(dirPath, {recursive: true});
        },

        /**
         * Will return the path to the parent of a file
         */
        getParentDir: function (filePath) {
            return path.dirname(filePath);
        },

        /**
         * Will check if a file is a directory
         */

        isDir: function (filePath) {
            return new Promise(async function (resolve, reject) {
                fs.lstat(filePath, (err, stats) => {
                    let dir = stats.isDirectory()
                    resolve(dir)
                });
            }.bind())
        },

        /**
         * Will return the inner dirs of a current dir
         */
        getDirs: async function (filePath) {
            let dirContent = self.getDirContent(filePath)
            let dirsList = [];
            for (let i = 0; i < dirContent.length; i++) {
                let pathh = self.joinPath(filePath, dirContent[i])
                if (await self.isDir(pathh)) {
                    dirsList.push(dirContent[i])
                }
            }
            return dirsList
        },

        /**
         * Will check if file (or directory) exists
         */
        isFileOrDirExists: function (path) {
            try {
                return fs.existsSync(path);
            } catch (err) {
                return false
            }
        },

        /**
         * Will remove a file from a directory
         */
        removeFile: function (filePath) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                //if no file exist, no problem
            }
        },


        /**
         * Will remove a list of files
         */
        removeFiles: function (filePaths) {
            for (let i = 0; i < filePaths.length; i++) {
                self.removeFile(filePaths[i])
            }
        },

        /**
         * Will return the content of a directory (only immediate children).
         */
        getDirContent: function (dirPath, ignoreFiles = ['.DS_Store']) {
            let files = fs.readdirSync(dirPath);
            return files.filter(file => {
                for (let i = 0; i < ignoreFiles.length; i++) {
                    if (file === ignoreFiles[i]) {
                        return false
                    }
                }
                return true
            })
        },

        /**
         * Will return the full paths of files and/or dirs in a directory.
         *
         * @param dirPath -> the path to the directory
         * @param recursive -> set to true if you want to look in inner directories as well
         * @param collectFiles -> set to true if you want files in the output list
         * @param collectDirs -> set to true if you want dirs in the output list
         * @param ignoreFiles -> set the list of files you wish to ignore
         */
        getDirContentFullPaths: function (dirPath, recursive = false, collectFiles = true, collectDirs = true, ignoreFiles = ['.DS_Store']) {
            return new Promise(async function (resolve, reject) {
                let files = [];
                if (recursive) {
                    files = await self.findFilesInPath(dirPath, '*', '.*', collectFiles, collectDirs, ignoreFiles)
                } else {
                    fs.readdirSync(dirPath).forEach(file => {
                            let fullPath = path.join(dirPath, file);
                            files.push(fullPath);
                        }
                    );
                    files = await filterFiles(files, collectFiles, collectDirs, ignoreFiles)
                }
                resolve(files)
            }.bind())
        },


        /**
         * Will search for files in a given path
         */
        findFilesInPath: function (dirPath, fileName = '*', fileExtension = '.*', collectFiles = true, collectDirs = true, ignoreFiles = ['.DS_Store']) {
            return new Promise(function (resolve) {

                const glob = require('glob');
                let searchQuery = dirPath + '/**/' + fileName + fileExtension;
                glob(searchQuery, {}, async function (err, files) {
                    resolve(await filterFiles(files, collectFiles, collectDirs, ignoreFiles))
                })
            }.bind())
        }
        ,


        /**
         * Will remove a directory (and all of it's content)
         */
        removeDir: function (path) {
            return new Promise(async function (resolve, reject) {
                let deleteFolderRecursive = function (path) {
                    if (fs.existsSync(path)) {
                        fs.readdirSync(path).forEach(function (file, index) {
                            var curPath = self.joinPath(path, file);
                            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                                console.log("going again!!!")
                                deleteFolderRecursive(curPath);
                            } else { // delete file
                                console.log("unlinking!!!")
                                fs.unlinkSync(curPath);
                            }
                        });
                        fs.rmdirSync(path);
                    }
                };
                deleteFolderRecursive(path)
                resolve()
            }.bind())


        }
        ,

        /**
         * Will copy a file to a given destination
         */
        copyFile: async function (src, dst) {
            return new Promise(async function (resolve, reject) {

                var parentDir = self.getParentDir(dst);
                if (!self.isDirExists(parentDir)) {
                    self.createDir(parentDir)
                }
                fs.copyFile(src, dst, (err) => {
                    if (err) {
                        throw err;
                    } else {
                        resolve()
                    }
                });
            }.bind());
        }
        ,

        /**
         * Will check if dir exists
         */
        isDirExists: function (path) {
            return fs.existsSync(path)
        }
        ,


        /**
         * Will turn a list of file paths to file names
         */
        filesPathListToFileNamesList: function (filePathList) {
            let fileNamesList = [];
            for (let i = 0; i < filePathList.length; i++) {
                fileNamesList[i] = self.getFileNameFromPath(filePathList[i])
            }
            return fileNamesList
        }
        ,

        /**
         * Will return the file name from a given path
         */
        getFileNameFromPath: function (path, withExtension = true) {
            let fName = path.replace(/^.*[\\\/]/, '');
            if (!withExtension) {
                return self.stripExtension(fName)
            } else {
                return fName
            }
        }
        ,

        /**
         * Will strip the extension from a file
         */
        stripExtension: function (file) {
            return file.split('.').slice(0, -1).join('.')
        }
        ,

        /**
         * Will join the paths of dirs
         */
        joinPath: function (...paths) {
            return path.join(...paths)
        }
        ,

        /**
         * Will return the size of a file
         */
        getFileSize: function (filePath, inMB = false, inKB = false, inBytes = false) {
            const stats = fs.statSync(filePath);
            const fileSizeInBytes = stats.size;
            //Convert the file size to megabytes (optional)
            if (inMB) return fileSizeInBytes / 1000000.0;
            if (inKB) return fileSizeInBytes / 1000.0;
            if (inBytes) return fileSizeInBytes;
            return fileSizeInBytes
        }
        ,

        /**
         * Will filter a list of files by size.
         *
         * @param filePathsArr -> the files list
         * @param checkInMB -> set true to check in mb
         * @param checkInKb -> set true to check in kb
         * @param checkInBytes -> set true to check in bytes
         * @param biggerThanSize -> set an int here if you want to check for bigger than
         * @param smallerThanSize -> set an int here if you want to check for snmalle than
         * @return {Array} -> a list of all of the file paths which correspond to the characteristics set
         */
        filterFilesBySize: function (filePathsArr,
                                     checkInMB = false,
                                     checkInKb = false,
                                     checkInBytes = false,
                                     biggerThanSize = -1,
                                     smallerThanSize = -1) {

            let resLst = [];
            for (let i = 0; i < filePathsArr.length; i++) {
                let fileSize = self.getFileSize(filePathsArr[i], checkInMB, checkInKb, checkInBytes);

                if (biggerThanSize !== -1) {
                    if (fileSize > biggerThanSize) {
                        if (smallerThanSize !== -1) {
                            if (fileSize < smallerThanSize) {
                                resLst.push(filePathsArr[i]);
                                continue
                            }
                        } else {
                            resLst.push(filePathsArr[i]);
                            continue
                        }
                    }
                }

                if (smallerThanSize !== -1) {
                    if (fileSize < smallerThanSize) {
                        if (biggerThanSize !== -1) {
                            if (fileSize > biggerThanSize) {
                                resLst.push(filePathsArr[i]);

                            }
                        } else {
                            resLst.push(filePathsArr[i]);

                        }
                    }
                }

            }
            return resLst
        },
    }
;

// Will do a filtration for a list of files by properties
async function filterFiles(filesArr, collectFiles = true, collectDirs = true, ignoreFiles = ['.DS_Store']) {
    for (let i = filesArr.length - 1; i >= 0; i--) {

        // remove ignored
        for (let j = 0; j < ignoreFiles.length; j++) {
            if (filesArr[i] === ignoreFiles[j]) {
                filesArr.splice(i, 1)
                continue
            }
        }

        // remove dirs
        if (await self.isDir(filesArr[i])) {
            if (!collectDirs) {
                filesArr.splice(i, 1)
                continue
            }
        } else {
            // remove files
            if (!collectFiles) {
                filesArr.splice(i, 1)
                continue
            }
        }

    }
    return filesArr
}
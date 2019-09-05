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
     * Will return the content of a directory
     */
    getDirContent: function (dirPath) {
        return fs.readdirSync(dirPath);
    },

    /**
     * Will return the full paths of files in a directory.
     *
     * @param dirPath -> the path to the directory
     * @param recursive -> set to true if you want to look in inner directories as well
     */
    getDirContentFullPaths: function(dirPath, recursive=false) {
    return new Promise(async function (resolve, reject) {
        let files = [];
        if (recursive) {
            files = await self.findFilesInPath(dirPath)
        } else {
            fs.readdirSync(dirPath).forEach(file => {
                let fullPath = path.join(dirPath, file);
                files.push(fullPath);
            });
        }
        resolve(files)
    }.bind())
},


    /**
     * Will search for files in a given path
     */
    findFilesInPath: function (dirPath, fileName = '*', fileExtension = '.*') {
        return new Promise(function (resolve) {

            const glob = require('glob');
            let searchQuery = dirPath + '/**/' + fileName + fileExtension;
            glob(searchQuery, {}, (err, files) => {
                resolve(files)
            })
        }.bind())
    },


    /**
     * Will remove a directory (and all of it's content)
     */
    removeDir: function (path) {
        let deleteFolderRecursive = function (path) {
            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function (file, index) {
                    var curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        };
        deleteFolderRecursive(path)
    },

    /**
     * Will copy a file to a given destination
     */
    copyFile: function (src, dst) {
        var parentDir = self.getParentDir(dst);
        if (!self.isDirExists(parentDir)) {
            self.createDir(parentDir)
        }
        fs.copyFile(src, dst, (err) => {
            if (err) throw err;
        });
    },

    /**
     * Will check if dir exists
     */
    isDirExists: function (path) {
        return fs.existsSync(path)
    },


    /**
     * Will turn a list of file paths to file names
     */
    filesPathListToFileNamesList: function (filePathList) {
        let fileNamesList = [];
        for (let i = 0; i < filePathList.length; i++) {
            fileNamesList[i] = self.getFileNameFromPath(filePathList[i])
        }
        return fileNamesList
    },

    /**
     * Will return the file name from a given path
     */
    getFileNameFromPath: function (path) {
        return path.replace(/^.*[\\\/]/, '')
    },

    /**
     * Will strip the extension from a file
     */
    stripExtension: function (file) {
        return file.split('.').slice(0, -1).join('.')
    },

    /**
     * Will join the path of dirs
     */
    joinPath: async function (...paths) {
        return path.join(paths)
    },

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
    },

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
    }

};
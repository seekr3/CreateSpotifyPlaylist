const
    { promisify } = require('util'),
    {
        readFile,
        writeFile,
        readFileSync,
    } = require('fs')

    
    readFileProm = promisify(readFile,),
    writeFileProm = promisify(writeFile),
    jsonify = data => JSON.stringify(data, null, 2),

    read = path => readFileProm(path).then(JSON.parse),
    write = (path, data) => writeFileProm(path, jsonify(data)),

    writeLog = async data => write('./log/log.json', data) && console.log('log written'),

    writeToken = ({
        access_token,
        refresh_token,
        token_type,
        expires_in,
    }) => write('./auth/access_token.json', {
        Authorization: `${token_type} ${access_token}`,
        refresh_token,
        expire_time: Date.now() + expires_in * 1000,
      });

    readSync = path => JSON.parse(readFileSync(path))
;

module.exports = {
    readSync,
    read,
    write,
    writeLog,
    writeToken,
};

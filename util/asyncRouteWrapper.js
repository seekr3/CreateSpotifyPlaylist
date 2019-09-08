const error = require('./error');


module.exports = fn =>
    (req, res, next) => {
        Promise.resolve(fn(req, res))
            .catch(error);
    }
;
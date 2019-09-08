const wait = val => new Promise(res => setTimeout(res, val));

module.exports = {
    wait,
};
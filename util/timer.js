class Timer {

    constructor(msg='start') {
        this.last = this.start = Date.now();
        console.log(msg);
    }

    log(...args) {
        const now = Date.now();
        
        console.log(
            `total: ${now - this.start}ms`,
            `last:  ${now - this.last}ms`,
            ...args
        );

        this.last = now;
    }

}

module.exports = Timer;
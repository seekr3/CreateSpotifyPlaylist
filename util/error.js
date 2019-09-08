const error = e => {

    try {

        const {
            response,
            request,
            config,
        } = e;

        
        

        if (response) {

            const {
                data,
                status,
                headers,
            } = response;

            console.error('data:', data);
            console.error('status:', status);
            console.error('headers:', headers);
        
        } else if (request) console.error('request:', request);

        else console.error('Error', e);
        

        if (config) console.error('config:', config);
    
    } catch(e) { console.error(e); }
}

function wrap(prom) {
    return prom()
        .catch(error);
}

module.exports = wrap;
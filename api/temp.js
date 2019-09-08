async function query(type, q) {

    const params = {
        type,
        q,
        limit: 50,
        offset: 0,
    };

    var results = [];

    do {

        var data = (await get('search', params))[type + 's'];

        results.push(...data.items);

        params.offset += params.limit;
    
    } while(data.next);

    return results;

}

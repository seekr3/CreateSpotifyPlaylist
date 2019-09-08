const
    me = 'users/karixening/',
    util = '.././util/',
    {
        sortDiscog,
        sortByPopularity,
        sortByPlaycount,
        sortAndSlice,
    } = require(util + 'sort'),
    Timer = require(util + 'timer'),
    wrap = require(util + 'error'),
    {
        writeLog,
    } = require(util + 'fs')
;

function uris (tracks) {
    return tracks.map(({ uri }) => uri);
}

function ids (items) {
    return items.map(({ id }) => id);
}

function names (items) {
    return items.map(({ name }) => name);
}

// series

async function getLastfmPlaycounts(track_objs, artist) {

    var misses = [];

    await Promise.all(track_objs.map(obj => lastfm
        .get('', {
            params: {
                method: 'track.getinfo',
                track: obj.name,
                artist,
                api_key: lastfm.api_key,
                format: 'json',
            }
        })
        .then(({ data }) => {
            obj.playcount = data.track.playcount;
        })
        .catch(e => {
            obj.playcount = 0;
            misses.push(obj.name)
        })
        
    ));

    return misses;
};

// pages

async function getMyTopTracks() {
    const url = 'me/top/tracks';
    var params = {
        limit: 49,
        offset: 0,
    };

    var { items } = await get(url, params);

    params.limit = 50;
    params.offset = 49;

    items.push(...(await get(url, params)).items);

    return uris(items);
}

// get one, then series

async function getMyPlaylists() {

    const limit = 50;

    const {
        items,
        total
    } = await get('me/playlists', {
        limit,
        offset: 0,
    });
    
    var offsets = Array.from(Array(total / limit | 0), (x, i) => (i + 1) * limit);
    
    var resps = await Promise.all(

        offsets.map(offset =>

            get('me/playlists', {
                limit,
                offset,
            })

        )

    );

    return resps.reduce((acc, { items }) =>
        acc.concat(items),
    items);
}

async function getPlaylist(find) {

    const items = await getMyPlaylists();

    return items.find(({ name }) => name === find);
}

// ordered

async function createPlaylist(name, track_uris) {

    const { id } = await post(me + 'playlists', {
        name,
        public: false,
    });

    const numPost = 40;

    for (let i = 0 ; i < track_uris.length; i += numPost ) {

        const j = Math.min(i + numPost, track_uris.length);

        await post(
            `playlists/${id}/tracks`,
            { uris: track_uris.slice(i, j)}
        );
    }
}

async function deletePlaylist(id) {

    await del(`playlists/${id}/followers`);

}

async function deleteIfExisting(name) {

    const playlists = await getMyPlaylists();

    const item = playlists.find(item => item.name === name);

    if (item) {

        await deletePlaylist(item.id);

        console.log(item.name, 'deleted');
    }



}

// single

async function getArtist(artist) {

    const params = {
        type: 'artist',
        q: 'artist:' + artist,
        limit: 50,
        offset: 0,
    };

    while (true) {

        const { artists: { items } } = await get('search', params)

        for (const item of items) {
            if (artist === item.name) {
                console.log(item.name);
                return item;
            } 
        }

        if (items.length !== params.limit) throw 'artist not found';

        params.offset += params.limit;
    }   
}

async function getArtistTopTracks(artist) {

    const { id } = await getArtist(artist);

    const { artists } = await get(`artists/${id}/related-artists`);

    return names(artists);

}

// get one, then series

async function getArtistAlbums(artist_id) {

    const limit = 50;

    const {
        items,
        total
    } = await get(`artists/${artist_id}/albums`, {
        limit,
        offset: 0,
    });
    
    var offsets = Array.from(Array(total / limit | 0), (x, i) => (i + 1) * limit);
    
    var resps = await Promise.all(

        offsets.map(offset =>

            get(`artists/${artist_id}/albums`, {
                limit,
                offset,
            })

        )

    );

    return [{ items }]
        .concat(resps)
        .reduce((acc, { items }) => {

            items.forEach(item => {

                if (acc.every(({ name }) =>

                    name !== item.name
                
                )) acc.push(item);

            })

            return acc;
        
        }, []);

}

// pages

async function getAlbumListTracks(album_ids, artist) {

    var results = [];

    const limit = 75;

    for (let i = 0; i < limit; i += limit) {

        results.push(
            ...(await Promise.all(album_ids
                .slice(i, Math.min(i + limit, album_ids.length))
                .map(id =>
                    get(`albums/${id}/tracks`)
                        .then(({ items }) => items)
                )
            ).then(data =>
                [].concat(...data)
            ))
        );

    }

    return results.filter(item => item
        .artists
        .some(({ name }) => name === artist)
    );
}

// series

async function getTracks(track_ids) {

    let end = [];
    const limit = 50;

    var results = await Promise.all(

        track_ids
            .reduce((acc, id) => {

                if (end.length === limit) acc.push(end = []);
                
                end.push(id);

                return acc;

            }, [end])
            .map(ids =>
                get('tracks', { ids: ids.join(',') })
            )
    );

    return results.reduce((acc, { tracks }) =>
        acc.concat(tracks)
    , []);
}

async function saveMyTopTracks() {

    var tracks = await getMyTopTracks();

    await createPlaylist('My Top Tracks', tracks);

}

async function createArtistPlaylist(artist, { title, sort, prioritize, first, }, create = true) {

    var timer = new Timer;

    const { id } = await getArtist(artist);

    timer.log('artist');

    let album_ids = ids(await getArtistAlbums(id));

    timer.log('albums: ', album_ids.length);

    let tracks = await getAlbumListTracks(album_ids, artist);

    timer.log('track_ids: ', tracks.length);
    
    tracks = await getTracks(ids(tracks));

    timer.log('track_objs: ', tracks.length);

    if (prioritize) tracks = prioritize(tracks);

    // let misses = await getLastfmPlaycounts(tracks, artist);

    // timer.log('lastfm');

    if (sort)
        tracks = sortAndSlice(tracks, sort, first)
    ;

    if (create) {
        await deleteIfExisting(title);
        await createPlaylist(title, uris(tracks));
        timer.log('playlist created');
    };

    // console.log('misses: ', misses.length);

    // misses.map(console.log);

    return tracks;
}

var get, post, put, lastfm;

async function init() {

    const {
        init,
    } = require('./request');

    ({
        get,
        post,
        put,
        del,
        lastfm,
    } = await init());

    return {
        getArtistTopTracks,
        getMyTopTracks,
        createArtistPlaylist,
        deleteIfExisting,
    };
}

module.exports = init;

if (require.main === module) {

    wrap(async function() {

        await init();

        var data = await getPlaylist('Robyyn');

        await writeLog(data);

    });

}

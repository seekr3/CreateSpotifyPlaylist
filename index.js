require('dotenv').config();

const
    util = './util/',
    init = require('./api/api'),
    {
        sortDiscog,
        sortByPopularity,
        sortByPlaycount,
    } = require(util + 'sort'),
    {
        prioritizeAlbums,
        prioritizeSingles,
        prioritizePopulatiry,   
    } = require(util + 'prioritize'),
    wrap = require(util + 'error')
;

async function main() {

    const {
        getArtistTopTracks,
        getMyTopTracks,
        createArtistPlaylist,
        deleteIfExisting,
    } = await init();

    const
        artist = process.argv[2] || '',
        popular = {
            title: artist + ' top tracks',
            sort: sortByPopularity,
            prioritize: prioritizePopulatiry,
            first: 50,
        },
        discog = {
            title: artist + ' discog',
            sort: sortDiscog,
            prioritize: prioritizeSingles,
        },
        singles = {
            title: artist + ' singles',
            sort: sortDiscog,
            prioritize: prioritizeSingles
        },
        playcounts = {
            title: artist + ' playcounts',
            sort: sortByPlaycount,
        }
    ;

    if (!artist) throw 'no artist selected. Set as process arg or type into file';

    var data = await createArtistPlaylist(artist, popular);

    data = data.map(({
        album,
        artists,
        name,
        track_number,
        popularity,
        playcount,
    }) => ({
        name,
        album_name: album.name,
    }));

    await writeLog(data);

}

wrap(main);

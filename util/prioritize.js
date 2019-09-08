function prioritizeAlbums(tracks) {
    var dates = {};

    for (var { album: { release_date } } of tracks) {
        dates[release_date] = dates[release_date]? dates[release_date] + 1: 1;
    }

    return tracks.sort((a, b) => 
        dates[b.album.release_date] - dates[a.album.release_date]
    ).reduce((acc, track) => 
        acc.every(({ name }) => name !== track.name)?
        acc.concat(track):
        acc
    , []);
}

function prioritizeSingles(tracks) {
    var dates = {};

    for (var { album: { release_date } } of tracks) {
        dates[release_date] = dates[release_date]? dates[release_date] + 1: 1;
    }

    return prioritizeAlbums(tracks).filter(({ album: { release_date } }) => 
        dates[release_date] < 7
    )
}



function prioritizePopulatiry(tracks) {
    return tracks.reduce((acc, track) => {
        var index = acc.findIndex(({ name }) => name === track.name);

        if (index === -1) 
            acc.push(track);
        else if (acc[index].popularity < track.popularity) 
            acc[index] = track;
        
        return acc;
    }, []);
}

module.exports = {
    prioritizeSingles,
    prioritizeAlbums,
    prioritizePopulatiry,
}

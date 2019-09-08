function sortAlphabetically(prop) {
    return function(a, b) {
        return (
            a[prop]
                .toLowerCase()
                .charCodeAt(0)
            - b[prop]
                .toLowerCase()
                .charCodeAt(0)
        );
    }
}

function sortByDate(a, b) {
    return new Date(b.release_date) - new Date(a.release_date);
}

function sortByTrackNumber(a, b) {
    return a.track_number - b.track_number;
}

function sortDiscog(a, b) {
    return sortByDate(a.album, b.album) || sortByTrackNumber(a, b);
}

function sortByPopularity(a, b) {
    return b.popularity - a.popularity;
}

function sortByPlaycount(a, b) {
    return b.playcount - a.playcount;
}

function sortAndSlice(list, sort, top=null) {
    return list
        .sort(sort)
        .slice(0, top || list.length);
}

module.exports = {
    sortAlphabetically,
    sortDiscog,
    sortByPopularity,
    sortByPlaycount,
    sortAndSlice,
};
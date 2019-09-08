const
  util = './../util/',
  {
    read,
  } = require(util + 'fs'),
  axios = require('axios'),
  getAuth = require('./get_auth_token')
;

function cleanLastfm(data) {
  return data;
}

function cleanSpotify(data) {

  const keys = [
    'available_markets',
    'images',
    'external_urls',
    'is_local',
    'primary_color',
    'video_thumbnail',
  ];

  function recurse (data) {
    for (var key in data) {
      if (keys.includes(key)) {
        delete data[key];
      }
      else if (data[key] === 'name') {
        data[key] = data[key].toLowerCase();
      }
      else {
        switch(typeof data[key]) {
          case 'object':
            recurse(data[key]);
            break;
        }
      }
    }
  }
  recurse(data);
  return data;
}

axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.put['Content-Type'] = 'application/json';

const lastfm = axios.create({
  baseURL: 'http://ws.audioscrobbler.com/2.0/',
  transformResponse: [
    JSON.parse,
    cleanLastfm,
  ],
});

lastfm.api_key = '434afecdf99ff904cc11c2bbfdb2d373';

async function init() {

  const Authorization = await getAuth();

  const spotify = axios.create({
    baseURL: 'https://api.spotify.com/v1/',
    headers: { Authorization },
    transformResponse: [
      data => data? JSON.parse(data): {},
      cleanSpotify,
    ]
  });

  const get = (url, params) => spotify
  .get(url, { params })
  .then(({ data }) => data);

  const post = (url, body, params) => spotify
    .post(url, body, { params })
    .then(({ data }) => data);

  const put = (url, body, params) => spotify
    .put(url, body, { params })
    .then(({ data }) => data);

  const del = (url, params) => spotify
    .delete(url, { params })
    .then(({ data }) => data);
  
  return {
    get,
    post,
    put,
    del,
    lastfm,
  };

}

module.exports = {
  init,
};

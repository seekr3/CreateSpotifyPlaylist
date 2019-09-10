const
  root = __dirname + '/.././'
  util = root + 'util/',

  { exec } = require('child_process'),
  { stringify } = require('querystring'),

  axios = require('axios'),
  app = require('express')(),

  {
    read,
    writeToken,
  } = require(util + 'fs'),
  wrapRoute = require(util + 'asyncRouteWrapper.js'),
  scope = require('./scope.js'),
  error = require(util + 'error')
;

const
  port = 8888,
  appUrl = `http://localhost:${port}/`,
  {
    client_id,
    client_secret,
  } = process.env,
  redirect_uri = appUrl + 'callback'
;

const authorize = 'https://accounts.spotify.com/authorize?' + stringify({
    response_type: 'code',
    client_id,
    redirect_uri,
    scope,
  })
;

const accounts = axios.create({
  baseURL: 'https://accounts.spotify.com/api/token',
  headers: {
    Authorization: 'Basic ' + Buffer
      .from(`${client_id}:${client_secret}`)
      .toString('base64'),
    'Content-Type': 'application/x-www-form-urlencoded',
  }
});

app.get('/auth', (req, res) => res.redirect(authorize));

app.get('/callback', wrapRoute(async (req, res) => {

  const { data } = await accounts.post('', '', {
    params: {
      grant_type: 'authorization_code',
      redirect_uri,
      code: req.query.code,
    },
  })
  ;

  await writeToken(data);

  res.sendFile('public/close.html', { root }, err => {
    if (err) throw err;
    console.log('token saved!');
    process.exit(0);
  });

}));

function getToken() {

  app.listen(port, err => {

    if (err) throw err;

    exec(
      `open -n "/Applications/Google Chrome.app" ${appUrl}auth` //--args --incognito
    );
  });
}

async function checkRefresh() {

  const {
    expire_time,
    refresh_token,
  } = await read('./auth/access_token.json');

  if (expire_time <= Date.now()) {

    const { data } = await accounts.post('', '', {
      params: {
        grant_type: 'refresh_token',
        refresh_token,
      },
    });

    data.refresh_token = refresh_token;

    await writeToken(data);

    console.log('refreshed!');

  }

}

async function getAuth() {
  try {
    await checkRefresh();
    return (await read('./auth/access_token.json')).Authorization;
  }
  catch(e) {
    console.log(e);
    getToken();
    throw 'no access token, must authenticate first';
  }
  
}

if (require.main === module);

module.exports = getAuth;

'use strict'

const spotify = require('./spotify.js');


async function init() {
    await spotify.init();
    console.log(await spotify.choosePlaylist('megamawman'));
}

init();
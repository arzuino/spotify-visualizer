const SpotifyWebApi = require('spotify-web-api-node');
const console = require('console');
require('dotenv').config();

/* UI functions */
function setNextSong(title, artist, imgUrl) {
    document.getElementById('background').src = imgUrl;
    document.getElementById('cover').src = imgUrl;
    document.getElementById('title').innerHTML = title;
    document.getElementById('artist').innerHTML = artist;
    // Make everything visible and enable the progress bar
    document.getElementById('cover').style.visibility = "visible";
    document.getElementById('background').style.visibility = "visible";
    document.getElementById('track-info').style.visibility = "visible";
    document.getElementById('progressBarParent').style.visibility = "visible";
    document.getElementById('progressBarParent').style.animation = "none";
}


function setPaused() {
    setCurrentProgressPercent(false);
    document.getElementById('progressBarParent').style.animation = "blinker 3s linear infinite";
}

function setLoading(text) {
    document.getElementById('loading').innerHTML = text;
    document.getElementById('cover').style.visibility = "hidden";
    document.getElementById('background').style.visibility = "hidden";
    document.getElementById('track-info').style.visibility = "hidden";
    document.getElementById('progressBarParent').style.visibility = "hidden";
    document.getElementById('progressBarParent').style.animation = "none";
}

/* "backend"/logic functions */
let tokenExpirationEpoch = 0;
let lastSongId = "";
let songStartEpochMs = 0;
let songLengthMs = 0;
let playing = false;
let rateLimitEpoch = 0;
// The interval in seconds at which the progress bar should is updated, greater times means smoother animations
const progressAnimationTime = 2;

// Set the initial loading screen as soon as doc is loaded
let tid = setInterval(function () {
    if (document.readyState !== 'complete') return;
    clearInterval(tid);
    setLoading("Connecting to Spotify...");
}, 10);

// Connect to spotify with details provided in .env file
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
});
spotifyApi.setRefreshToken(process.env.REFRESH_TOKEN);

refreshApiKeys();

// Main interval
setInterval(function () {
    // Check if we are rate limited
    if ((rateLimitEpoch - new Date().getTime() / 1000) > 0) {
        setLoading("Waiting for Spotify...");
        console.log("Rate limited, waiting for " + (rateLimitEpoch - new Date().getTime() / 1000) + " seconds");
        return;
    }
    // Refresh access token if needed
    if ((tokenExpirationEpoch - new Date().getTime() / 1000) < 60) {
        refreshApiKeys();
    }
    // Get information about current playing song for signed in user
    updatePlayStateApi();

}, 3000);


// Interval for progress bar updates
setInterval(function () {
    if (playing === true) setCurrentProgressPercent(true);
}, progressAnimationTime * 1000);

// "Main" function
function updatePlayStateApi() {
    spotifyApi.getMyCurrentPlaybackState({})
        .then(function (data) {
            if (data.statusCode === 429) {
                // Rate limited
                rateLimitEpoch = (new Date().getTime() / 1000) + data.headers["Retry-After"] + 5;
            } else if (data.body.is_playing === undefined) {
                setLoading("Playback stopped");
                console.log("Playback is stopped");
                lastSongId = ""; // force reload of song as soon as playing again
                payling = false;
            } else if (data.body.is_playing === false && lastSongId !== "") {
                // If paused and a song has already been displayed (which means lastSongId is set)
                if (playing) {
                    // Only print this stuff once
                    playing = false;
                    setPaused();
                    console.log("Playback is paused");
                }
            } else {
                // Only update cover and title if song is different
                let title = data.body.item.name;
                let id = data.body.item.id;
                if (lastSongId !== id || playing === false) {
                    lastSongId = id;
                    songLengthMs = data.body.item.duration_ms;
                    let artists = getArtistsString(data.body.item.artists);
                    let coverUrl = data.body.item.album.images[0].url;
                    console.log("Now Playing: " + title + " - " + artists);
                    setNextSong(title, artists, coverUrl);
                }
                playing = data.body.is_playing;
                let newSongStartEpochMs = new Date().getTime() - data.body.progress_ms;
                if (Math.abs(newSongStartEpochMs - songStartEpochMs) > 1000) {
                    // Only reset progress if it drifted by more than 2s
                    songStartEpochMs = newSongStartEpochMs;
                    setCurrentProgressPercent(false);
                }
            }
        }, function (err) {
            if (err.name === "WebapiError") {
                if (err.statusCode === undefined) {
                    console.log("Error, no connection");
                } else {
                    console.log("Api Error: ", err);
                }
            } else {
                console.log('Something went wrong!', err);
            }
            lastSongId = ""; // force reload of song as soon as playing again
        });
}

function setCurrentProgressPercent(animate) {
    let progress_ms = new Date().getTime() - songStartEpochMs;
    let progress_percent = (progress_ms / songLengthMs) * 100;
    if (animate) {
        document.getElementById('progressBar').style.transition = "width " + progressAnimationTime + "s linear";
         // Estimate the time to which it should scroll
        progress_percent = (progress_ms + progressAnimationTime * 1000) / songLengthMs * 100;
    } else {
        document.getElementById('progressBar').style.transition = "width 0.1s linear";
    }
    document.getElementById('progressBar').style.width = (progress_percent.toFixed(1) + "%");
}

// Combine returned Artists API object into a single string
function getArtistsString(artists) {
    let toReturn = "";
    let artist_count = artists.length > 3 ? 3 : artists.length; // hardcode to max 3 artists
    for (let i = 0; i < artist_count; i++) {
        toReturn = toReturn + artists[i].name + ", ";
    }
    toReturn = toReturn.slice(0, -2); // remove the last &
    return toReturn;
}

// Refresh the access token for the API
function refreshApiKeys() {
    // noinspection JSUnresolvedFunction
    spotifyApi.refreshAccessToken()
        .then(function (data) {
            spotifyApi.setAccessToken(data.body.access_token);
            tokenExpirationEpoch = (new Date().getTime() / 1000) + data.body.expires_in;
            console.log('Refreshed token. It now expires in ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!');
        }, function (err) {
            console.log('Could not refresh the token!', err.message);
        });
}

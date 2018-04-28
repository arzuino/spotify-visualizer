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


function setProgress(progress) {
    if (progress < 100) {
        document.getElementById('progressBar').style.width = (progress + "%");
    }
}

function setPaused() {
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
let lastSongName = "";
let songStartEpochMs = 0;
let songLengthMs = 0;
let playing = false;
let rateLimitEpoch = 0;

// Set the initial loading screen as soon as doc is loaded
let tid = setInterval(function () {
    if (document.readyState !== 'complete') return;
    clearInterval(tid);
    setLoading("Verbindet mit Spotify...");
}, 10);


const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
});
spotifyApi.setRefreshToken(process.env.REFRESH_TOKEN);

refreshApiKeys();

// Main interval
setInterval(function () {
    // Check if we are reate limited
    if ((rateLimitEpoch - new Date().getTime() / 1000) > 0) {
        setLoading("Warte auf Spotify...");
        console.log("Rate limited, waiting for " + (rateLimitEpoch - new Date().getTime() / 1000) + " seconds");
        return;
    }
    // Refresh access token if needed
    if ((tokenExpirationEpoch - new Date().getTime() / 1000) < 60) {
        refreshApiKeys();
    }
    // Get information about current playing song for signed in user
    updatePlayStateApi();

}, 2000);


// Interval for progress bar updates
setInterval(function () {
    if (playing === true) {
        // Update the progress bar
        setProgress(getCurrentProgressPercent());
    }
}, 1000);

// "Main" function
function updatePlayStateApi() {
    spotifyApi.getMyCurrentPlaybackState({})
        .then(function (data) {
            if (data.statusCode === 429) {
                // Rate limited
                rateLimitEpoch = (new Date().getTime() / 1000) + data.headers["Retry-After"] + 5;
            } else if (data.body["is_playing"] === undefined) {
                setLoading("Wiedergabe ist gestoppt");
                console.log("Playback is stopped");
            } else if (data.body["is_playing"] === false && lastSongName !== "") {
                // If paused and not first run
                playing = false;
                // Set an info if playback is paused
                setPaused();
                console.log("Playback is paused");
            } else {
                // Only update cover and title if song is different
                let title = data.body.item.name;
                if (lastSongName !== title || playing === false) {
                    lastSongName = title;
                    let artists = getArtistsString(data.body.item["artists"]);
                    let coverUrl = data.body.item["album"].images[0].url;
                    console.log("Now Playing: " + title + " - " + artists);
                    setNextSong(title, artists, coverUrl);
                }
                songLengthMs = data.body.item["duration_ms"];
                let newSongStartEpochMs = new Date().getTime() - data.body["progress_ms"];
                if (Math.abs(newSongStartEpochMs - songStartEpochMs) > 200) {
                    // Only reset progress if it drifted by more than 200ms
                    songStartEpochMs = newSongStartEpochMs;
                }
                playing = true;
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
        });
}

function getCurrentProgressPercent() {
    let progress_ms = new Date().getTime() - songStartEpochMs;
    return (progress_ms / songLengthMs) * 100;
}

// Combine returned Artists API object into a single string
function getArtistsString(artists) {
    let toReturn = "";
    for (let i = 0; i < artists.length; i++) {
        toReturn = toReturn + artists[i].name + " & ";
    }
    toReturn = toReturn.slice(0, -3);
    return toReturn;
}

// Refresh the access token for the API
function refreshApiKeys() {
    // noinspection JSUnresolvedFunction
    spotifyApi.refreshAccessToken()
        .then(function (data) {
            spotifyApi.setAccessToken(data.body['access_token']);
            tokenExpirationEpoch = (new Date().getTime() / 1000) + data.body['expires_in'];
            console.log('Refreshed token. It now expires in ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!');
            updatePlayStateApi();
        }, function (err) {
            console.log('Could not refresh the token!', err.message);
        });
}


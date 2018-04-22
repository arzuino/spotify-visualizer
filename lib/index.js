const SpotifyWebApi = require('spotify-web-api-node');
const lyrics = require('./lyrics');
const console = require('console');
require('dotenv').config();


function setNextSong(title, artist, imgUrl) {
    document.getElementById('background').src = imgUrl;
    document.getElementById('cover').src = imgUrl;
    document.getElementById('title').innerHTML = title;
    document.getElementById('artist').innerHTML = artist;
    // Make everything visible and enable the progress bar
    document.getElementById('cover').style.visibility = "visible";
    document.getElementById('track-info').style.visibility = "visible";
    document.getElementById('progressBarParent').style.visibility = "visible";
    document.getElementById('progressBarParent').style.animation = "none";
    document.getElementById('lyrics_wrapper').style.visibility = "hidden";
}

function setLyrics(lyrics) {
    document.getElementById('cover').style.visibility = "hidden";
    document.getElementById('track-info').style.visibility = "hidden";
    document.getElementById('lyrics_wrapper').style.visibility = "visible";
    document.getElementById('lyrics').innerHTML = lyrics;
}


function setProgress(progress) {
    if (progress < 100) {
        document.getElementById('progressBar').style.width = (progress + "%");
    }
}

function setLyricsProgress(progressPercentage) {
    // Offset because the first line of lyrics should be shown in the middle of the screen
    // and the last line as well. This can be visualized as if the lyrics box is a whole visible page height bigger
    const offset = document.getElementById('lyrics_wrapper').clientHeight / 2;
    console.log("offset" + offset);
    const visiblePageHeight = document.getElementById('lyrics').scrollHeight;
    const scrollPos = visiblePageHeight * (progressPercentage / 100) - offset;
    const marginTop = scrollPos * -1 + "px";
    console.log(marginTop);
    document.getElementById('lyrics').style.marginTop = marginTop;
}

function setPaused() {
    document.getElementById('progressBarParent').style.animation = "blinker 3s linear infinite";
}


let tokenExpirationEpoch = 0;
let lastSongName = "";
let songStartEpochMs = 0;
let songLengthMs = 0;
let playing = false;

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
});

spotifyApi.setRefreshToken(process.env.REFRESH_TOKEN);
refreshApiKeys();


setInterval(function () {
    // Refresh access token if needed
    if ((tokenExpirationEpoch - new Date().getTime() / 1000) < 60) {
        refreshApiKeys();
    }
    // Get information about current playing song for signed in user
    spotifyApi.getMyCurrentPlaybackState({})
        .then(function (data) {
            // If paused and not first run
            if (data.body["is_playing"] === false && lastSongName !== "") {
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
                    lyrics.get((title + " " + artists), (err, result) => {
                        if (err) console.log(err);
                        else {
                            console.log("Received lyrics");
                            setLyrics(lyricsToParagraphs(result));
                            setLyricsProgress(getCurrentProgressPercent());
                        }
                    });
                }
                songLengthMs = data.body.item["duration_ms"];
                songStartEpochMs = new Date().getTime() - data.body["progress_ms"];
                setLyricsProgress(getCurrentProgressPercent());
                playing = true;
            }
        }, function (err) {
            console.log('Something went wrong!', err);
        });
}, 2000);

setInterval(function () {
    if (playing === true) {
        // Update the progress bar
        setProgress(getCurrentProgressPercent());
    }
}, 30);


function getCurrentProgressPercent() {
    let progress_ms = new Date().getTime() - songStartEpochMs;
    return (progress_ms / songLengthMs) * 100;
}

function getArtistsString(artists) {
    let toReturn = "";
    for (let i = 0; i < artists.length; i++) {
        toReturn = toReturn + artists[i].name + " & ";
    }
    toReturn = toReturn.slice(0, -3);
    return toReturn;
}

function lyricsToParagraphs(text) {
    console.log(JSON.stringify(text));
    let toReturn = "";
    let lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line === "") {
            toReturn += "</br>";
        } else {
            toReturn += '<p>' + line + '</p>'
        }
    }
    return toReturn;
}

function refreshApiKeys() {
    // noinspection JSUnresolvedFunction
    spotifyApi.refreshAccessToken()
        .then(function (data) {
            spotifyApi.setAccessToken(data.body['access_token']);
            tokenExpirationEpoch = (new Date().getTime() / 1000) + data.body['expires_in'];
            console.log('Refreshed token. It now expires in ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!');
        }, function (err) {
            console.log('Could not refresh the token!', err.message);
        });
}


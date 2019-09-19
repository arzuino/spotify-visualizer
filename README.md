# spotispy

Visualizes the currently playing track with the album cover art from Spotify using their [web API](https://developer.spotify.com/web-api/).

This is a fork of the (unmaintained?) [spotispy](https://github.com/tma02/spotispy) repository. I decided to update it and changed the following to suit my use case better:

-   Use the "new" web API through [spotify-web-api-node](https://www.npmjs.com/package/spotify-web-api-node) instead of scraping Spotify (which might get your account banned)
-   Smooth progress bar at the bottom (possible thanks to the usage of the new API)
-   You now have to generate the oauth refresh token on your own (see below), which makes the code easier to maintain
-   Album name is no longer displayed because it's often included on the cover art anyways

The visuals (CSS) were kept mostly as is because they were looking great, especially the faded background!

## How it looks like

![screenshot](res/demo.png)

## How to install

1.  Clone the repo with `git clone https://github.com/l3d00m/spotispy.git`
2.  Install dependencies with `npm install`
3.  Create a file called `.env` in the project root with the secrets (see below)
4.  Run with `npm start`
5.  Optional: Download the [Montserrat font from here](https://github.com/JulietaUla/Montserrat/raw/master/fonts/webfonts/Montserrat-Regular.woff2), rename it to Montserrat.woff2 and put it in the lib directory.

### .env secrets
    CLIENT_ID=example-client-id
    CLIENT_SECRET=example-client-secret
    REFRESH_TOKEN=example-refresh-token

1. Create a spotify app [here](https://developer.spotify.com/my-applications/) 
2. Replace `example-client-id` with the client id and `example-client-secret` with the client secret.
3. Open this handy tool: https://grant.outofindex.com/spotify for generating the needed refresh token with the following steps
4. Paste your above client id and secret into the  `app` section on the site
5. Under `scope` add `user-read-currently-playing` and `user-read-playback-state`
6. Log in with your spotify account
7. Now replace `example-refresh-token` in the .env file with the generated refresh-token and you're done

Alternatively you can use the Spotify API directly as described [in their api docs](https://beta.developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-code-flow), but this is needlessly complicated.

### Multiple monitors?

You can switch between your displays with `Cmd+Shift+Arrow` or `Ctrl+Shift+Arrow` on Windows (function untested in this fork).

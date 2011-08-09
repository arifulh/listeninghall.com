var YTPlayerView = Backbone.View.extend({

    // Youtube Player API defined states
    STATES: {
        "UNSTARTED" : -1,
        "ENDED"     : 0,
        "PLAYING"   : 1,
        "PAUSED"    : 2,
        "BUFFERING" : 3,
        "CUED"      : 5
    },

    // Subscribe to events from the Youtube player api,
    // as well as events from the Connection object.
    subscribe: function () {
        $.subscribe('youtube/ready', this.setPlayer);
        $.subscribe('youtube/state', this.stateChange);
        $.subscribe('room/joined',   this.embedPlayer);
    },

    // YTPlayerView listens to the Playlist collection for changes,
    // and start/stop the Youtube player accordingly. When a song
    // is set to 'playing', or when the 'elapsedTime' of a song is
    // changed, this view will trigger the YouTube player api. 
    initialize: function () {
        _.bindAll(this, 'setPlayer', 'stateChange', 'embedPlayer', 'play');
        this.collection.bind("change:playing",     this.play);
        this.collection.bind("change:elapsedTime", this.play);
        this.subscribe();
    },

    // BufferDelayTimer is a stop timer used to calculate the amount of time
    // the Youtube player stayed in a 'buffer' state. The inner functions
    // are closures, thus, the outer variable 'startTime' keeps track of the
    // timer's state. If startTime = 0, the timer is off. 
    BufferDelayTimer: function () {
        var startTime = 0;
        return {
            // Set current time as the start time.
            start: function () {
                startTime = new Date().getTime();
            },
            // Return the difference between stop and start times in seconds. 
            // If the timer was off, set stopTime to 0, in which case elapsed will 
            // also return 0. Turn timer of before returning (startTime = 0).
            stop: function () {
                var stopTime = (startTime === 0) ? 0 : new Date().getTime(),
                    elapsed = Math.ceil((stopTime - startTime) / 1000);
                startTime = 0;
                return elapsed;
            }
        };
    },

    // Intercept and handle state changes in the Youtube player
    stateChange: function (state) {
        switch (state) {
            // Start buffering timer to calculate delay
            case this.STATES.BUFFERING:
                this.delayTimer.start();
                break;
            // Stop timer, and adjust playback to account for the delay
            case this.STATES.PLAYING:
                var delay = this.delayTimer.stop();
                this.adjustPlayback(delay);
                break;
            // Clicking the video screen will stop playback. We want to resume playback  
            // manually since the YT api doesn't allow us to disable click events.
            case this.STATES.UNSTARTED:
                this.playerAPI.playVideo();
                break;
        }
    },

    // Check to see if the song is set to 'playing', in which case load
    // the video to the particular time set (elapsedTime). By default the
    // 'elapsedTime' will be 0, unless it was resynced with the server. 
    play: function (song) {
        if (song.get("playing")) {
            var id = song.get("sid"),
                seekTo = song.get("elapsedTime");
            this.playerAPI.loadVideoById(id, seekTo);
        } else { this.playerAPI.pauseVideo(); }
    },

    // Forward playback based on the amount of delay(seconds) because of buffering. 
    // Every time the Youtube player enters a buffering state, it becomes out of sync
    // with the server's timer. We need to account for this delay to bring the 
    // player back into sync. This function will determine if the delay was significant,
    // and then adjust playback as necessary to acount for the delay.
    adjustPlayback: function (delay) {
        var maxDelayAllowed = 10,
            correction = 4,
            currentTime = this.playerAPI.getCurrentTime();
        // If the delay was signifcant, adjust playback position.
        if (delay > maxDelayAllowed) {
            this.playerAPI.seekTo(currentTime + delay + correction, true);
        }
    },

    // Create a reference to the Youtube player api, and attach
    // event listeners/utilities. This function is only called once the 
    // player has been succesfully embedded.
    setPlayer: function () {
        this.playerAPI = $("#myytplayer")[0];
        this.playerAPI.addEventListener("onStateChange", "onYoutubeStateChange");
        this.playerAPI.addEventListener("onError", "onYoutubeError");
        this.createUtilities();
    },

    // Create a BufferDelayTimer to time the amount of time the player 
    // stayed in a 'buffering' state, and create a volume slider control.
    createUtilities: function () {
        var playerAPI   = this.playerAPI;
        this.delayTimer = this.BufferDelayTimer();
        $("#volumeSlider").slider({
            value       : 30, // Initial volume
            step        : 10,
            orientation : "horizontal",
            range       : "min",
            animate     : true,
            slidestart  : function (event, ui) { playerAPI.setVolume(ui.value); },
            change      : function (event, ui) { playerAPI.setVolume(ui.value); }
        });
    },

    // Standard chrome-less Youtube player embed. This function is called
    // to embed the Youtube player onto the page as soon as the user 
    // successfully joins the room.
    embedPlayer: function () {
        var swfUrlParams = [
                "http://www.youtube.com/apiplayer?", // baseUrl
                "version=3",                         // version
                "&enablejsapi=1",                    // Enable jsonp
                "&playerapiid=ytplayer"],            // api id
            params = {
                allowScriptAccess : "always",
                bgcolor           : "#000000",
                wmode             : "transparent"
            },
            atts = { id: "myytplayer" };
        swfobject.embedSWF(swfUrlParams.join(""), "ytapiplayer", "444", "250", "9", null, null, params, atts);
    }
});

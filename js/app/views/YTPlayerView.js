var YTPlayerView = Backbone.View.extend({

	states : {
		"UNSTARTED" : -1,
		"ENDED"		:  0,
		"PLAYING"	:  1,
		"PAUSED"	:  2,
		"BUFFERING" :  3,
		"CUED"      :  5
	},

	subscribe : function() {
		$.subscribe('youtube/ready', this.setPlayer);
		$.subscribe('youtube/state', this.stateChange);
		$.subscribe('room/joined',   this.embedPlayer);
	},
	
	initialize : function() {
		_.bindAll(this, 'setPlayer', 'play', 'stateChange', 'embedPlayer');
		this.collection.bind("change:playing", this.play);
		this.collection.bind("change:elapsedTime", this.play);
		this.buffering = false;
		this.bufferStart = 0;
		this.subscribe();
	},
	
	setPlayer : function() { 
		this.player = $("#myytplayer")[0];
		this.player.addEventListener("onStateChange", "onYoutubeStateChange");
		this.player.addEventListener("onError", "onYoutubeError");
		// debug volume - remove
		this.player.setVolume(7);
	},
	
	play : function(song) {
		if (song.get("playing")) {
			var id = song.get("sid");
			var seekTo = song.get("elapsedTime");
			this.player.loadVideoById(id, seekTo);
		} else {
			this.player.stopVideo();
		}
	},
	
	// This function is not very clear, the names are a little awkward,
	// and it seems like you only care about two states. Is that safe?
	stateChange : function(state) {
		if (state === this.states.BUFFERING) {
			this.buffering   = true;
			this.bufferStart = new Date().getTime();
		} else if (state === this.states.PLAYING && this.buffering) {
			this.buffering   = false;
			var timeNow      = new Date().getTime();
			var delay        = Math.ceil((timeNow - this.bufferStart)/1000);
			if (delay > 10 ) {
				var currentTime = this.player.getCurrentTime() + 5;
				this.player.seekTo(currentTime + delay, true);
			}
			this.bufferStart = 0;
		}
	},
	
	embedPlayer : function() {
		var swfUrl = "http://www.youtube.com/apiplayer?version=3&amp;enablejsapi=1&amp;playerapiid=ytplayer";	  
		var params = { allowScriptAccess: "always", bgcolor: "#000000", wmode: "transparent" };
		var atts = { id: "myytplayer" };	
		swfobject.embedSWF(swfUrl, "ytapiplayer", "444", "250", "9", null, null, params, atts);	
	}
	
});
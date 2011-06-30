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
		$.subscribe('youtube/state', this.onStateChange);
	},
	
	initialize : function() {
		_.bindAll(this, 'setPlayer', 'play', 'onStateChange');
		this.collection.bind("change:playing", this.play);
		this.collection.bind("change:elapsedTime", this.play);
		this.buffering = false;
		this.subscribe();
	},
	
	setPlayer : function() { 
		this.player = $("#myytplayer")[0];
		this.player.addEventListener("onStateChange", "onYoutubeStateChange");
		this.player.addEventListener("onError", "onYoutubeError");
	},
	
	play : function(song) {
		var id = song.get("sid");
		var seekTo = song.get("elapsedTime");
		this.player.loadVideoById(id, seekTo);
	},
	
	// This function is not very clear, the names are a little awkward,
	// and it seems like you only care about two states. Is that safe?
	onStateChange : function(state) {
		if (state === this.states.BUFFERING) {
			this.buffering = true;
			return;
		} else if (state === this.states.PLAYING && this.buffering) {
			$.publish('song/request_sync');
		}
	},
	
	onError : function(code) {
		// todo
	}
	
});
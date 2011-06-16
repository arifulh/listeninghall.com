var Song = Backbone.Model.extend({ 
	initialize : function() {
		this.playing = false;
		this.started = false;
		this.elapsedTime = 0;
	},

	// Set "started" to "true" the first time this song is played.
	// This let's the Playlist collection avoid removing songs
	// that have never even started playing.
	togglePlay : function() {
		if (this.started !== true) this.set({"started" : true});
		this.set({"playing" : !this.playing});
		return this;
	}
});
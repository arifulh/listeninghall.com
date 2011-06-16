var Playlist = Backbone.Collection.extend({
	model : Song,
	
	// Subscribe to events published by the Connection object.
	subscribe : function() {
		$.subscribe('song/queue',    this.addSong);
		$.subscribe('song/play',     this.loadSong);
		$.subscribe('song/sync',     this.syncSong);
		$.subscribe('song/playlist', this.loadPlaylist);
	},
	
	// Use Underscore.js 'bindAll' to bind methods in this 
	// object to run within context of this object.  
	initialize : function() {
		_.bindAll(this, 'addSong',
						'syncSong',
						'loadSong', 
						'loadPlaylist', 
						'resync');
		this.subscribe();
	},
	
	addSong : function(id, len) { this.add({ "id" : id, "len" : len }) },
	
	// Sync current song time with the time sent from the server. If there are 
	// no songs in the playlist, ignore signal from server, and if the current 
	// song ID does not match the ID sent by the server, resync playlist.
	syncSong : function(id, elapsed) {
		if (this.length === 0) return;
		var current = this.first();
		if (current.get("id") !== id) { this.resync(); return };
		current.set({ "elapsedTime": elapsed });
		if (!current.get("playling")) current.togglePlay();
	},
	
	// Load the first song int he playlist for playback. If there are no 
	// songs in the playlist, ignore signal from server, and if the current 
	// song ID does not match the ID sent by the server, resync playlist.
	loadSong : function(id) {
		if (this.length === 0) return; 
		var current = this.first(); 
		
		// If the current song has never been started, begin play.
		// Otherwise, remove the current song, and begin play of next song.
		if (!current.get("started")) {
			if (current.get("id") !== id) { this.resync(); return };
			current.togglePlay();
		} else {
			this.remove(current);
			var next = this.first();
			if (next.get("id") !== id) { this.resync(); return };
			next.togglePlay();
		}		
		
	},
	
	// Upon initial connection, the server will send the current
	// list of songs that need to be added to the playlist.
	loadPlaylist : function(songs) {
		var len = songs.length;
		for (var i=0; i<len; i++) {
			this.add({ "id" : songs[i].id, "len" : songs[i].len });
		}
	},
	
	// If the playlist is out of sync with the server,
	// remove all songs, and publish resync event.
	resync : function () {
		this.refresh();
		$.publish("song/resync");	
	},	
	
});
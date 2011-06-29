var PlaylistView = Backbone.View.extend({
	el : $("#playlist"),
	
	// Use Underscore.js 'bindAll' to bind methods in this object
	// to run within context of this object. This view will listen
	// to the Playlist collection when songs are added/removed. 
	initialize: function() {
		_.bindAll(this, "renderSong", "removeRender", "removeAll");
		this.collection.bind('add',     this.renderSong);
		this.collection.bind('remove',  this.removeRender);
		this.collection.bind('refresh', this.removeAll);
		this.songViews = [];
	},
	
	// Create a view for the song, and keep track of the view by
	// storing it in songViews array. This makes it easy to just
	// pop it off the array, and destroy it.
	renderSong : function(song) {
		var view = new SongView({ model : song });
		this.songViews.push(view);
		this.$("#plsongs ul").append(view.render().el);
	},
	
	// Remove song view from DOM, and remove reference to view in songViews array
	removeRender : function(song) {
		this.songViews[0].remove();
		this.songViews.shift();
	},
	
	// Clear view of all songs
	removeAll : function() {
		var songs = this.songViews;
		var len   = songs.length;
		for (var i=0; i<len; i++) songs[i].remove();
	}
});
var SongView = Backbone.View.extend({
	tagName : "li",
	
	// Each song model has a corresponding view. Song views
	// are treated as subviews within PlaylistView.
	initialize : function() {
		_.bindAll(this, 'modify');
		this.model.bind("change:playing", this.modify);
		this.template = _.template($("#song-template").html());
	},

	// Each song view listens to it's corresponding Song model
	// to see if it is currently playing. If so, adjust the css.
	modify : function(song) {
		$(this.$("div.song")).addClass("playing");
		return song;
	},
    
    // Render template, and attach tooltip
	render : function() {
		$(this.el).html(this.template(this.model.toJSON()));	
        this.$('.pltitle').miniTip({anchor: 's',event: 'hover'});
		return this;
	}

});

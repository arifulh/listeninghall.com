var SongView = Backbone.View.extend({
	tagName : "li",
	
	initialize : function() {
		this.template = _.template($("#song-template").html());
	},
		
	render : function() {
		$(this.el).html(this.template(this.model.toJSON()));	
		return this;
	}
});
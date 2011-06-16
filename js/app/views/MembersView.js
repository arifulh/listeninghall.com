var MembersView = Backbone.View.extend({
	el : $("#members"),
		
	/* MembersView listens for changes in the MemberCollection.
	The reference to the collection is passed when MembersView is initialized. */
	initialize : function() {
		_.bindAll(this, 'render');
		this.template = _.template($("#memberul-template").html());
		this.collection.bind('add', this.render);
		this.collection.bind('remove', this.render);
	},	
	
	// Re-renders the entire collection based on any change (add or remove)
	render : function(model, collection) {
		$("#members").html(this.template({ items: collection.models }));
	}
});

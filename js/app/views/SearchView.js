var SearchView = Backbone.View.extend({
	el: $("#search"),
	
	events : {
		"keypress #searchText" : "search"
	},
	
	initialize : function() {
		_.bindAll(this, 'search');
		this.display        = $("#searchResults");
		this.input          = $("#searchText");
		this.searchTemplate = _.template($("#search-template").html());
		this.display.jScrollPane();
		
	},
	
	search : function(e) {
		if (e.which !== 13) return;
		var query = this.input.val();
		var url = "http://gdata.youtube.com/feeds/api/videos?v=2&format=5&q=" 
				  + query + "&alt=json-in-script&callback=?";
		
		
		var display = this.display;
		var searchTemplate = this.searchTemplate;
		
		$("#searchResults ul").fadeOut("fast");
		
		
		$.getJSON(url, function(data) {				
			display.jScrollPane().data('jsp').getContentPane().html(
				searchTemplate({ "results" : data.feed.entry })
			);
			display.data('jsp').reinitialise(function() {
				$("#searchResults ul").fadeIn("fast");
			});			
		});		
	}
});

var SearchView = Backbone.View.extend({
    el: $("#search"),

    events: {
        "keypress #searchText"  : "search",
        "click #searchButton"   : "search",
        "click li .addPlaylist" : "add"
    },

    // Gdata api request url will be built from these parameters. 
    gdataParams: [
        "http://gdata.youtube.com/feeds/api/videos?", 
        "&v=2", 
        "&format=5", 
        "&alt=json-in-script", 
        "&callback=?"
    ],

    // Store references to most used DOM elements.   
    // Attach jScrollPane plugin to the search  
    // display for custom scrollbars.
    initialize: function () {
        this.input    = $("#searchText");
        this.display  = $("#searchResults").jScrollPane().data('jsp');
        this.template = _.template($("#search-template").html());
    },

    // Bind the request callback to the SearchView object to simplify
    // the code. Since we are using custom scrollbars, we will need
    // to reinitialize the display it so it can adjust to the new content.
    search: function (e) {
        if (e.which !== 13 && e.which !== 1) return;
        var query = this.buildQuery();
        $.getJSON(query, _.bind(function (data) {
            var results = this.template({"results": data.feed.entry});
            this.display.getContentPane().html(results);
            this.display.reinitialise();
        }, this));
    },

    // When an item is selected from the search list, we want 
    // to fade it out from the list, indicating it has been 
    // added. Publish an event so that the Connection object 
    // can send a song-queue request to the server.
    add: function (e) {
        var sid = e.currentTarget.id;
        $("li#" + sid).fadeOut();
        this.display.reinitialise();
        $.publish("song/send", [sid]);
    },

    // Build/return a gdata api request string from the
    // parameters object, with our query text appened.
    buildQuery: function () {
        var query = this.input.val();
        return this.gdataParams.join("").concat("&q=", query);
    }
});

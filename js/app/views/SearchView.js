var SearchView = Backbone.View.extend({
    el: $("#search"),
    
    // Events that happen within the view
    events: {
        "keypress #searchText"  : "search",
        "click #searchButton"   : "search",
        "click li .addPlaylist" : "add",
        "click li .searchImage" : "add"
    },

    // Gdata api request url will be built from these parameters. 
    gdataParams: [
        "http://gdata.youtube.com/feeds/api/videos?", // baseUrl
        "&v=2",                                       // version
        "&format=5",                                  // format
        "&alt=json-in-script",                        // enable jsonp
        "&callback=?"                                 // callback
    ],

    // Store references to most used DOM elements. Attach jScrollPane
    // plugin to the search display for custom scrollbars.
    initialize: function () {
        _.bindAll(this, "render");
        this.$toggle   = $("#playlistAdd");
        this.$input    = $("#searchText");
        this.$display  = $("#searchResults").jScrollPane().data('jsp');        
        this.template  = _.template($("#search-template").html());
        this.$toggle.bind("click", this.render);
    },

    // Bind the request callback to the SearchView object to simplify
    // the code. Since we are using custom scrollbars, we will need
    // to reinitialize the display it so it can adjust to the new content.
    search: function (e) {
        if (e.which !== 13 && e.which !== 1) return;
        var query = this.buildQuery();
        $.getJSON(query, _.bind(function (data) {
            var results = this.template({"results": data.feed.entry});
            this.$display.getContentPane().html(results);
            this.$display.reinitialise();
        }, this));
    },

    // When an item is selected from the search list, we want 
    // to fade it out from the list, indicating it has been 
    // added. Publish an event so that the Connection object 
    // can send a song-queue request to the server.
    add: function (e) {
        var sid = e.currentTarget.id;
        $("li#" + sid).fadeOut("fast");
        this.$display.reinitialise();
        $.publish("song/send", [sid]);
    },

    // Build/return a gdata api request string from the
    // parameters object, with our query text appened.
    buildQuery: function () {
        var query = this.$input.val();
        return this.gdataParams.join("").concat("&q=", query);
    },

    // This view is already within the DOM when initialized. 
    // The render function will simply toggle hide/show animation.
    render: function () {
        var speed = 210;
        $(this.el).animate({
            width   : 'toggle',
            opacity : 'toggle'
        }, speed);
    }
});

var Song = Backbone.Model.extend({
    initialize: function () {
        this.set({"started": false}, {silent: true});
        this.set({"playing": false}, {silent: true});
        this.set({"elapsedTime": 0}, {silent: true});
    },

    // Set "started" to "true" the first time this song is played.
    // This let's the Playlist collection avoid removing songs
    // that have never even started playing.
    togglePlay: function () {
        if (this.get("started") !== true) this.set({"started": true});
        this.set({"playing": !this.get("playing")});
        return this;
    }
});
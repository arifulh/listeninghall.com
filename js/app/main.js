$(function () {
    var mainapp = {
        init: function () {
            
            var test = new Function;
            
            // Collections
            this.members      = new MemberList;
            this.playlist     = new Playlist;

            // Views
            this.playlistView = new PlaylistView({collection: this.playlist});
            this.playerView   = new YTPlayerView({collection: this.playlist});
            this.toolbarView  = new ToolbarView({collection: this.members});
            this.searchView   = new SearchView;
            this.chatView     = new ChatView;
            this.loginView    = new LoginView;

            // Connecton
            Connection.initialize();
        }
    };
    mainapp.init();
});

// Global youtube-api callback.
function onYouTubePlayerReady(playerid) {
    $.publish('youtube/ready', [playerid]);
}

// Global youtube-api callback.
function onYoutubeStateChange(state) {
    $.publish('youtube/state', [state]);
}
var main;

$(function() {
	var mainapp = {
		init : function() {
			
		
			/* Collection */
			this.members 		= new MemberList;
			this.playlist 		= new Playlist;	
			//	this.searches		= new ResultList;
			
			/* Views */
			this.playlistView 	= new PlaylistView	({ collection: this.playlist });
			this.playerView		= new YTPlayerView	({ collection: this.playlist });
			//	this.searchView 	= new SearchView	({ collection: this.searches });
			this.membersView 	= new MembersView	({ collection: this.members });
			this.chatView 		= new ChatView;	
			this.loginView 		= new LoginView;	
		}
	};
	mainapp.init();

	// Initialize YouTube Player
/*    var swfUrl = "http://www.youtube.com/apiplayer?version=3&amp;enablejsapi=1&amp;playerapiid=ytplayer";	  
    var params = { allowScriptAccess: "always", bgcolor: "#cccccc" };
    var atts = { id: "myytplayer" };	
    swfobject.embedSWF(swfUrl, "ytapiplayer", "444", "250", "9", null, null, params, atts);
*/	
	// Intialize jquery plugins for scrolling and tooltips
	$("#plsongs").remoteScroll({ up: "#playlistUp", down: "#playlistDown"}); 
	$(".pltitle").tooltips();	
	
});

function onYouTubePlayerReady(playerid) {
	$.publish('youtube/ready', [ playerid ]);	
}

function onYoutubeStateChange(state) {
	$.publish('youtube/state', [ state ]);
}

var main;

$(function() {

	var mainapp = {
		init : function() {
			// Collections
			this.members 	  = new MemberList;
			this.playlist 	  = new Playlist;	
			
			// Views
			this.playlistView = new PlaylistView ({ collection: this.playlist });
			this.playerView	  = new YTPlayerView ({ collection: this.playlist });
			this.toolbarView  = new ToolbarView  ({ collection: this.members  });
			this.searchView   = new SearchView;
			this.chatView 	  = new ChatView;	
			this.loginView 	  = new LoginView;
			
			// Connecton
			Connection.initialize();
			
		}
	};
	mainapp.init();

	main = mainapp;

	// Intialize jquery plugins for scrolling and tooltips
	$("#loginProgress").slider({
			orientation: "horizontal",
			range: "min",
			animate: true,
			disabled: true
	});
	$("#plsongs").remoteScroll({ 
        up: "#playlistUp", 
        down: "#playlistDown"
    }); 

	// Animations
	$("#playlistAdd").click(function() { 
		$("#search").animate({width: 'toggle', opacity: 'toggle'}, 350);		
	});
	
	$(".button3").hover(function() {
		$(this).animate({ backgroundColor: "#000" }, "fast");
	}, function() {
		$(this).animate({ backgroundColor: "#dbdbdb" }, "fast");
	});
	
	$("#share").hover(function() {
		$(this).text("Share link: " + window.location.href);
	}, function() { $(this).text("Invite others")});

});




function onYouTubePlayerReady(playerid) {
	$.publish('youtube/ready', [ playerid ]);	
}

function onYoutubeStateChange(state) {
	$.publish('youtube/state', [ state ]);
}


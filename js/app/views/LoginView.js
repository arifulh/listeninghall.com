var LoginView = Backbone.View.extend({
	el : $("#loading"),
	
	events : {

	},
	
	subscribe: function() {
		$.subscribe('room/joined', this.success);
	},
	
	initialize : function() {
		_.bindAll(this, 'subscribe', 'getRoom', 'joinExisting', 'createNew', 'success');
		this.$login 	= $("#login");
		this.$status 	= $("#status");
		this.$nick 		= $("#loginNick");
		this.$room 		= $("#loginRoom");
		this.subscribe();
		this.getRoom();
	},
	
	getRoom : function() {
		var room = (window.location.hash).split("/")[1];
		
	},
	
	// This function needs XSS examniation
	createNew : function() {
		var nick = this.$nick.val();
		var	room = this.$room.val();
		Connection.init(nick, room);		
	},
	
	// This function needs XSS examniation
	joinExisting : function(room) {
		var nick = this.$nick.val();
	},

	// This function needs XSS examniation
	success : function(room) {
		window.location.hash = "/" + room;
		$(this.el).fadeOut("slow");
	},
	
	error : function() {
		// display error in status box
	}
});
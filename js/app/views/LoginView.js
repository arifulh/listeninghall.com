var LoginView = Backbone.View.extend({
	el : $("#loading"),
	
	events : {
		"click #loginJoin" : "join"
	},
	
	subscribe: function() {
		$.subscribe('room/joined', this.success);
	},
	
	initialize : function() {
		_.bindAll(this, 'subscribe','join','success');
		this.$login 	= $("#login");
		this.$status 	= $("#status");
		this.$nick 		= $("#loginNick");
		this.$room 		= $("#loginRoom");
		this.subscribe();
	},
	
	// This function needs XSS examniation
	join : function() {
		var nick = this.$nick.val();
		var	room = this.$room.val();
		Connection.init(nick, room);
	},

	success : function() {
		$(this.el).fadeOut("slow");
	},
	
	error : function() {
		// display error in status box
	}
});
var LoginView = Backbone.View.extend({

	el : $("#loading"),
	
	events : {
		"click #createButton, #joinButton" : "login"
	},
	
	subscribe: function() {
		$.subscribe('room/joined',         this.success);
		$.subscribe("room/exists",         this.roomConflict);
		$.subscribe("room/nickTaken",      this.nickConflict);
		$.subscribe('connection/progress', this.handleProgress);
	},
	
	// Store references to the DOM elements that we will need access frequently
	// for user input and animation. Also call 'checkUrlHash" once this view
	// is initialized to handle room parameters right away.
	initialize : function() {
		_.bindAll(this, 'subscribe', 'checkUrlHash', 'handleProgress',
						'login', 'success');
		this.$nickInput    = $("#loginNick");
		this.$roomInput    = $("#loginRoom");
		this.$createButton = $("#createButton").hide();
		this.$joinButton   = $("#joinButton").hide();
		this.$progress     = $("#connectProgress");
		this.checkUrlHash();
		this.subscribe();
	},
	
	// Todo
	login : function(e) {
		var room = this.$roomInput.val();
		var nick = this.$nickInput.val();
		var create = (e.currentTarget.id === "createButton") ? true : false;
		$.publish('connection/login', [ room, nick, create ]);
	},	

	// This function needs XSS examniation
	success : function(room, nick) {
		window.location.hash = "/" + room;
		$(this.el).fadeOut("slow", function() {
			$("#top").fadeIn("slow");
		});
	},	
	
	// Check to see if the app has a room hash parameter. If it does, 
	// set the room input field value, and display "create" or "join" button.
	checkUrlHash : function() {
		var roomParameter = (window.location.hash).split("/")[1] || "";
		if (roomParameter !== "") {
			this.$roomInput.val(roomParameter)
				.addClass("set1")
				.keypress(function(){ return false });
			this.$joinButton.show();
		} else { this.$createButton.show() }
	},
	
	// Update connection progress bar based on status updates. Once connected 
	// (status === 5), hide progress bar and display login dialog.
	handleProgress : function(status) {	
		var percentage = {1: 30, 3: 75, 5: 100};
		this.$progress.slider("value", percentage[status], true);
		if (status === 5) {
			this.$progress.fadeOut(function() {
				$("#login").switchClass("valign1","valign2","fast");
				$("#loginDialog").fadeIn();
			});
		}
	},
	
	// Alert user of room name conflict
	roomConflict : function() { $("#room_conflict").effect("pulsate", { times:3 }) },
	
	// Alert user of nick name conflict
	nickConflict : function() { $("#nick_conflict").effect("pulsate", { times:3 }) }
});
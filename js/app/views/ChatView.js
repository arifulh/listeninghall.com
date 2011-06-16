var ChatView = Backbone.View.extend({
	el : $("#chat"),
	
	events : {
		"keypress #chatInput" 	: "createMessage"
	},
		
	subscribe : function() {
		$.subscribe("room/joined", this.setNick);
		$.subscribe("message/recieved", this.renderMessage);		
	},
	
	initialize : function() {
		_.bindAll(this, 'subscribe', 'renderMessage', 'setNick');
		this.display 		 = $("#chatDisplay");
		this.input 			 = $("#chatInput");
		this.messageTemplate = _.template($("#message-template").html());
		this.subscribe();
	},
		
	// Needs XSS examination
	setNick : function(nick) { this.nick = nick },
		
	// Needs XSS examination
	createMessage : function(e) {
		if (e.which !== 13) return;
		var message = { nick: this.nick, text: this.input.val() };
		$.publish("message/send", [ message ]);
		this.renderMessage(message.nick, message.text);
		this.input.val('');
	},
		
	// Needs XSS examniation
	renderMessage : function (nick, message) {
		this.display.append(this.messageTemplate({ 
			"nick" : nick, "message" : message }));		
		this.display.attr({ 
			scrollTop: this.display.attr("scrollHeight") });
	}
});
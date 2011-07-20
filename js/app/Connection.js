var Connection = {
	
	// Default server information
	CONFIG : {
		BOSH	 : "http://localhost:5280/http-bind",
		HOST	 : "localhost",
		MUC_HOST : "@conference.localhost"
	},
	
	// Subscribe to events published by the app.
	_subscribe : function() {
		$.subscribe('connection/login',	this.login);
		$.subscribe('message/send',	this.sendMessage);
		$.subscribe('playlist/resync',	this.requestPlaylist);
		$.subscribe('song/send',	this.sendSong);
		$.subscribe('song/resync',	this.requestSync);
	},

	// Use Underscore.js 'bindAll' function to bind certain
	// methods in this object to run within context of this object
	// (need this for all the event handlers, where 'this' becomes
	// handled within the context of the callback). Set nick/room,
	// and initialize the connection/subscription.	
	initialize : function() {
		_.bindAll(this, 'sendMessage',
				'sendSong', 
				'requestPlaylist', 
				'requestSync',
				'sendSkip', 
				'onPlaylist', 
				'login', 
				'createRoom', 
				'joinExistingRoom',
				'setPassword', 
				'_subscribe', 
				'_onMessage', 
				'_onPresence');
		this._connection = new Strophe.Connection(this.CONFIG.BOSH);
		this._connection.connect(this.CONFIG.HOST, null, function(status) {
			$.publish("connection/progress", [ status ]);
		});
		this._subscribe();
	},
	
	login : function(room, nick, create) {
		var Connection = this;
		this.nick = nick;
		this.room = room + this.CONFIG.MUC_HOST;	
		var request = $iq({ to: this.room, type: "get"})
				.c('query', { xmlns: "http://jabber.org/protocol/disco#items" });					
		this._connection.sendIQ(request, function(stanza) {
			Connection[create ? "createRoom" : "joinExistingRoom"]($(stanza));
		});							
	},
	
	// Handle new room creation
	createRoom : function($stanza) {
		var $room = $stanza.find('item');
		if ($room.length === 0) {
			this._connection.send(this._initialPresence());	
			this._connection.addHandler(this._onPresence, null, "presence");
			this._connection.addHandler(this._onMessage,  null, "message", "groupchat");		
			this.requestPlaylist();
		} else { $.publish("room/exists") }	
	},
	
	joinExistingRoom : function($stanza) {
		var $members = $stanza.find('item');
		var nick = this.nick;
		var nameTaken = _.any($members, function(m) { return $(m).attr("name") === nick });
		if (!nameTaken) {
			this._connection.send(this._initialPresence());	
			this._connection.addHandler(this._onPresence, null, "presence");
			this._connection.addHandler(this._onMessage,  null, "message", "groupchat");		
			this.requestPlaylist();			
		} else { $.publish("room/nickTaken") }				
	},
	
	// Helper function that parses attributes from all presence stanzas
	_parsePresence : function(stanza) {
		var $stanza = $(stanza);
		var from = $stanza.attr('from');		
		return {
			room : Strophe.getBareJidFromJid(from),
			nick : Strophe.getResourceFromJid(from),
			type : $stanza.attr('type'),
			code : $stanza.find('status').attr('code'),
			error : $stanza.find('error').attr('code')
		};
	},
	
	// Helper function that parses attributes from all message stanzas.
	// **TODO: Message text may contain XSS code
	_parseMessage : function(stanza) {
		var $stanza = $(stanza);
		var from = $stanza.attr('from');		
		return {
			room  : Strophe.getBareJidFromJid(from),
			nick  : Strophe.getResourceFromJid(from),
			text  : $stanza.text(),
			$song : $stanza.find('song')
		};	
	},
	
	// Helper function that parses attributes from all song stanzas.
	// This information is generated from the server, so it will
	// not contain any kind of XSS code.
	_parseSong : function($song) {
		return {
			sid   : $song.find('sid').text(),
			uuid  : $song.find('uuid').text(),
			slen  : $song.find('slen').text(),
			thumb : $song.find('thumb').text(),
			title : $song.find('title').text()
		}
	},
	
	// Document this
	requestPlaylist : function() {
		var request = $iq({
			to: this.room,
			type: "get"
		}).c('playlist', { xmlns: "http://www.listeninghall.com/ns/playlist" });
		this._connection.sendIQ(request, this.onPlaylist);
	},
	
	// Clean up, and document
	onPlaylist : function(stanza) {
		var $stanza    = $(stanza);
		var $playlist  = $stanza.find('playlist');
		var Connection = this;
		var songs = [];
		$playlist.find('song').each(function(i, song) {		
			songs.push(Connection._parseSong($(song)));
		});
		if (songs.length > 0) {
			$.publish("song/playlist", [ songs ]);
			this.requestSync();
		}	
	},
	
	// Clean up an document
	requestSync : function() {		
		var request = $iq({
			to: this.room,
			type: "get"
		}).c('sync', { xmlns: "http://www.listeninghall.com/ns/sync" });
		this._connection.sendIQ(request, function(stanza) {
			var $sync = $(stanza).find('sync');	
			var sync = {
				sid     : $sync.find('sid').text(),
				uuid    : $sync.find('uuid').text(),
				elapsed : parseInt($sync.find('elapsed').text())
			}
			if (sync.elapsed !== -1) $.publish("song/sync", [ sync ]);
		});
	},
	
	// document
	sendSkip : function() {
		var skip = $iq({
			to : this.room,
			type : "set"
		}).c('skip', { xmlns: "http://www.listeninghall.com/ns/skip" });
		this._connection.sendIQ(skip, function(stanza) {
			// todo
		});
	},
	
	// *TODO: I think this function might be ready
	_onPresence : function(stanza) {
		var pres = this._parsePresence(stanza);	
		if (pres.room !== this.room) return true;
		if (pres.code === "110") $.publish("room/joined", [ this.room.replace(this.CONFIG.MUC_HOST,"") , this.nick ]);
		switch(pres.type) {
			case "error"	   : $.publish('room/error',        [ pres.error ]); break;
			case "unavailable" : $.publish('room/user/left',    [ pres.nick ]);  break;
			default		   : $.publish('room/user/entered', [ pres.nick ]);
		}
		return true;	
	},
	
	// If the message contains a song, allow onSong to handle the song data.
	// If the message is from this user, do not publish, since
	// it has already been rendered to enhance App responsiveness	
	_onMessage : function(stanza) {	
		var msg = this._parseMessage(stanza);
		if (msg.room !== this.room) return true;	
		if (msg.$song.length > 0) { 
			this._onSong(msg.$song); 
			return true; 
		}
		if (msg.nick === this.nick) return true;	
		$.publish('message/recieved', [ msg.nick, msg.text ]);
		return true;
	},
	
	// Needs work, needs comments
	_onSong : function($song) {
		var song = this._parseSong($song);
		var type = $song.attr('type');
		if (type === 'queue') $.publish('song/queue', [ song ]);
		if (type === 'play')  $.publish('song/play',  [ song ]);
		if (type === 'stop')  $.publish('song/stop');
	},
		
	// Template for messages that contain only groupchat text 
	sendMessage : function(msg) {
		var newMsg = $msg({
			to: this.room,
			type: "groupchat"
	  	}).c('body').t(msg.text);
		this._connection.send(newMsg);
	},
	
	// Template for messages containing song information.
	// *Note: All messages are sent as type "groupchat", and the
	// song element is sent as a payload inside the message.
	sendSong : function(sid) {
		var song = $msg({
			to: this.room,
			type: "groupchat"
		}).c('song', { 
				xmlns : "http://listeninghall.com/ns/song_queue", 
				type  : "queue"}).c('sid').t(sid);
		this._connection.send(song);		  
	},
	
	// If the user is the creator of the room, they can password-protect it.
	// MUC service requires us to fill out a room configuration form to apply
	// a password. We must first request the configuration form, fill out the form
	// (in this case, add our password), and send the form back (in its entirety).
	setPassword : function(password) {
		var Connection  = this;
		var requestForm = $iq({to : this.room, type : "get"})
							.c('query', { xmlns: "http://jabber.org/protocol/muc#owner" });

		this._connection.sendIQ(requestForm, function(configureForm) {
			// Once we have the configuration form, the only thing 
			// we will be changing is the "Password" field.
			var $configureForm = $(configureForm);
			$configureForm.find('field[label="Password"]').find('value').text(password);
			var $fields = $configureForm.find('field');
		
			// Rebuild our response stanza with all fields. Send new 
			// configuration to room, do nothing with the server response.
			var set = $iq({to : Connection.room, type : "set"})
						.c("query", { xmlns: "http://jabber.org/protocol/muc#owner" })
						.c("x", {xmlns: "jabber:x:data", type: 'submit'});
			$fields.each(function(i, field){ set.cnode(field).up() });
			Connection._connection.sendIQ(set, function(stanza) { return });
		});
	},

	// Template for initial presence. 
	_initialPresence : function() {
		return $pres({ to: this.room + "/" + this.nick })
			.c("x", { xmlns: Strophe.NS.MUC });		
	},
	
};


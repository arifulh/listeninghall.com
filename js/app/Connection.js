var Connection = {
	
	// Default server information
	CONFIG : {
		BOSH	 : "http://localhost:5280/http-bind",
		HOST	 : "localhost",
		MUC_HOST : "@conference.localhost"
	},
	
	// Subscribe to events published by the app.
	_subscribe : function() {
		$.subscribe('message/send',    this.sendMessage);
		$.subscribe('playlist/resync', this.requestPlaylist);
		$.subscribe('song/resync', 	   this.requestSync);
	},
	
	// Use Underscore.js 'bindAll' function to bind certain
	// methods in this object to run within context of this object
	// (need this for all the event handlers, where 'this' becomes
	// handled within the context of the callback). Set nick/room,
	// and initialize the connection/subscription.
	init : function(nick, room) {
		_.bindAll(this, 'sendMessage',
						'sendSong',
						'requestPlaylist',
						'requestSync',
						'onPlaylist',
						'_subscribe',
						'_onMessage', 
						'_onPresence',
						'_connectCallback');
		this.nick 	 	 = nick;
		this.room 	 	 = room + this.CONFIG.MUC_HOST;	
		this._connection = new Strophe.Connection(this.CONFIG.BOSH);
		this._connection.connect(this.CONFIG.HOST, null, this._connectCallback);	
		this._subscribe();
	},
	
	
	// Needs comments
	_connectCallback : function (status) {			
		switch(status) {
			case Strophe.Status.CONNECTED	 : this._connected();    break;
			case Strophe.Status.DISCONNECTED : this._disconnected(); break;
			case Strophe.Status.ERROR	     : this._connError();    break;
			case Strophe.Status.CONNFAIL	 : this._connFail();     break;
			case Strophe.Status.AUTHFAIL	 : this._authFail();
		}
	},
	
	// Once connected, add event handlers for all incoming presence/message stanzas
	_connected : function() {
		this._connection.addHandler(this._onPresence, null, "presence");
		this._connection.addHandler(this._onMessage,  null, "message", "groupchat");	
		this._connection.send(this._initialPresence());		
		this.requestPlaylist();
	},
	
	// Needs to be implemented
	_disconnected : function() {
		// todo
	},
	
	// Helper function that parses attributes from all presence stanzas
	_parsePresence : function(stanza) {
		var $stanza = $(stanza);
		var from = $stanza.attr('from');		
		return {
			room  : Strophe.getBareJidFromJid(from),
			nick  : Strophe.getResourceFromJid(from),
			type  : $stanza.attr('type'),
			code  : $stanza.find('status').attr('code'),
			error : $stanza.find('error').attr('code')
		};
	},
	
	// Helper function that parses attributes from all message stanzas.
	// **TODO: Message text may contain XSS code
	_parseMessage : function(stanza) {
		var $stanza = $(stanza);
		var from = $stanza.attr('from');		
		return {
			room : Strophe.getBareJidFromJid(from),
			nick : Strophe.getResourceFromJid(from),
			text : $stanza.text(),
			$song : $stanza.find('song')
		};	
	},
	
	// Helper function that parses attributes from all song stanzas.
	// This information is generated from the server, so it will
	// not contain any kind of XSS code.
	_parseSong : function($song) {
		return {
			sid    : $song.find('sid').text(),
			uuid   : $song.find('uuid').text(),
			slen   : $song.find('slen').text(),
			thumb  : $song.find('thumb').text(),
			title  : $song.find('title').text()
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
		var $stanza   = $(stanza);
		var $playlist = $stanza.find('playlist');
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
				sid      : $sync.find('sid').text(),
				uuid    : $sync.find('uuid').text(),
				elapsed : parseInt($sync.find('elapsed').text())
			}
			if (sync.elapsed !== -1) $.publish("song/sync", [ sync ]);
		});
	},
	
	// *TODO: I think this function might be ready
	_onPresence : function(stanza) {
		var pres = this._parsePresence(stanza);	
		if (pres.room !== this.room) return true;
		if (pres.code === "110") $.publish("room/joined", [ this.nick, this.room ]);
		switch(pres.type) {
			case "error"	   : $.publish('room/error',        [ pres.error ]); break;
			case "unavailable" : $.publish('room/user/left',    [ pres.nick ]);  break;
			default			   : $.publish('room/user/entered', [ pres.nick ]);
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
	sendSong : function(id) {
		var song = $msg({
			to: this.room,
			type: "groupchat"
		}).c('song', { 
				xmlns : "http://listeninghall.com/ns/song1", 
				type  : "queue"}).c('sid').t(id);
		this._connection.send(song);		  
	},
	
	// Template for initial presence. 
	_initialPresence : function() {
		return $pres({ to: this.room + "/" + this.nick })
					.c("x", { xmlns: Strophe.NS.MUC });		
	}
	
};


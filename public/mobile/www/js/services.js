angular.module('starter.services', [])
.service('$pubsub', function() {

        var d = this;

        // the topic/subscription hash
        var cache = {};

        d.each = angular.forEach;

        d.pub = function(/* String */topic, /* Array? */args){
            // summary:
            //      Publish some data on a named topic.
            // topic: String
            //      The channel to publish on
            // args: Array?
            //      The data to publish. Each array item is converted into an ordered
            //      arguments on the subscribed functions.
            //
            // example:
            //      Publish stuff on '/some/topic'. Anything subscribed will be called
            //      with a function signature like: function(a,b,c){ ... }
            //
            //  |       $.publish("/some/topic", ["a","b","c"]);

            cache[topic] && d.each(cache[topic], function(scope){
                scope.apply(scope, args || []);
            });
        };

        d.sub = function(/* String */topic, /* Function */callback){
            // summary:
            //      Register a callback on a named topic.
            // topic: String
            //      The channel to subscribe to
            // callback: Function
            //      The handler event. Anytime something is $.publish'ed on a
            //      subscribed channel, the callback will be called with the
            //      published array as ordered arguments.
            //
            // returns: Array
            //      A handle which can be used to unsubscribe this particular subscription.
            //
            // example:
            //  |   $.subscribe("/some/topic", function(a, b, c){ /* handle data */ });
            //
            if(!cache[topic]){
                cache[topic] = [];
            }
            cache[topic].push(callback);
            return [topic, callback]; // Array
        };

        d.unsubscribe = function(/* Array */handle){
            // summary:
            //      Disconnect a subscribed function for a topic.
            // handle: Array
            //      The return value from a $.subscribe call.
            // example:
            //  |   var handle = $.subscribe("/something", function(){});
            //  |   $.unsubscribe(handle);

            var t = handle[0];
            cache[t] && d.each(cache[t], function(scope, idx){
                if(scope == handle[1]){
                    cache[t].splice(idx, 1);
                }
            });
        };




})
.service('$connection', function($pubsub) {


    var Connection = function() {
        return {

        _INIT: false,

        // Default server information
        CONFIG: {
            BOSH     : "http://192.168.1.109:5280/http-bind/",
            HOST     : "listeninghall.com",
            MUC_HOST : "@conference.listeninghall.com"
        },

        // Namespace references
        XMLNS: {
            items    : "http://jabber.org/protocol/disco#items",
            info     : "http://jabber.org/protocol/disco#info",
            owner    : "http://jabber.org/protocol/muc#owner",
            playlist : "http://listeninghall.com/ns/playlist",
            sync     : "http://listeninghall.com/ns/song#sync",
            skip     : "http://listeninghall.com/ns/song#skip",
            songq    : "http://listeninghall.com/ns/song#queue"
        },

        // Subscribe to events published by the app.
        subscribe: function () {
            $pubsub.sub('connection/joinNew', this.createRoom);
            $pubsub.sub('connection/join',    this.joinExistingRoom);
            $pubsub.sub('message/send',       this.sendMessage);
            $pubsub.sub('song/send',          this.sendSong);
            $pubsub.sub('playlist/resync',    this.requestPlaylist);
            $pubsub.sub('room/setPass',       this.requestPassword);
            $pubsub.sub('song/resync',        this.requestSync);
            $pubsub.sub('song/voteSkip',      this.requestSkip);
        },

        // Use Underscore.js 'bindAll' function to bind all
        // methods in this object to run within context of this object
        // (need this for all the event handlers, where 'this' becomes
        // handled within the context of the callback). Create the
        // Strophe connection, and subscribe to all events.
        initialize: function () {
            _.bindAll(this);
            this._connection = new Strophe.Connection('ws://192.168.1.109:5280/');
            this._send       = _.bind(this._connection.send,   this._connection);
            this._sendIQ     = _.bind(this._connection.sendIQ, this._connection);
            this.connect();
            this.subscribe();
        },

        // Connect anonymously to the server. Publish the connection status
        // to the rest of the app so that other objects can display the connection's
        // progress. Upon successful connection, attach handlers to deal with incoming
        // message/presence stanzas.
        connect: function () {
            this._connection.connect(this.CONFIG.HOST, null, _.bind(function (status) {
                $pubsub.pub("connection/progress", [status]);
                if (status === Strophe.Status.CONNECTED) {
                    this._INIT = true;
                    this._connection.addHandler(this._onPresence, null, "presence");
                    this._connection.addHandler(this._onMessage,  null, "message", "groupchat");
                }
            }, this));
        },

        // Handle new room creation. Query the server to see if the desired
        // room name is already taken. Signal the app if there is a room name,
        // conflict, otherwise join the room.
        createRoom: function (options) {
            this._setUser(options.nick, options.room);
            this._request("get", "items", function (query) {
                var $room  = $(query).find('item');
                var exists = $room.length !== 0 ? true : false;
                exists ? $pubsub.pub("room/conflict", ["roomExists"]) : this.sendPresence(options.pass);
            });
        },

        // Handle joining existing room. Query room information to determine
        // if it is password-protected. Signal the app if a password is required,
        // otherwise try to join the room.
        joinExistingRoom: function (options) {
            this._setUser(options.nick, options.room);
            this._request("get", "info", function (info) {
                if ($(info).find("feature[var='muc_passwordprotected']").length === 1) {
                    $pubsub.pub("room/requirePass");
                }
                this.sendPresence(options.pass);
            });
        },

        // Template for messages that contain only groupchat text
        sendMessage: function (msg) {
           var msg = $msg({to: this.room, type: "groupchat"})
                     .c('body').t(msg.text);
           this._send(msg);
        },

        // Template for messages containing song information.
        // *Note: All messages are sent as type "groupchat", and the
        // song element is sent as a payload inside the message.
        sendSong: function (sid) {
            var msg = $msg({to: this.room, type: "groupchat"})
                      .c('song', {xmlns: this.XMLNS["songq"], type: "queue"})
                      .c('sid').t(sid);
            this._send(msg);
        },

        // Template for presence stanzas.
        sendPresence: function (pass) {
            var pres = $pres({to: this.room + "/" + this.nick})
                       .c("x", {xmlns: Strophe.NS.MUC})
                       .c("password").t(pass);
            this._send(pres);
        },

        // Request the entire playlist from the server. This request
        // is made upon initially joining a room, or when it is necessary
        // to resync the playlist with the server. The list is parsed and
        // pushed into an array to be used by other objects.
        requestPlaylist: function () {
            this._request("get", "playlist", function (playlist) {
                var $playlist = $(playlist).find('playlist');
                var songs = [];
                $playlist.find('song').each(_.bind(function (i, song) {
                    var song = this._parseSong($(song));
                    songs.push(song);
                }, this));
                if (songs.length > 0) {
                    $pubsub.pub("song/playlist", [songs]);
                    this.requestSync();
                }
            });
        },

        // Request the elapsed time of the current song from the server.
        // This request is made when a user joins an existing room, where
        // the playlist is already playing.
        requestSync: function () {
            this._request("get", "sync", function (stanza) {
                var $sync = $(stanza).find('sync');
                var sync = {
                    sid: $sync.find('sid').text(),
                    uuid: $sync.find('uuid').text(),
                    elapsed: parseInt($sync.find('elapsed').text())
                }
                if (sync.elapsed !== -1) $pubsub.pub("song/sync", [sync]);
            });
        },

        // If the user is the creator of the room, they can password-protect it.
        // MUC service requires us to fill out a room configuration form to apply
        // a password. We must first request the configuration form, fill out the form
        // (in this case, add our password), and send the form back (in its entirety).
        requestPassword: function (pass) {
            this._request("get", "owner", function (form) {
                // Once we have the configuration form, the only thing
                // we will be changing is the "Password" field.
                var $form = $(form);
                $form.find('field[label="Password"]').find('value').text(pass);
                var $fields = $form.find('field');

                // Rebuild our response stanza with all fields. Send new
                // configuration to room, do nothing with the server response.
                var set = $iq({to: this.room, type: "set"})
                          .c("query", {xmlns: this.XMLNS.owner})
                          .c("x", {xmlns: "jabber:x:data",type: 'submit'});
                $fields.each(function (i, field) {
                    set.cnode(Strophe.copyElement(field)).up();
                });
                this._sendIQ(set, function (stanza) { return });
            });
        },

        // Send a skip vote to the server for the current song.
        // Do nothing with the server response.
        requestSkip: function () {
            this._request("set", "skip", function (stanza) { return });
        },

        // Handler for incoming presence stanzas. Most of the logic
        // in this function deals with creating/joining rooms, since
        // our app does not do much else with presences. If an incoming
        // presence indicates we have succesfully joined the room, signal
        // the app with the confirmed room/nick. Also, request the playlist
        // from the server. Return true to keep this handler alive for future
        // incommng presences.
        _onPresence: function (presence) {
            var pres = this._parsePresence(presence);
            if (pres.room !== this.room) return true;
            if (pres.error === "409") $pubsub.pub("room/conflict", ["nickExists"]);
            if (pres.error === "401") $pubsub.pub("room/conflict", ["passWrong"]);

            // Other users have joined/left
            $pubsub.pub("room/user/" + (pres.type === "unavailable" ? "left" : "entered"), [pres.nick]);

            // This user successfully joined for the first time. The node part of
            // the jid (room name) will need be escaped. Pass user information
            // information over to the app, and get playlist
            if (pres.status === "110") {
                var node = Strophe.getNodeFromJid(this.room);
                var room = Strophe.unescapeNode(node);
                $pubsub.pub("room/joined", [room, this.nick]);
                $pubsub.pub("room/user/affil", [pres.affil])
                this.requestPlaylist();
            }
            return true;
        },

        // Handler for incoming message stanzas. Messages stanzas will contain
        // groupchat messages, as well as playlist/song information. If the
        // message contains a song, allow onSong to handle the song data.
        // If the message is from this user, do not publish, since it has
        // already been rendered to enhance app responsiveness. Return true to
        // keep this handler alive for future incoming messages.
        _onMessage: function (message) {
            var msg = this._parseMessage(message);
            if (msg.room !== this.room) return true;
            if (msg.$song.length > 0) {
                this._onSong(msg.$song);
                return true;
            }
            if (msg.nick === this.nick) return true;
            $pubsub.pub('message/recieved', [msg.nick, msg.text]);
            return true;
        },

        // There are three types of song stanzas that are supported.
        // This function will determine the type of the song, and
        // publish the corresponding event.
        _onSong: function ($song) {
            var song = this._parseSong($song),
                type = $song.attr('type');
            if (type === 'queue') $pubsub.pub('song/queue', [song]);
            if (type === 'play')  $pubsub.pub('song/play',  [song]);
            if (type === 'stop')  $pubsub.pub('song/stop');
        },

        // Helper function that parses attributes from all presence stanzas.
        _parsePresence: function (stanza) {
            var $stanza = $(stanza),
                from = $stanza.attr('from');
            return {
                room   : Strophe.getBareJidFromJid(from),
                nick   : Strophe.getResourceFromJid(from),
                type   : $stanza.attr('type'),
                status : $stanza.find('status').attr('code'),
                error  : $stanza.find('error').attr('code'),
                affil  : $stanza.find('item').attr('role')
            };
        },

        // Helper function that parses attributes from all message stanzas.
        _parseMessage: function (stanza) {
            var $stanza = $(stanza),
                from = $stanza.attr('from'),
                // Unescape invalid xml characters. The main app appends
                // text using jQuery.text(), so we must do this.
                xmlunescape = function(text) {
                    text = text.replace(/\&amp\;/g,  "&");
                    text = text.replace(/\&lt\;/g,   "<");
                    text = text.replace(/\&gt\;/g,   ">");
                    text = text.replace(/\&apos\;/g, "'");
                    text = text.replace(/\&quot\;/g, "\"");
                    return text;
                };
            return {
                room  : Strophe.getBareJidFromJid(from),
                nick  : Strophe.getResourceFromJid(from),
                text  : xmlunescape($stanza.text()),
                $song : $stanza.find('song')
            };
        },

        // Helper function that parses attributes from all song stanzas.
        // This information is generated from the server, so it will
        // not contain any kind of XSS code.
        _parseSong: function ($song) {
            return {
                sid   : $song.find('sid').text(),
                uuid  : $song.find('uuid').text(),
                slen  : $song.find('slen').text(),
                thumb : $song.find('thumb').text(),
                title : $song.find('title').text()
            }
        },

        // Helper function to generate IQ stanzas based on
        // type (get or set), and the specified request.
        _request: function (reqType, req, callback) {
            var req = $iq({to: this.room, type: reqType})
                      .c("query", {xmlns: this.XMLNS[req]});
            this._sendIQ(req, _.bind(callback, this));
        },

        // Store nick and the full room address, so we can quickly
        // send stanzas to the server. XMPP standards require that
        // the node part of the room address be escaped.
        _setUser: function (nick, room) {
            this.nick = nick;
            this.room = Strophe.escapeNode(room) + this.CONFIG.MUC_HOST;
        }
    };
    }();

    angular.extend(this, Connection);


})
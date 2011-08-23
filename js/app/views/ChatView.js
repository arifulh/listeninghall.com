var ChatView = Backbone.View.extend({
    el: $("#chat"),

    // Listen for user keyboard input
    events: {
        "keypress #chatInput": "createMessage",
        "focus #chatInput"   : "toggleFocus",
        "blur #chatInput"    : "toggleFocus"
    },

    // Subscribe to Connection object events
    subscribe: function () {
        $.subscribe("room/joined",      this.setUser);
        $.subscribe("message/recieved", this.renderMessage);
    },

    // ChatView handles the chat UI component. It is responsible
    // for displaying incoming chat messages, and signaling the
    // Connection object about outgoing chat messages. Initialize
    // the view by referencing the display/input DOM elements, as
    // well the message templates. Attach the scrollpane plugin to 
    // display as well.
    initialize: function () {
        _.bindAll(this, 'subscribe', 'renderMessage', 'setUser', 'toggleFocus');
        this.$display = $("#chatDisplay").jScrollPane({hideFocus: true}).data('jsp');
        this.$input   = $("#chatInput");
        this.msgTemplate = _.template($("#message-template").html());
        this.focusCount = 0; 
        this.subscribe();
    },

    // Upon succesfully joining the room, set room/nick
    setUser: function (room, nick) {
        this.room = room;
        this.nick = nick;
    },

    // Create chat message if the the ENTER button was 
    // pressed, and also if the input field is not empty. 
    createMessage: function (e) {
        if (e.which !== 13) { return; }
        if ($.trim(this.$input.val()) === "") { return; }

        // Create a message object, and signal the Connect object
        var message = {nick: this.nick, text: this.$input.val() };
        $.publish("message/send", [message]);

        // Render the message right away to enhance UI feedback
        this.renderMessage(message.nick, message.text);
        this.$input.val('');
    },

    // Create a new DOM element for the chat message. Manually 
    // insert the nickname and message using Jquery.text() 
    // to avoid XSS. Finally, append the new element.
    renderMessage: function (nick, message) {
        var $element = $(this.msgTemplate());
        $element.find('.chatNick').text(nick);
        $element.find('.chatText').text(message);

        // Append new element, and reinitialize the scrollpane plugin. The 
        // scrollpane api does not return itself, hence the redundant calls.
        this.$display.getContentPane().append($element);
        this.$display.reinitialise();
        this.$display.scrollToBottom();

        // Update title bar if chat is unfocused to alert users
        // of new chat messages if they happen to be tabbed away.
        if (!this.focus) {
            this.focusCount++;
            document.title = "[" + this.focusCount + "]" + " ListeningHall";
        }
    },

    // Determine if the chatInput is focused or not. This will
    // allow us to keep track of when the user is tabbed away
    // in another window. We use the chat input box instead of 
    // the $(window) object for cross browser reasons (IE7).
    toggleFocus : function(e) {
        this.focus = (e.type === "focusin") ? true : false;
        // Reset title bar to default if we have focus
        if (this.focus) {
            document.title = "ListeningHall";
            this.focusCount = 0;
        };
    }
});

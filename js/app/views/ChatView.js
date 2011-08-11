var ChatView = Backbone.View.extend({
    el: $("#chat"),

    // Listen for user keyboard input
    events: {
        "keypress #chatInput": "createMessage"
    },

    // Subscribe to Connection object events
    subscribe: function () {
        $.subscribe("room/joined",      this.setNick);
        $.subscribe("message/recieved", this.renderMessage);
    },

    // ChatView handles the chat UI component. It is responsible
    // for displaying incoming chat messages, and signaling the
    // Connection object about outgoing chat messages. Initialize
    // the view by referencing the display/input DOM elements, as
    // well the message templates. Attach the scrollpane plugin to 
    // display as well.
    initialize: function () {
        _.bindAll(this, 'subscribe', 'renderMessage', 'setNick');
        this.$display    = $("#chatDisplay").jScrollPane().data('jsp');
        this.$input      = $("#chatInput");
        this.msgTemplate = _.template($("#message-template").html());
        this.subscribe();
    },

    // Upon succesfully joining the room, set room/nick
    setNick: function (room, nick) {
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
        this.$display.scrollToBottom(true);
    }
});

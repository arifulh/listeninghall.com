var ChatView = Backbone.View.extend({

    el : $("#chat"),

    events : {
        "keypress #chatInput": "createMessage"
    },

    subscribe : function () {
        $.subscribe("room/joined",      this.setNick);
        $.subscribe("message/recieved", this.renderMessage);
    },

    initialize : function () {
        _.bindAll(this, 'subscribe', 'renderMessage', 'setNick');
        this.$display         = $("#chatDisplay").jScrollPane().data('jsp');
        this.$input           = $("#chatInput");
        this.messageTemplate = _.template($("#message-template").html());
        this.subscribe();
    },

    // Needs XSS examination
    setNick : function (room, nick) {
        this.nick = nick
    },

    // Needs XSS examination
    createMessage : function (e) {
        if (e.which !== 13) return;
        var message = {nick: this.nick, text: this.$input.val()};
        $.publish("message/send", [message]);
        this.renderMessage(message.nick, message.text);
        this.$input.val('');
    },

    renderMessage : function (nick, message) {
        var $element = $(this.messageTemplate());
        $element.find('.chatNick').text(nick);
        $element.find('.chatText').text(message);


        this.$display.getContentPane().append($element);
        this.$display.reinitialise();
        this.$display.scrollToBottom(true);
    }
});

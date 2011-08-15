var ToolbarView = Backbone.View.extend({
    el: $("#toolbar"),

    events: {
        "mouseenter span#invite"  : "showInvite",
        "mouseenter span#members" : "showMembers",
        "mouseenter span#pass"    : "showPass"
    },

    subscribe: function () {
        $.subscribe("room/user/affil", this.adminTools);
    },

    // We will be using tooltips to display information for each
    // of the toolbar icons, so compile the templates for each 
    // tooltip beforehand.
    initialize: function () {
        _.bindAll(this, "showInvite", "showMembers", "showPass", "adminTools");
        this.templateInv  = _.template($("#invite-template").html());
        this.templateMem  = _.template($("#memberul-template").html());
        this.templatePass = _.template($("#pass-template").html());
        this.password     = "";
        this.subscribe();
    },

    // Users can invite others to the room just by sharing the link.
    // Render the room url as content for the tooltip.
    showInvite: function (e) {
        var url = window.location.href;
        var render = this.templateInv({link: url});
        this.attachTip(e.currentTarget, render, 'w');
    },

    // Render memberlist as content for the tooltip
    showMembers: function (e) {
        var members = this.collection;
        var render = this.templateMem({mem: members.toJSON()});
        this.attachTip(e.currentTarget, render, 's');
    },

    // Render set-password form as content for the tooltip.
    // This function will also attach a callback function
    // when the tooltip is closed, signaling the Connection 
    // object to set the password on the server.
    showPass: function (e) {
        var current  = this.password,
            render   = this.templatePass({pass: current}),
            callback = _.bind(function () {
                var pass = $("#setPassword").val();
                $.publish("room/setPass", [pass]);
                this.password = pass;
            }, this);
        this.attachTip(e.currentTarget, render, 's', callback);
    },

    // Show administrator tool icons if the user has the appropriate affiliation.
    adminTools: function (affiliation) {
        if (affiliation === "moderator") {
            $(this.el).addClass("admin");
        }
    },

    // Generate and attach tooltip to target
    attachTip: function (tar, ren, pos, callback) {
        $(tar).miniTip({
            content: ren,
            anchor: pos,
            hide: callback,
            aHide: false,
            maxW: '400px',
            delay: 10,
            event: 'click'
        });
    }
});

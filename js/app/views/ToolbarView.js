var ToolbarView = Backbone.View.extend({
    el: $("#toolbar"),

    events: {
        "mouseenter a#invite"  : "showInvite",
        "mouseenter a#members" : "showMembers",
        "mouseenter a#pass"    : "showPass"
    },
    
    // We will be using tooltips to display information for each
    // of the toolbar icons, so compile the templates for each 
    // tooltip beforehand.
    initialize: function () {
        this.templateInv  = _.template($("#invite-template").html());
        this.templateMem  = _.template($("#memberul-template").html());
        this.templatePass = _.template($("#pass-template").html());
        this.$pass           = $("#setPassword");
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
        var render = this.templatePass();
        var pass = this.$pass.val();
        var callb = function() {$.publish("room/setPass", [pass])}
        this.attachTip(e.currentTarget, render, 's', callb);
    },

    // Generate and attach tooltip to target
    attachTip: function (tar, ren, pos, callb) {
        $(tar).miniTip({
            content : ren,
            anchor  : pos,
            fadeOut : callb,
            aHide   : false,
            maxW    : '400px',
            event   : 'click',
            delay   : 150
        });
    }
});

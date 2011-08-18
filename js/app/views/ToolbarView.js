var ToolbarView = Backbone.View.extend({
    el: $("#toolbar"),
    
    subscribe: function () {
        $.subscribe("room/user/affil", this.adminTools);
    },

    // We will be using tooltips to display information for each
    // of the toolbar icons, so compile the templates for each 
    // tooltip beforehand.
    initialize: function () {
        _.bindAll(this, "adminTools", "renderInvite", "renderMembers", "renderPass");
        this.templateInv  = _.template($("#invite-template").html());
        this.templateMem  = _.template($("#memberul-template").html());
        this.templatePass = _.template($("#pass-template").html());      
        this.password     = "";
        this.createTips();
        this.subscribe();
    },

    // Users can invite others to the room just by sharing the link.
    // Render the room url as content for the tooltip.
    renderInvite: function () {
        var url = window.location.href,
            render = this.templateInv({link: url});
        return render;
    },

    // Render memberlist as content for the tooltip
    renderMembers: function () {
        var members = this.collection,
            render  = this.templateMem({mem: members.toJSON()});
        return render;
    },

    // Render set-password form as content for the tooltip.
    renderPass: function (e) {
        var current  = this.password,
            render   = this.templatePass({pass: current});
        return render;
    },

    // Show administrator tool icons if the user is a moderator.
    adminTools: function (affiliation) {
        if (affiliation === "moderator") {
            $(this.el).addClass("admin");
        }
    },

    // Generate and attach tooltip to target
    createTips: function () {
        var attach = function (tar, ren, pos, callback) {
                $(tar).parent().miniTip({
                    content : ren,
                    anchor  : pos,
                    hide    : callback,
                    aHide   : false,
                    maxW    : '400px',
                    delay   : 200,
                    event   : 'hover'
                });
            },
            // Callback function when the password tooltip is closed. This  
            // signals the Connection object to set the password on the server.
            publishPass = function () {
                var pass = $("#setPassword").val();
                $.publish("room/setPass", [pass]);
                this.password = pass;
            };  

        // Attach tooltips once
        attach(this.$("#inviteTool"), this.renderInvite, 'w');
        attach(this.$("#membersTool"), this.renderMembers, 's');
        attach(this.$("#passTool"), this.renderPass, 's', publishPass);
    }
});

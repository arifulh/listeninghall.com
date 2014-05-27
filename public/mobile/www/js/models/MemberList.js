var MemberList = Backbone.Collection.extend({
    model: Member,

    _subscribe: function () {
        $.subscribe('room/user/entered', this.addMember);
        $.subscribe('room/user/left',    this.removeMember);
    },

    // MemberList listens to the Connection object
    // for presence updates from room participants. 
    initialize: function () {
        _.bindAll(this, 'addMember', 'removeMember');
        this._subscribe();
    },

    addMember: function (nick) {
        var member = this.findNick(nick);
        if (member === nick) return;
        this.add({ "nick": nick });
    },

    removeMember: function (nick) {
        var member = this.findNick(nick);
        this.remove(member);
    },

    // Helper function to quickly locate a member object
    findNick: function (nick) {
        return this.find(function (m) {
            return m.get("nick") === nick
        });
    }
});
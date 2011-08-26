var Member = Backbone.Model.extend({
    initialize: function () {
        this.set({ "status": "available" });
    }
});
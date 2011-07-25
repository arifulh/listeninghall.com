var LoginView = Backbone.View.extend({

    el: $("#loading"),

    events: {
        "click #loginButton": "login"
    },

    // Subscribe to events published by the Connection object
    subscribe: function () {
        $.subscribe('room/joined',         this.success);
        $.subscribe("room/requirePass",    this.requirePass);
        $.subscribe("room/conflict",       this.handleConflict);
        $.subscribe('connection/progress', this.handleProgress);
    },

    // Store references to the DOM elements that we will need access frequently
    // for user input and animation. Also call 'checkUrlHash" once this view
    // is initialized to handle room parameters right away.
    initialize: function () {
        _.bindAll(this, 'login', 'subscribe', 'success', 'checkUrlHash', 'handleProgress');
        this.$nickInput   = $("#loginNick");
        this.$roomInput   = $("#loginRoom");
        this.$passInput   = $("#loginPass");
        this.$loginButton = $("#loginButton");
        this.$progress    = $("#loginProgress");
        this.create       = true; // Default, assume new room will be created.
        this.checkUrlHash();
        this.subscribe();
    },

    // Grab login form information, and publish an event for the
    // Connection object to attempt connect with the provided
    // information. The "roomType" determines if a new room needs
    // to be created or not.
    login: function () {
        var options = {
            room : this.$roomInput.val(),
            nick : this.$nickInput.val(),
            pass : this.$passInput.val()
        }
        var roomType = this.create ? 'New' : '';
        $.publish('connection/join' + roomType, [options]);
    },

    // Upon succesful entrance, set the room as a url
    // hash parameter, and fade out the loading screen.
    success: function (room, nick) {
        window.location.hash = "/" + room;
        $(this.el).fadeOut("slow", function () {
            $("#top").fadeIn("slow");
        });
    },

    // Check to see if the app has a room hash parameter. If it does, 
    // set the room input field value and prevent user interaction 
    // with this field. Also, display "create" or "join" button.
    checkUrlHash: function () {
        var roomParameter = (window.location.hash).split("/")[1] || "";
        if (roomParameter !== "") {
            this.create = false;
            this.$roomInput.val(roomParameter)
                           .addClass("set1")
                           .keypress(function (){ return false });
        }
        this.$loginButton.text(this.create ? "Create" : "Join");
    },

    // Update connection progress bar based on status 
    // updates. Once connected (status === 5), hide progress 
    // bar and display login dialog.
    handleProgress: function (status) {
        var percentage = {
            1: 30, // status === 1 : Connecting
            3: 75, // status === 3 : Authorizing
            5: 100 // status === 5 : Successfully connected
        };
        this.$progress.slider("value", percentage[status], true);
        if (status === 5) {
            this.$progress.fadeOut(function () {
                // Switch classes to manually enforce vertical alignment
                $("#login").switchClass("valign1", "valign2", "fast");
                $("#loginDialog").fadeIn();
            });
        }
    },

    // Alert user if they try to create a room that already exists,
    // or use a nickname already in use, or if the password provided
    // is incorrect.
    handleConflict: function (conflict) {
        var $display = {
            "exists" : $("#room_conflict"),
            "nick"   : $("#nick_conflict"),
            "pass"   : $("#pass_conflict")
        };
        $display[conflict].effect("pulsate", {times: 3});
    },

    // Display the password field if the room is protected. Also
    // adjust the vertical alignment of the login box since we just
    // added a new field.
    requirePass: function () {
        $("#login").switchClass("valign2", "valign3", "fast");
        $("#requirePass").fadeIn();
    }
});

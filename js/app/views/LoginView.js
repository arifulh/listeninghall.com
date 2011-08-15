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
        $.subscribe('connection/progress', this.updateProgress);
    },

    // Store references to the DOM elements that we will need access frequently
    // for user input and animation. Also call 'checkUrlHash" once this view
    // is initialized to handle room parameters right away.
    initialize: function () {
        _.bindAll(this, 'success', 'updateProgress', 'handleConflict');
        this.progress  = this.progressBar();
        this.showError = this.errorDialog();
        this.create    = true; // Default, assume new room will be created.
        this.cacheInputs();
        this.checkUrlHash();
        this.subscribe();
    },

    // Cache input fields/buttons that will need to frequently 
    // reference to perform error-checking/modification.
    cacheInputs: function () {
        this.$nickInput   = this.$("#loginNick");
        this.$roomInput   = this.$("#loginRoom");
        this.$passInput   = this.$("#loginPass");
        this.$loginButton = this.$("#loginButton");
    },

    // Attempt to login to the server when the login button is clicked. 
    // There are two functions defined within this function, 'isLoginEmpty'
    // verifies the login fields, and 'connect' handles creating a signal
    // for the Connection object to connect.
    login: function () {

        // Determine if login fields are empty. Alert the user if
        // they are and return false. This function self-executes.
        var isLoginEmpty = _.bind(function () {
            var empty = false;
            if (this.$roomInput.val() === "") {
                this.showError("room", "Please enter a room name");
                empty = true;
            }
            if (this.$nickInput.val() === "") {
                this.showError("nick", "Please enter a nick name");
                empty = true;
            }
            return empty;
        }, this)();

        // Grab login form information, and publish an event for the
        // Connection object to signal it to connect. The "roomType" 
        // determines if a new room needs to be created or not.
        var connect = _.bind(function () {
            var roomType = this.create ? 'New' : '';
            $.publish('connection/join' + roomType, [{
                room: this.$roomInput.val(),
                nick: this.$nickInput.val(),
                pass: this.$passInput.val()
            }]);
        }, this);

        // If login is not empty, connect.
        if (!isLoginEmpty) { connect(); }
    },

    // Upon succesful entrance, set the room as a url
    // hash parameter, and fade out the loading screen.
    success: function (room, nick) {
        window.location.hash = "/" + room;
        $(this.el).fadeOut("slow", function () {
            var $header = $("#top");
            $header.fadeIn("slow");
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
                           .keypress(function () { return false; });
        }
        this.$loginButton.text(this.create ? "Create" : "Join");
    },

    // Create progress bar that updates based on Connection
    // status. This function returns a closure that will use the
    // the DOM references in the outer function. 
    progressBar: function () {
        var $progressBar = this.$("#loginProgress"),
            $loginDialog = this.$("#loginDialog"),
            $login       = this.$("#login");

        // Update progress bar slider. If the slider reaches 100,
        // fade the slider out and display the login dialog. Switch 
        // classes to manually enforce vertical alignment
        return function (amount) {
            $progressBar.slider("value", amount, true);
            if (amount === 100) {
                $progressBar.fadeOut(function () {
                    $loginDialog.fadeIn();
                    $login.switchClass("valign1", "valign2", "fast");
                });
            }
        };
    },

    // Intercept connection status events, and update the progress bar.
    updateProgress: function (status) {
        switch (status) {
            case Strophe.Status.CONNECTING     : this.progress(30);  break;
            case Strophe.Status.AUTHENTICATING : this.progress(75);  break;
            case Strophe.Status.CONNECTED      : this.progress(100); break;
        }
    },

    // Create a error dialog that will display error alerts to the 
    // user based on the type of error. This function references the 
    // specific DOM elements where each type of error will be shown.  
    errorDialog: function () {
        var error = {
            "room": $("#room_conflict"),
            "nick": $("#nick_conflict"),
            "pass": $("#pass_conflict")
        };

        // Closure that will use the appropriate DOM references in
        // the outer function to display the error.
        return function (type, errorText) {
            var $element = error[type];
            $element.text("(" + errorText + ")").effect("pulsate", {times: 3});
        }
    },

    // Handle conflict messages from the Connection object. Determine
    // the type of conflict, and pass it on to the showError object.
    handleConflict: function (conflict) {
        switch (conflict) {
            case "roomExists":
                this.showError("room", "Room already exists"); 
                break;
            case "nickExists":
                this.showError("nick", "Nick already taken");  
                break;
            case "passWrong":
                this.showError("pass", "Required/Incorrect");  
                break;
        };
    },

    // Display the password field if the room is protected. Also
    // adjust the vertical alignment of the login box since we just
    // added a new field.
    requirePass: function () {
        this.$("#login").switchClass("valign2", "valign3", "fast");
        this.$("#requirePass").fadeIn();
    }
});

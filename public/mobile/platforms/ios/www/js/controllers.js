
angular.module('starter.controllers', [])
.controller("MainController", [ '$scope', '$window', function($scope, $window) {
    $scope.data = { url: null, room: null, nick: null, existing: false };

    $scope.setRoomUrl = function(url) {
        $scope.$apply( function() {
            var room = url.replace('listeninghall://', '');
            $scope.data.url = url;
            $scope.data.room = room;
            $scope.data.existing = true;
            $window.data = $scope.data;
        });
    }



}])
.controller('HomeCtrl', function($scope, $pubsub, $state, $ionicActionSheet) {

    $scope.login = function () { connect(); }

    var connect = function() {
        var roomType = $scope.data.existing ? '' : 'New';
        $pubsub.pub('connection/join' + roomType, [{
            room: $scope.data.room,
            nick: $scope.data.nick,
            pass: null
        }]);
    }

    var onLogin = function(room, nick) {
        $state.go('tab.room');
    }

    $pubsub.sub('room/joined', onLogin);


})
.controller('JoinCtrl', function($scope) {

})
.controller('CreateCtrl', function($scope) {

})
.controller('RoomCtrl', function($scope, $pubsub, $state, $ionicNavBarDelegate, $ionicScrollDelegate, $ionicSlideBoxDelegate, $ionicSlideBoxDelegate, $window, $timeout) {
    var input = null;
    $scope.data = { message: null };
    $scope.isKeyboard = false;
    $scope.slideIndex = 0;
    $scope.data.allmessages = [];
    var slidebox = $ionicSlideBoxDelegate.$getByHandle('main-sliderbox');




     var setUser = function(room, nick){
        $scope.room = room;
        $scope.nick = nick;
        }


     var renderMessage = function(nick, message){
        $scope.data.allmessages.push({nick: nick, text: message });
       $ionicScrollDelegate.scrollBottom();
    }

    $scope.slideHasChanged = function(index) {
        $scope.slideIndex = index;
    }



        $pubsub.sub("room/joined",      setUser.bind(this));
        $pubsub.sub("message/recieved", renderMessage.bind(this));

  $scope.sendMessage = function() {
    if (!$scope.data.message) return;
    var msg = {nick: $scope.nick, text: $scope.data.message, user: true };
    $scope.data.allmessages.push(msg);
    $pubsub.pub("message/send", [msg]);
    $scope.data.message = '';
     $ionicScrollDelegate.scrollBottom();

  };

  $scope.goBack = function() {
    $ionicNavBarDelegate.back();
  };

  $scope.gotoPlaylist = function() {
    slidebox.slide(0)
  };


  $scope.gotoChat = function() {
     slidebox.slide(1)
  };

    $scope.sendSocialInvite = function() {
        var message = {
            subject: "Listening Hall",
            text: "Join this room ",
            activityTypes: ["Message"]
        };
        window.socialmessage.send(message);
    };

    $scope.onChatInputFocus = function() {
        $scope.isKeyboard = true;
        $window.scrollTo(0,0);
    }

    $scope.cancelChatInput = function() {
        input = input || angular.element($window).find('#chatInput');
        input.triggerHandler('blur');
        $scope.isKeyboard = false;
        $timeout(function() {
            $scope.data.message = '';
        }, 1);

    }













});


function handleOpenURL(url) {
    var body = document.getElementsByTagName("body")[0];
    var mainController = angular.element(body).scope();
    mainController.setRoomUrl(url);
}


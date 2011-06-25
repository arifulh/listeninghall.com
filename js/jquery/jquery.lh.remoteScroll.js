

// Todo: This plugin needs cleanup, better documentation

(function($) {
	
		var SPEED = {
			"FAST"     : 1400,
			"NORMAL"   : 5000,
			"SLOW"     : 7000
		};

		var methods = {
			init : function(options) { 
				return this.each(function() {
					var $elem    = $(this),
						$up      = $(options.up).data('scroll', $elem),
						$down    = $(options.down).data('scroll', $elem);
					
					$elem.mousewheel(methods._mouseScroll);
					$up.hover(methods._scrollUp, methods._stopScroll);
					$down.hover(methods._scrollDown, methods._stopScroll);
				});		
			},
			
			// Multiply the scroll amount to make it negative or positive to indicate direction
			_mouseScroll : function(event, delta) {
				var $elem         = $(this);
				var scroll_amount = 200;
				var direction     = delta > 0 ? -1 : 1; 
				$elem.stop(true, true)
					 .animate({ scrollTop: $elem[0].scrollTop + scroll_amount*direction  }, 200);
			},		
			
			_scrollUp : function() {
				var $elem = $(this).data('scroll'),
					speed = SPEED.NORMAL;
				if ($elem.scrollTop() < 490) speed = SPEED.FAST;
				$elem.animate({ scrollTop: 0 }, speed);
			},
			
			_scrollDown : function() {
				var $elem = $(this).data('scroll');
				$elem.animate({ scrollTop: $elem[0].scrollHeight }, 4000);
			},
			
			_stopScroll : function(event) {
				var $elem = $(this).data('scroll');
				$elem.stop();
			}

		};
		
		$.fn.remoteScroll = function(method) {
			// Method calling logic
			if (methods[method]) {
				return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
			} else if ( typeof method === 'object' || ! method ) {
				return methods.init.apply( this, arguments );
			} else {
				$.error( 'Method ' +  method + ' does not exist on jQuery.remoteScroll' );
			}    
		};

})( jQuery );
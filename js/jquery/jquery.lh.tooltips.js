(function($) {

		// There is only one tooltip div for the. This 
		// div will be positioned as needed on hovers.
		var $tooltip = $('<div class="tooltip"></div>');
		
		var methods = {
			init : function(options) { 				
				$('body').append($tooltip); 
				
				// Attach hover events to the collection, as well as the tooltip
				$tooltip.hover(methods._persistTip, methods._hideTip);	
				return this.each(function() {
					$(this).hover(methods._showTip, methods._hideTip);
				});
					
			},
			
			// End possible fadeOut animation before showing, don't 
			// allow tooltip to disappear if it is being targetted.
			_persistTip : function() {
				$tooltip.stop(true, true).show();
			},
			
			_showTip : function(event) {
				var $elem = $(this);
				
				// Determine position on the Y axis based on the element being
				// hovered on, and determine X based on where the cursor is.
				// Also add a bit of spacing between the element and the tooltip.
				var posY      = $elem.position().top,
					posX      = event.pageX,
					spacing   = 15;
				
				// End possible fadeOut animation before showing. This can
				// happen if many elements on are hovered on very quickly, 
				// cancelling out fadeIn animations.			
				$tooltip.stop(true, true)
						.show()
						.offset({ top: posY + spacing, left: posX})
						.text($elem.text());
			
			},
			
			// End possible fadeIn animation before fading out.
			_hideTip : function() {
				$tooltip.stop(true, true).fadeOut("fast");
			}
			
		};

		$.fn.tooltips = function(method) {
			// Method calling logic
			if (methods[method]) {
				return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
			} else if ( typeof method === 'object' || ! method ) {
				return methods.init.apply( this, arguments );
			} else {
				$.error( 'Method ' +  method + ' does not exist on jQuery.tooltips' );
			}    
		};
})( jQuery );










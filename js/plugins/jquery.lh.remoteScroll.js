// Quick and dirty custom plugin to allow 
// the PlaylistView to be scrolled smoothly.
(function ($) {

    var methods = {

        init: function (options) {
            return this.each(function () {
                var $elem = $(this),
                    $up = $(options.up).data('scroll', $elem),
                    $dn = $(options.down).data('scroll', $elem);
                
                // Bind mouse events
                $elem.mousewheel(methods._mouseScroll);
                $up.mousedown(methods._scrollUp);
                $dn.mousedown(methods._scrollDown);
                $up.mouseup(methods._stopScroll);
                $dn.mouseup(methods._stopScroll);
            });
        },

        _mouseScroll: function (event, delta) {
            var $elem = $(this),
                scrollAmount = 200,
                currentPos   = $elem.scrollTop(),  

                // Determine if scrolling up or down              
                direction    = delta > 0 ? -1 : 1, 
                offset       = scrollAmount*direction;

            // End previous scroll animation before scrolling
            $elem.stop(true, true).animate({
                scrollTop: currentPos + offset
            }, 200);
        },

        _scrollUp: function () {
            var $elem  = $(this).data('scroll'),
                height1  = $elem.scrollTop(),
                height2  = 0,
                distance = Math.abs(height2 - height1);
            $elem.animate({ scrollTop: 0 }, distance*4);
        },

        _scrollDown: function () {
            var $elem  = $(this).data('scroll'),
                height1  = $elem.scrollTop(),
                height2  = $elem[0].scrollHeight,
                distance = Math.abs(height2 - height1);
            $elem.animate({ scrollTop: height2 }, distance*4);
        },

        _stopScroll: function (event) {
            var $elem = $(this).data('scroll');
            $elem.stop();
        }
    };

    $.fn.remoteScroll = function (method) {
        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.remoteScroll');
        }
    };
})(jQuery);

/*!
  * Multilevel nav slide over functionality v1
  */
  
(function ($) {
    'use strict';

    // Slide over keyboard trap
    var slideOverKeyboardTrap = function(el) {

        // Tabbable elements
        var lastIsMln = el.find('.mln__child__list')
            .first()
            .find(' > .mln__has-child:last-child > .mln__child-controls')
            .first()
            .find('> .mln__toggle-btn, > .mln__toggle-link');
        
        var tabbable = el.find(
            'a[href],' +
            'area[href],' +
            'input:not([disabled]),' +
            'select:not([disabled]),' +
            'textarea:not([disabled]),' +
            'button:not([disabled]),' +
            'iframe,' +
            'object,' +
            'embed,' +
            '[tabindex="0"],' +
            '[contenteditable]'
        );

        var firstTabbable = tabbable.first();
        var lastTabbable = (lastIsMln.length) ? lastIsMln  : tabbable.last();
        
        // Set focus on first input
        firstTabbable.focus();

        // Redirect last tab to first input
        lastTabbable.on('keydown', function(e) {
            if (e.which === 9 && !e.shiftKey && $('body').hasClass('js-off-canvas-showing')) {
                e.preventDefault();
                firstTabbable.focus();
            }
        });

        // Redirect first shift+tab to last input
        firstTabbable.on('keydown', function(e) {
            if (e.which === 9 && e.shiftKey && $('body').hasClass('js-off-canvas-showing')) {
                e.preventDefault();
                lastTabbable.focus();
            }
        });
    };
          
    $.fn.multilevelSlideOver = function (options) {
        $(this).each(function () {
            var $slideOverNav = $(this);
            var settings;
            var mlnDataBreakpoint = $slideOverNav.attr('data-mln-breakpoint');
            
            // Setting defaults
            settings = $.extend({
                'slideTitles': true,
                'slideTitleLink': false,
                'backButtonSymbol': '&lsaquo;',
                'dynamicBackButtonTitle': false,
                'offCanvasCloseAllMenus': false
            }, options);
                        
            function closeAllChildren() {
                if ($slideOverNav.is('.mln--navbar-slide-over')) {
                    $slideOverNav
                        .find('[aria-hidden="false"]')
                        .attr('aria-hidden', true)
                        .removeClass('mln--height-auto mln__child--overflow-visible')
                        .end()
                        .find('.mln__visible-menu')
                        .removeClass('mln__visible-menu')
                        .end()
                        .find('.mln__list')
                        .addClass('mln__visible-menu')   
                        .end()
                        .find('[aria-expanded="true"]')
                        .attr('aria-expanded', false)
                        .closest('.mln__has-child--showing')
                        .removeClass('mln__has-child--showing')
                        .closest('.mln--navbar-slide-over')
                        .css({
                            'min-height': ''
                        });      
                }
            }
            
            // Set height on certain elements to make the outer nav height the same
            // height as the current viewable slide
            function setDynamicHeight() {

                // Reset inline css
                $slideOverNav.find('.mln__child__collapse').css('min-height', '');

                if (parentCollapse) {
                    parentCollapse.css('min-height', '');
                }

                // Cache correct elements and get their proper height
                var latestChildShowing = $slideOverNav.find('.mln__has-child.mln__has-child--showing')
                    .last()
                    .find(' > .mln__child__collapse')
                    .first()
                    .find('> .mln__child__collapse__helper');
                
                var parentCollapse = $slideOverNav.find('.mln__has-child.mln__has-child--showing')
                    .last()
                    .closest('.mln__child__collapse');
                
                var getHeightFromThis = (latestChildShowing.length) ? latestChildShowing : $slideOverNav.find('.mln__list');
                
                // Correct height wether it's a child or the top level list
                var dynamicHeight = getHeightFromThis.outerHeight();
                
                // Set nav elements height to the same as the current viewable slide
                $slideOverNav.css('min-height', dynamicHeight);

                // Set the height of the current slides parent collapse
                // to prevent clunky inner scrollbars
                parentCollapse.css('min-height', dynamicHeight);
            }
            
            // Help mln act like overlay nav for mobile devices
            $slideOverNav.find('.mln__has-child').each(function() {
                var $navEl = $(this);
                var currentMenuId = $navEl.find('.mln__child__collapse').first().attr('id');
                var nextCollapseHelper = $navEl.find('.mln__child__collapse__helper').first();
                var menuSectionLink = $navEl.find(' > .mln__child-controls > a');
                var menuSectionLabel = menuSectionLink.html();
                var backButtonSymbol = (settings.backButtonSymbol) ? '<span aria-hidden="true">' + settings.backButtonSymbol + '</span> ' : '';
                var backButtonText = (menuSectionLink.attr('data-mln-not-linkable') || settings.dynamicBackButtonTitle) ? backButtonSymbol + menuSectionLink.text() : backButtonSymbol + 'Back';

                $('<div>')
                    .addClass('mln__slide-over-controls')
                    .prependTo(nextCollapseHelper);
                    
                $('<button>')
                    .addClass('mln__back-btn')
                    .attr('type', 'button')
                    .attr('aria-controls', currentMenuId)
                    .html(backButtonText)
                    .prependTo($navEl.find('.mln__slide-over-controls'));
                    
                // Build slide title no link
                if (settings.slideTitles && !settings.slideTitleLink) {
                    $('<span>')
                        .addClass('mln__slide-over-title')
                        .html(menuSectionLabel)
                        .appendTo($navEl.find('.mln__slide-over-controls'));
                }
                
                // Build slide title with link
                if (settings.slideTitles && settings.slideTitleLink) {
                    menuSectionLink
                        .clone()
                        .addClass('mln__slide-over-title')
                        .removeClass('mln__toggle-link')
                        .removeAttr('role aria-expanded aria-controls')
                        .find('.mln__toggle-indicator')
                        .remove()
                        .end()
                        .appendTo($navEl.find('.mln__slide-over-controls'));
                }

                $navEl
                    .find('.mln__back-btn')
                    .first()
                    .on('click', function(){
                        $navEl
                            .find('.mln__toggle-btn[aria-controls="' + currentMenuId + '"], .mln__toggle-link[aria-controls="' + currentMenuId + '"]')
                            .trigger('click');
                    });
            });
            
            // Set dynamic height when mln events fire
            $slideOverNav.on('show.mln.child', function() {
                if ($slideOverNav.hasClass('mln--navbar-slide-over') && mlnViewport().width < mlnDataBreakpoint || mlnDataBreakpoint === undefined) {
                    setDynamicHeight($slideOverNav);
                }
            }).on('hide.mln.child', function() {
                if ($slideOverNav.hasClass('mln--navbar-slide-over') && mlnViewport().width < mlnDataBreakpoint || mlnDataBreakpoint === undefined) {
                    setDynamicHeight($slideOverNav);
                }
            }).on('shown.mln.child', function(){
                var latestNavShowing = $slideOverNav.find('.mln__has-child--showing')
                    .last()
                    .addClass('mln__has-child--active')
                    .find('.mln__child__collapse')
                    .first();
                
                slideOverKeyboardTrap(latestNavShowing);
            });  
            
            // Remove dynamic height on navbar after resize
            $(window).on('mlnResizeEnd', function () {
                if ($slideOverNav.hasClass('mln--navbar-slide-over') && mlnViewport().width > mlnDataBreakpoint) {
                    $slideOverNav.css('min-height', '');
                } else {
                    setDynamicHeight($slideOverNav);
                }
            });
                                    
            // Close all menus when closing off canvas
            if (settings.offCanvasCloseAllMenus) {
                $('.toggle-off-canvas').one('click', function() {
                    var $toggleButton = $(this);
                                    
                    if ($toggleButton.attr('aria-expanded') === 'true') {
                        $(document).on('hidden.offCanvas', function() {
                            closeAllChildren();
                        });
                    }
                });    
            }
            
            setDynamicHeight($(this));
        });
    };
}(jQuery));
//# sourceMappingURL=multilevel-nav-slide-over.js.map

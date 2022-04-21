/*!
  * Multilevel nav v3.4.1
  */
  
var mlnCurrent = 1;

// Get browser width with or without scrollbar
function mlnViewport() {
    var view = window;
    var viewString = 'inner';

    if (!('innerWidth' in window)) {
        viewString = 'client';
        view = document.documentElement || document.body;
    }

    return {
        width: view[viewString + 'Width'],
        height: view[viewString + 'Height']
    };
}

(function ($) {
    'use strict';
    
    // Global plugin variables
    var $document = $(document);
    var $body = $('body');
    var $window = $(window);
    
    // Resize delay
    var windowWidth = $window.width();
    $window.resize(function () {
        var newWindowWidth = $window.width();

        if (windowWidth !== newWindowWidth) {
            if (this.resizeTO) {
                clearTimeout(this.resizeTO);
            }
            this.resizeTO = setTimeout(function () {
                $(this).trigger($.Event('mlnResizeEnd'));
            }, 150);
        }
        windowWidth = newWindowWidth;
    });
      
    $.fn.multilevelNav = function (options) {
        $(this).each(function () {
            var $mln = $(this);
            var mlnParentList = $('.mln__list', $mln);
            var mlnExpander = $('.mln__expander', $mln);
            var mlnDataBreakpoint = $mln.attr('data-mln-breakpoint');
            var mlnIsPageLoaded = false;
            var mlnToggleBtnVerbiage = 'Toggle items under';
            var mlnTransitionEnd = 'transitionend';
            var settings;

            // Setting defaults
            settings = $.extend({
                'hoverIntent': false,
                'hoverIntentTimeout': 250,
                'autoCloseNavbarMenus': true,
                'autoDirection': true,
                'toggleOnClickOnly': false,
                'expandActiveItem': false,
                'offCanvasScrollToActiveItem': false,
                'wholeLinkToggler': false,
                'topLevelWholeLinkToggler': false,
                'navbarMenuBackdrop': false,
                'navbarMegaMenuBackdrop': false,
                'activeSelector': '.active',
                'menuCloseOnInPageAnchorClick': false,
                'expanderCloseOnInPageAnchorClick': false,
                'autoCloseInactiveMenu': true,
                'excludeLevel': '-1',
                'childMenuTogglerSymbol': '<span class="mln__toggle-btn__chevron"></span>',
                'keepMenuOpenOnFocusOut': false
            }, options);

            // Show/hide menu(s)
            function mlnToggleChild(el, action, animate) {
                var collapseHeight = 0;
                var mlnHasChild = el.closest('.mln__has-child');
                var mlnChildToggler = mlnHasChild.find('.mln__toggle-btn, .mln__toggle-link').first();
                var mlnToggleChildCollapse = mlnHasChild.find('> .mln__child__collapse').first();
                var ariaExpandedValue;
                var ariaHiddenValue;
                var mlnAnyShowing;

                // Figure out what aria values to use
                if (action === 'show') {
                    ariaExpandedValue = 'true';
                    ariaHiddenValue = 'false';
                } else if (action === 'hide' || action === undefined) {
                    ariaExpandedValue = 'false';
                    ariaHiddenValue = 'true';
                }
                
                mlnHasChild.trigger($.Event('transition.mln.child'));

                // Correct toggler attributes
                mlnChildToggler.attr('aria-expanded', ariaExpandedValue);

                // Grab height of inner collapse elements
                collapseHeight = $('.mln__child__collapse__helper', mlnToggleChildCollapse).outerHeight();

                // Show collapsible child elements
                if (action === 'show') {
                    mlnHasChild.addClass('mln__has-child--showing');

                    mlnAnyShowing = $mln.find('.mln__has-child--showing');

                    // Add class to body for regular menu backdrop
                    if (
                        mlnAnyShowing.length && $mln.hasClass('mln--navbar') &&
                        settings.navbarMenuBackdrop === true
                    ) {
                        $body.addClass('js-mln-menu-showing');
                    }

                    // Add class to body for mega menu backdrop
                    if (
                        mlnHasChild.hasClass('mln__has-child--mega-menu') &&
                        $mln.hasClass('mln--navbar') &&
                        settings.navbarMegaMenuBackdrop === true
                    ) {
                        $body.addClass('js-mln-mega-menu-showing');
                    }
                    
                    mlnHasChild.trigger($.Event('show.mln.child'));

                    if (animate === true) {
                        mlnToggleChildCollapse
                            .addClass('mln__child--transitioning')
                            .css('height', collapseHeight + 'px')
                            .attr('aria-hidden', ariaHiddenValue)
                            .one(mlnTransitionEnd, function () {
                                mlnToggleChildCollapse
                                    .css('height', 'auto')
                                    .removeClass('mln__child--transitioning')
                                    .css('height', '');
                                
                                if (mlnToggleChildCollapse.attr('aria-hidden') === 'false') {
                                    mlnToggleChildCollapse.addClass('mln--height-auto');
                                    mlnToggleChildCollapse.addClass('mln__child--overflow-visible');
                                }
                                
                                mlnHasChild
                                    .trigger($.Event('shown.mln.child'))
                                    .trigger($.Event('transitioned.mln.child'));
                            });
                    } else {
                        mlnToggleChildCollapse
                            .css('height', 'auto')
                            .addClass('mln--height-auto')
                            .attr('aria-hidden', ariaHiddenValue)
                            .css('height', '')
                            .addClass('mln__child--overflow-visible');
                            
                        mlnHasChild
                            .trigger($.Event('shown.mln.child'))
                            .trigger($.Event('transitioned.mln.child'));
                    }
                }

                // Hide collapsible child elements
                if (action === 'hide') {
                    mlnHasChild.removeClass('mln__has-child--showing');

                    mlnAnyShowing = $('.mln--navbar').find('.mln__has-child--showing');

                    if (
                        !mlnAnyShowing.length &&
                        $('.mln--navbar').length
                    ) {
                        $body.removeClass('js-mln-menu-showing');
                    }

                    if (
                        mlnHasChild.hasClass('mln__has-child--mega-menu') &&
                        !$('.mln__has-child--mega-menu').hasClass('mln__has-child--showing') &&
                        $mln.hasClass('mln--navbar')
                    ) {
                        $body.removeClass('js-mln-mega-menu-showing');
                    }
                    
                    mlnHasChild.trigger($.Event('hide.mln.child'));
                    
                    if (animate === true) {
                        mlnToggleChildCollapse
                            .css({
                                'height': collapseHeight,
                                'min-height': collapseHeight
                            })
                            .removeClass('mln__child--overflow-visible mln--height-auto')
                            .attr('aria-hidden', ariaHiddenValue)
                            .addClass('mln__child--transitioning');
                        
                        setTimeout(function(){
                            mlnToggleChildCollapse.css({
                                'height': '',
                                'min-height': ''
                            }).one(mlnTransitionEnd, function () {  
                                mlnToggleChildCollapse.removeClass('mln__child--transitioning');                              
                                mlnHasChild
                                    .trigger($.Event('hidden.mln.child'))
                                    .trigger($.Event('transitioned.mln.child'));
                            }).children().on(mlnTransitionEnd, function () {
                                return false;
                            });
                        }, 30);
                    } else {
                        mlnToggleChildCollapse
                            .removeClass('mln__child--overflow-visible mln--height-auto')
                            .attr('aria-hidden', ariaHiddenValue)
                            .css('height', '');
                        mlnHasChild
                            .trigger($.Event('hidden.mln.child'))
                            .trigger($.Event('transitioned.mln.child'));
                    }
                }
            }

            // Show/hide expander items
            function mlnToggleExpander(animate) {
                var collapseHeight = 0;
                var collapseHelper = $('.mln__expander__helper', $mln);

                if (animate !== false) {
                    collapseHeight = collapseHelper.outerHeight();

                    if (!mlnExpander.hasClass('mln__expander--showing')) {
                        
                        mlnExpander.trigger($.Event('showing.mln.expander'));
                        
                        mlnExpander
                            .addClass('mln__expander--transitioning')
                            .css('height', collapseHeight)
                            .attr('aria-hidden', 'false')
                            .parent()
                            .find('.mln__expand-btn')
                            .attr('aria-expanded', 'true');

                        mlnExpander
                            .one(mlnTransitionEnd, function () {
                                $(this)
                                    .css('height', 'auto')
                                    .css('height', '')
                                    .addClass('mln__expander--showing')
                                    .removeClass('mln__expander--transitioning');
                                mlnExpander.trigger($.Event('shown.mln.expander'));
                            }).children().on(mlnTransitionEnd, function () {
                                return false;
                            });
                    } else {
                        mlnExpander.trigger($.Event('hiding.mln.expander'));
                        mlnExpander
                            .addClass('mln__expander--transitioning')
                            .css('height', collapseHeight)
                            .attr('aria-hidden', 'true')
                            .parent()
                            .find('.mln__expand-btn')
                            .attr('aria-expanded', 'false');

                        setTimeout(function () {
                            mlnExpander
                                .removeClass('mln__expander--showing')
                                .css('height', '');
                        }, 10);

                        mlnExpander
                            .one(mlnTransitionEnd, function () {
                                $(this).removeClass('mln__expander--transitioning');
                                mlnExpander.trigger($.Event('hidden.mln.expander'));
                            }).children().on(mlnTransitionEnd, function () {
                                return false;
                            });
                    }
                }

                // Adjust attributes without animating the expander menu
                if (animate === false && $mln.closest('.mln--navbar').length) {
                    if (mlnViewport().width < mlnDataBreakpoint) {
                        mlnExpander
                            .removeClass('mln__expander--showing')
                            .attr('aria-hidden', 'true')
                            .parent().find('.mln__expand-btn')
                            .attr('aria-expanded', 'false');
                    } else {
                        mlnExpander
                            .attr('aria-hidden', 'false')
                            .parent().find('.mln__expand-btn')
                            .attr('aria-expanded', 'true');
                    }
                }

                if (animate === false && $mln.hasClass('mln--expand-above-breakpoint')) {
                    if (mlnViewport().width < mlnDataBreakpoint) {
                        mlnExpander
                            .removeClass('mln__expander--showing')
                            .attr('aria-hidden', 'true')
                            .parent().find('.mln__expand-btn')
                            .attr('aria-expanded', 'false');
                    } else {
                        mlnExpander
                            .addClass('mln__expander--showing')
                            .attr('aria-hidden', 'false')
                            .parent().find('.mln__expand-btn')
                            .attr('aria-expanded', 'true');
                    }
                }
            }

            // Assign class to child items that run off the edge of the screen
            function assignFlowDirection() {
                if (settings.autoDirection === true) {
                    setTimeout(function () {
                        hasChild.each(function () {
                            var $hasChild = $(this);
                            var mlnToggleChildOffset = ($hasChild.offset().left - $body.offset().left) + ($hasChild.outerWidth() * 2);

                            if (mlnToggleChildOffset > mlnViewport().width && mlnViewport().width >= mlnDataBreakpoint) {
                                $hasChild.addClass('mln__child--flow-right');
                            } else {
                                $hasChild.removeClass('mln__child--flow-right');
                            }
                        });
                    }, 300);
                }
            }

            // Keep items and parents with active class expanded on load
            function expandActiveItem() {
                if (settings.expandActiveItem === true) {
                    var activeSelector = settings.activeSelector;

                    $(activeSelector, mlnParentList).each(function () {
                        var $activeItem = $(this);

                        $activeItem
                            .addClass('mln__has-child--expand-on-load')
                            .parents('.mln__has-child')
                            .last()
                            .addClass('mln__has-child--expand-on-load')
                            .end()
                            .parents('.mln__has-child.mln__has-child')
                            .addClass('mln__has-child--expand-on-load');
                    });

                    $('.mln__has-child--expand-on-load', mlnParentList).each(function () {
                        if (
                            !mlnIsPageLoaded || mlnParentList.closest($mln).hasClass('mln--navbar') &&
                            mlnViewport().width < mlnDataBreakpoint &&
                            !mlnIsPageLoaded
                        ) {
                            mlnToggleChild($(this), 'show', false);
                        }

                        if (
                            mlnParentList.closest($mln).hasClass('mln--navbar') &&
                            mlnViewport().width >= mlnDataBreakpoint
                        ) {
                            mlnToggleChild($(this), 'hide',  false);
                        }
                    });
                    
                    if (settings.offCanvasScrollToActiveItem === true) {
                        var lastActiveItem = $mln.find(settings.activeSelector).last();
                        if (lastActiveItem.length) {
                            var scrollToLoc = lastActiveItem.position().top;
                                                                    
                            $('#offCanvasArea').animate({
                                scrollTop: scrollToLoc
                            }, 1);
                        }
                        setTimeout(function(){
                            $body.addClass('js-off-canvas-scrolled');
                        }, 2);
                    }

                    mlnIsPageLoaded = true;
                }
            }

            // Start modifying the DOM
            if (mlnParentList.length) {

                // Add helper div inside expander
                mlnExpander.wrapInner('<div class="mln__expander__helper"></div>');

                // Open/close menu expander
                var expanderButton = $('.mln__expand-btn', $mln);
                expanderButton.on('click', function () {
                    mlnToggleExpander();
                });

                // Add depth class to nested list items
                var nestedLi = $('li:not(.mln__child__mega-menu li)', mlnParentList);
                nestedLi.each(function () {
                    var $li = $(this);
                    var levelClass = 'mln__level-' + ($li.parents('li').length + 1);

                    $li.addClass(levelClass);
                });

                // Find and modify mega menus
                mlnParentList
                    .find('.mln__child__mega-menu')
                    .wrap('<div class="mln__child__collapse" tabindex="-1"></div>')
                    .wrap('<div class="mln__child__collapse__helper"></div>')
                    .closest('li')
                    .addClass('mln__has-child');

                // Add mega menu backdrop
                if (settings.navbarMegaMenuBackdrop === true && !$('.mln-backdrop').length) {
                    $body.append('<div class="mln-backdrop"></div>');
                }

                // Find and modify child lists
                mlnParentList
                    .find('ul')
                    .not('.mln__level-' + settings.excludeLevel +' > ul')
                    .not('.mln__level-' + settings.excludeLevel +' > ul ul')
                    .each(function () {
                        var $parentList = $(this);

                        if ($parentList.siblings('.mln__child__collapse').length) {
                            var parentCollapse = $parentList.parent()
                                .find('.mln__child__collapse__helper');

                            $parentList
                                .addClass('mln__child__list')
                                .prependTo(parentCollapse);

                        } else if (!$parentList.closest('.mln__child__mega-menu').length) {
                            $parentList
                                .addClass('mln__child__list')
                                .wrap('<div class="mln__child__collapse" tabindex="-1"></div>')
                                .wrap('<div class="mln__child__collapse__helper"></div>')
                                .closest('li')
                                .addClass('mln__has-child');
                        }
                    });

                // Add mega menu modifier class to top level
                var megaMenu = $('.mln__child__mega-menu', mlnParentList);
                megaMenu.each(function () {
                    $(this)
                        .closest('li')
                        .addClass('mln__has-child--mega-menu');
                });

                // Wrap the parent <a> tag in it's own div
                var hasChild = $('.mln__has-child', mlnParentList);
                hasChild.each(function () {
                    $(this)
                        .find('> a')
                        .wrap('<div class="mln__child-controls"></div>');
                });

                // Add a toggle button to list items with children
                var childNav = $('.mln__child-controls', mlnParentList);
                childNav.each(function () {
                    var $childNav = $(this);
                    var linkText= $childNav.find('> a').text();
                    var ariaLabelValue = mlnToggleBtnVerbiage + ' ' + linkText;

                    $('<button></button>')
                        .addClass('mln__toggle-btn')
                        .attr('type', 'button')
                        .attr('aria-label', ariaLabelValue)
                        .html(settings.childMenuTogglerSymbol)
                        .appendTo($childNav);
                });

                // Assign IDs and attributes to child menu elements
                var childCollapse = $('.mln__child__collapse', mlnParentList);
                childCollapse.each(function (index) {
                    var $childCollapseId = 'mln' + mlnCurrent + 'ChildCollapse' + (index + 1);

                    $(this)
                        .attr('aria-hidden', 'true')
                        .attr('data-mln-active-status', 'off')
                        .attr('id', $childCollapseId)
                        .parent()
                        .find('.mln__toggle-btn')
                        .attr('aria-expanded', 'false')
                        .attr('aria-controls', $childCollapseId);
                });

                // Assign IDs and aria attributes to expander elements
                mlnExpander.each(function (index) {
                    var $mlnExpanderId = 'mln' + mlnCurrent + 'Expander' + (index + 1);

                    $(this)
                        .attr('aria-hidden', 'true')
                        .attr('id', $mlnExpanderId)
                        .parent()
                        .find('.mln__expand-btn')
                        .attr('aria-expanded', 'false')
                        .attr('aria-controls', $mlnExpanderId);
                });

                // Close main nav child menu if in page anchor is clicked
                if (settings.menuCloseOnInPageAnchorClick === true) {
                    $('a', $mln).each(function () {
                        var $anchor = $(this);
                        var firstChar = $anchor.attr('href').charAt(0);
                        var pageAnchor = ((firstChar === '#') ? true : false);

                        $anchor.on('click', function (e) {
                            if (
                                pageAnchor &&
                                !$(e.target).closest('.mln__toggle-link').length &&
                                mlnViewport().width >= mlnDataBreakpoint
                            ) {
                                mlnToggleChild($('.mln__has-child--showing', $mln), 'hide', true);
                            }
                        });
                    });
                }

                // Close expander if in page anchor is clicked
                if (settings.expanderCloseOnInPageAnchorClick === true) {
                    $('a', $mln).each(function () {
                        var $anchor = $(this);
                        var firstChar = $anchor.attr('href').charAt(0);
                        var pageAnchor = ((firstChar === '#') ? true : false);

                        $anchor.on('click', function (e) {
                            if (
                                pageAnchor &&
                                !$(e.target).closest('.mln__toggle-link').length
                            ) {
                                mlnToggleExpander('hide');
                            }
                        });
                    });
                }

                // Whole link click expand and/or top level whole link expand
                if (
                    settings.wholeLinkToggler === true ||
                    settings.topLevelWholeLinkToggler === true
                ) {
                    var wholeElement;

                    if (settings.wholeLinkToggler === true) {
                        wholeElement = $('.mln__child-controls > a', mlnParentList);

                        $(mlnParentList)
                            .closest($mln)
                            .addClass('mln--whole-link-expand');
                    }

                    if (settings.topLevelWholeLinkToggler === true) {
                        wholeElement = $('> .mln__has-child', mlnParentList).find('> .mln__child-controls > a') || $('> .mln__has-child', mlnParentList)
                            .siblings('.mln__has-child')
                            .find('> .mln__child-controls > a');

                        $(mlnParentList)
                            .closest($mln)
                            .removeClass('mln--whole-link-expand')
                            .addClass('mln--top-level-whole-link-expand');
                    }

                    wholeElement.each(function () {
                        var $wholeElement = $(this);
                        var closestToggleBtn = $wholeElement.closest('.mln__has-child')
                            .find('.mln__toggle-btn')
                            .first();
                        
                        var ariaExpandedValue = closestToggleBtn.attr('aria-expanded');
                        var ariaControlsValue = closestToggleBtn.attr('aria-controls');

                        $('<span></span>')
                            .addClass('mln__toggle-indicator')
                            .html(settings.childMenuTogglerSymbol)
                            .appendTo($wholeElement);

                        $wholeElement
                            .addClass('mln__toggle-link')
                            .attr('role', 'button')
                            .attr('aria-expanded', ariaExpandedValue)
                            .attr('aria-controls', ariaControlsValue)
                            .on('click', function (e) {
                                $wholeElement.focus();
                                e.preventDefault();
                            });

                        closestToggleBtn.remove();
                    });
                }

                // Toggle-button click
                var toggleButton = $('.mln__toggle-btn, .mln__toggle-link', mlnParentList);
                var touchDrag = false;

                // Checking touchmove/touchend and applying a hack to get the
                // toggle button to work on first click for iOS
                toggleButton.on('touchmove', function () {
                    touchDrag = true;
                }).on('touchend click', function (e) {

                    // Prevent first click focus on iOS
                    e.stopPropagation();
                    e.preventDefault();

                    var $toggleButton = $(this);
                    var hasChildParent = $toggleButton.closest('.mln__has-child');
                    var associatedMenu = $toggleButton.closest(hasChildParent)
                            .find('.mln__child__collapse')
                            .first();
                    var hasChildSiblings = hasChildParent.parent()
                            .find('.mln__has-child--showing')
                            .not(hasChildParent);

                    if (
                        e.type === 'click' ||
                        e.type === 'touchend' &&
                        !touchDrag &&
                        !$mln.find('.mln__has-child--showing.mln__child--transitioning').length
                    ) {
                        if (
                            mlnViewport().width >= mlnDataBreakpoint &&
                            settings.autoCloseNavbarMenus === true &&
                            !$toggleButton.closest($mln).hasClass('mln--expand-above-breakpoint') &&
                            $toggleButton.closest($mln).hasClass('mln--navbar')
                        ) {
                            associatedMenu.attr('data-mln-active-status', 'off');
                            mlnToggleChild(hasChildSiblings, 'hide', true);
                        }

                        if ($toggleButton.closest('.mln__has-child').hasClass('mln__has-child--showing')) {
                            mlnToggleChild($toggleButton, 'hide', true);
                            associatedMenu.attr('data-mln-active-status', 'off');
                        } else {
                            mlnToggleChild($toggleButton, 'show', true);
                            associatedMenu.attr('data-mln-active-status', 'on');
                        }
                    }

                    touchDrag = false;
                });

                // Show/hide child menus with hoverIntent or just regular hover
                if (
                    settings.hoverIntent === true &&
                    settings.toggleOnClickOnly === false
                ) {
                    hasChild.each(function () {
                        var $hasChild = $(this);
                        var associatedMenu = $hasChild.find('.mln__child__collapse').first();

                        $hasChild.hoverIntent({
                            over: function () {
                                associatedMenu.attr('data-mln-active-status', 'on');
                                if (
                                    mlnViewport().width >= mlnDataBreakpoint &&
                                    $hasChild.closest('.mln--navbar').length
                                ) {
                                    mlnToggleChild($hasChild, 'show', true);
                                }
                            },
                            timeout: settings.hoverIntentTimeout,
                            out: function () {
                                associatedMenu.attr('data-mln-active-status', 'off');
                                if (
                                    mlnViewport().width >= mlnDataBreakpoint &&
                                    associatedMenu.attr('aria-hidden') === 'false' &&
                                    $hasChild.closest('.mln--navbar').length
                                ) {
                                    mlnToggleChild($hasChild, 'hide', true);
                                }
                            },
                            delay: settings.hoverIntentTimeout
                        });
                    });
                } else if (settings.toggleOnClickOnly === false) {
                    hasChild.each(function () {
                        var $hasChild = $(this);
                        var associatedMenu = $hasChild.find('.mln__child__collapse').first();

                        $hasChild.hover(function () {
                            if (
                                mlnViewport().width >= mlnDataBreakpoint &&
                                $hasChild.closest('.mln--navbar').length
                            ) {
                                if ($(this).closest('.mln__has-child').hasClass('mln__has-child--showing')) {
                                    associatedMenu.attr('data-mln-active-status', 'off');
                                    mlnToggleChild($(this), 'hide', true);
                                } else {
                                    associatedMenu.attr('data-mln-active-status', 'on');
                                    mlnToggleChild($(this), 'show', true);
                                }
                            }
                        });
                    });
                }

                // Keyboarding
                mlnParentList.each(function () {
                    var $mlnParentList = $(this);
                    var isCurrentMenuFocused;
                    var isCurrentMlnList;

                    $mlnParentList.on('keydown', function (e) {
                        var pressedKeyCode = e.keyCode;
                        var eTarget = $(e.target);

                        // Escape key pressed
                        if (pressedKeyCode === 27) {
                            var associatedMenu = eTarget.closest('.mln__has-child--showing');

                            // Set focus on parent toggle button
                            if (associatedMenu.length) {
                                associatedMenu
                                    .closest('.mln__has-child')
                                    .find('.mln__toggle-btn, .mln__toggle-link')
                                    .get(0)
                                    .focus();

                                // Hide associated or closest parent menu
                                mlnToggleChild(associatedMenu, 'hide', true);
                            }
                        }

                        // Prevent tabbing into closing menu
                        if (
                            pressedKeyCode === 9 &&
                            eTarget.attr('aria-expanded') ==='false' &&
                            eTarget.parent().siblings('.mln__child__collapse').hasClass('mln__child--transitioning')
                        ) {
                            var nextFocusableAnchor = eTarget.closest('.mln__has-child').next().find('a').first();
                                                        
                            if (!nextFocusableAnchor.length) {
                                nextFocusableAnchor = eTarget.closest('.mln__level-1').next().find('a').first();
                                $('.mln__has-child--showing', $mln).each(function(){
                                    mlnToggleChild($(this), 'hide', true);
                                });
                            }
                            e.preventDefault();
                            nextFocusableAnchor.focus();
                        }
                    });

                    // Close inactive menus when tabbing out of them
                    $mlnParentList.on('keyup', function(e){
                        var eTarget = $(e.target);
                        
                        if (
                            !eTarget.closest('.mln__has-child--showing').length &&
                            mlnViewport().width >= mlnDataBreakpoint &&
                            settings.autoCloseInactiveMenu === true &&
                            eTarget.closest('.mln--navbar').length
                        ) {                            
                            $('.mln__has-child--showing', $mln).each(function(){
                                mlnToggleChild($(this), 'hide', true);
                            });
                        }
                    });

                    // Close any menu when leaving currently focused menu parent
                    if (!settings.keepMenuOpenOnFocusOut) {
                        $mlnParentList.on('focusout', function (e) {
                            setTimeout(function () {
                                if (mlnViewport().width >= mlnDataBreakpoint) {
                                    var nonActiveMenus = $('.mln--navbar:not(:has(:focus))');
                                    $('.mln__has-child--showing', nonActiveMenus ).each(function(){
                                        mlnToggleChild($(this), 'hide', true);
                                    });
                                }
    
                                isCurrentMenuFocused = ( $(document.activeElement).closest('.mln--navbar').length && $(document.activeElement).closest('.mln__list').length ) ? true : false;
                                
                                if (
                                    isCurrentMenuFocused === false &&
                                    mlnViewport().width >= mlnDataBreakpoint &&
                                    e.type !== 'keydown' &&
                                    settings.autoCloseNavbarMenus === true &&
                                    $(e.target).closest('.mln--navbar').length &&
                                    !$(e.target).closest('.mln__has-child--showing').length
                                ) {
                                    mlnToggleChild($('.mln__has-child--showing', $mln), 'hide', true);
                                }
                            }, 150);
                        });
                    }
                });
                
                // Add special class to the current showing menu
                $mln.on('transition.mln.child', function() {
                    $mln
                        .find('.mln__visible-menu')
                        .removeClass('mln__visible-menu');
                }).on('hide.mln.child show.mln.child initialized.mln', function() {
                    if (!$mln.find('.mln__has-child--showing').length) {
                        $mln
                            .find('.mln__list')
                            .addClass('mln__visible-menu');
                    } else {
                        $mln.find('.mln__has-child--showing')
                            .last()
                            .addClass('mln__visible-menu');                        
                    }
                });


                // Resizer
                $window.on('mlnResizeEnd', function () {
                    if (
                        mlnViewport().width >= mlnDataBreakpoint &&
                        settings.autoCloseNavbarMenus === true &&
                        settings.expandActiveItem === false
                    ) {
                        mlnToggleChild($('.mln__has-child--showing', $mln), 'hide', false);
                        mlnExpander
                            .css('height', '')
                            .removeClass('mln__expander--showing');
                    }

                    // Run functions after resize
                    expandActiveItem();
                    mlnToggleExpander(false);
                    assignFlowDirection();
                });

                // Run functions on load
                expandActiveItem();
                mlnToggleExpander(false);
                assignFlowDirection();
                
                // Add loaded class
                $mln.addClass('mln--js-loaded');
            }
            $mln.trigger($.Event('initialized.mln'));
            mlnCurrent++;
        });
    };
}(jQuery));
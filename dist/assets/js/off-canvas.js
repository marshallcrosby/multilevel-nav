(function() {
    'use strict';

    // Global variables
    const document = window.document;
    const body = document.body;
    const toggleBtns = document.querySelectorAll('.toggle-off-canvas');
    const offCanvasElement = document.querySelector('.l-off-canvas');
    const offCanvasContent = document.querySelector('.l-header');
    const offCanvasCanvas = document.querySelector('.l-canvas');
    const headerHeight = offCanvasContent ? offCanvasContent.offsetHeight : 0;
    let docScrollLoc = 0;
    let currentLoc = 0;
    let focusBeforeOffCanvas;
    let tapping = false;
    let touchStartX;
    const offCanvasBreakpoint = body.getAttribute('data-off-canvas-breakpoint');
    
    // Custom event creator
    function createCustomEvent(name, detail = null) {
        return new CustomEvent(name, {
            bubbles: true,
            cancelable: true,
            detail: detail
        });
    }

    // Resize delay implementation
    let windowWidth = window.innerWidth;
    let resizeTimeout;
    
    window.addEventListener('resize', function() {
        const newWindowWidth = window.innerWidth;

        if (windowWidth !== newWindowWidth) {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(function() {
                window.dispatchEvent(createCustomEvent('ocResizeEnd'));
            }, 150);
        }
        windowWidth = newWindowWidth;
    });

    // Get browser width with or without scrollbar
    function viewport() {
        let view = window;
        let viewString = 'inner';

        if (!('innerWidth' in window)) {
            viewString = 'client';
            view = document.documentElement || document.body;
        }

        return {
            width: view[viewString + 'Width'],
            height: view[viewString + 'Height']
        };
    }

    // Check for specific user agent strings
    function agentHas(keyword) {
        return navigator.userAgent.toLowerCase().search(keyword.toLowerCase()) > -1;
    }
    
    // Safari detection
    function isSafari() {
        return (!!window.ApplePaySetupFeature || !!window.safari) && 
               agentHas('Safari') && !agentHas('Chrome') && !agentHas('CriOS');
    }

    // Add iOS class if using Safari
    if (isSafari()) {
        body.classList.add('is-ios');
    }

    /**
     * Trap keyboard focus within the off-canvas menu when it's open
     */
    function trapKeyboardToOC() {
        // Store the element that had focus before opening
        focusBeforeOffCanvas = document.activeElement;

        // Find all focusable elements within the off-canvas
        const tabbable = Array.from(offCanvasElement.querySelectorAll(
            'a[href], area[href], input:not([disabled]), select:not([disabled]), ' +
            'textarea:not([disabled]), button:not([disabled]), iframe, object, ' +
            'embed, [tabindex="0"], [contenteditable]'
        ));

        const firstTabbable = tabbable[0];
        const lastTabbable = tabbable[tabbable.length - 1];

        // Set focus on first input or active menu item
        const mlnActive = document.querySelector('.mln__list .active:last-child');
        
        if (!mlnActive) {
            firstTabbable && firstTabbable.focus();
        }
        
        // Handle escape key to close menu
        const keydownHandler = function(e) {
            const childShowingAmount = offCanvasElement.querySelectorAll('.mln__child--transitioning').length;

            if (e.key === 'Escape' && !childShowingAmount) {
                e.preventDefault();
                toggleOffCanvas('hide');
            }
        };
        
        offCanvasElement.addEventListener('keydown', keydownHandler);

        // Redirect last tab to first input
        lastTabbable && lastTabbable.addEventListener('keydown', function(e) {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                firstTabbable && firstTabbable.focus();
            }
        });

        // Redirect first shift+tab to last input
        firstTabbable && firstTabbable.addEventListener('keydown', function(e) {
            if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                lastTabbable && lastTabbable.focus();
            }
        });

        // Focus on the off canvas element
        offCanvasElement.focus();
    }

    /**
     * Toggle the off-canvas menu visibility
     * @param {string} action - 'show', 'hide', or undefined to toggle
     */
    function toggleOffCanvas(action) {
        if (!offCanvasElement) return;
        
        docScrollLoc = window.pageYOffset || document.documentElement.scrollTop;

        // Close off canvas
        if (body.classList.contains('js-off-canvas-showing') || action === 'undefined' || action === 'hide') {   
            document.dispatchEvent(createCustomEvent('hide.offCanvas'));
            
            body.classList.remove('js-off-canvas-showing');

            // iOS Safari scroll canvas to the original canvas position
            if (isSafari() && body.classList.contains('has-header-fixed')) {
                offCanvasCanvas.style.top = '';

                document.documentElement.style.scrollBehavior = 'auto';
                document.body.style.scrollBehavior = 'auto';
                
                window.scrollTo({
                    top: currentLoc,
                    behavior: 'auto'
                });
                
                document.documentElement.style.scrollBehavior = '';
                document.body.style.scrollBehavior = '';
            }

            // After off canvas is hidden
            const slideOver = document.querySelector('.slide-over-transition');
            if (slideOver) {
                const transitionHandler = function(e) {
                    if (e.target !== slideOver) return;
                    
                    if(!body.classList.contains('js-off-canvas-showing')) {
                        offCanvasElement.classList.add('js-l-off-canvas-hide');
                    }
                    
                    document.dispatchEvent(createCustomEvent('hidden.offCanvas'));
                    slideOver.removeEventListener('transitionend', transitionHandler);
                };
                
                slideOver.addEventListener('transitionend', transitionHandler);
                
                // Prevent event bubbling from children
                Array.from(slideOver.children).forEach(child => {
                    child.addEventListener('transitionend', e => e.stopPropagation());
                });
            }

            // Update aria-expanded attribute on all toggle buttons
            toggleBtns.forEach(btn => {
                btn.setAttribute('aria-expanded', 'false');
            });

            // Restore focus to the element that had it before
            if (focusBeforeOffCanvas) {
                focusBeforeOffCanvas.focus();
            }

        } else if (!body.classList.contains('js-off-canvas-showing') || action === 'show') {
            // Open off canvas
            document.dispatchEvent(createCustomEvent('show.offCanvas'));
            
            offCanvasElement.classList.remove('js-l-off-canvas-hide');

            // iOS Safari set location of canvas so the user doesn't lose where they are
            if (isSafari() && body.classList.contains('has-header-fixed')) {
                offCanvasCanvas.style.top = `${-(docScrollLoc - headerHeight)}px`;
            }

            body.classList.add('js-off-canvas-showing');
            currentLoc = docScrollLoc;

            // Update aria-expanded attribute on all toggle buttons
            toggleBtns.forEach(btn => {
                btn.setAttribute('aria-expanded', 'true');
            });
            
            const slideOver = document.querySelector('.slide-over-transition');
            if (slideOver) {
                const transitionHandler = function(e) {
                    if (e.target !== slideOver) return;
                    
                    trapKeyboardToOC();
                    document.dispatchEvent(createCustomEvent('shown.offCanvas'));
                    slideOver.removeEventListener('transitionend', transitionHandler);
                };
                
                slideOver.addEventListener('transitionend', transitionHandler);
                
                // Prevent event bubbling from children
                Array.from(slideOver.children).forEach(child => {
                    child.addEventListener('transitionend', e => e.stopPropagation());
                });
            } else {
                // If no transition element, just trap the keyboard
                trapKeyboardToOC();
                document.dispatchEvent(createCustomEvent('shown.offCanvas'));
            }
        }
    }

    /**
     * Set the height of the off-canvas element based on content
     */
    function setOffCanvasHeight() {
        if (!body.classList.contains('has-header-fixed') && offCanvasElement) {
            const offCanvasHelper = document.querySelector('.l-off-canvas__helper');
            const surround = document.querySelector('.l-surround');
            
            if (!offCanvasHelper || !surround) return;
            
            const offCanvasHeight = offCanvasHelper.offsetHeight;
            const surroundHeight = surround.offsetHeight;
            const setHeight = (offCanvasHeight >= surroundHeight) ? offCanvasHeight : surroundHeight;

            setTimeout(function() {
                if (viewport().width < offCanvasBreakpoint) {
                    offCanvasElement.style.minHeight = `${setHeight}px`;
                } else {
                    offCanvasElement.style.minHeight = '';
                }
            }, 300);
        }
    }

    // Create overlay that covers page content when off-canvas is active
    function createOverlay() {
        const surround = document.querySelector('.l-surround');
        if (!surround) return;
        
        const overlay = document.createElement('div');
        overlay.classList.add('l-off-canvas-overlay');
        surround.prepend(overlay);
        
        // Add click handler to close menu when overlay is clicked
        overlay.addEventListener('click', function() {
            toggleOffCanvas('hide');
        });
    }
    
    // Initialize overlay
    createOverlay();

    // Touch event handling
    body.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
    });

    // Handle touch movement to close the menu with swipe
    body.addEventListener('touchmove', function(e) {
        if (!e.changedTouches || !e.changedTouches[0]) return;
        
        const touchRight = e.changedTouches[0].clientX;
        const offCanvasShowing = body.classList.contains('js-off-canvas-showing');
        const isRightAligned = body.classList.contains('off-canvas-right');

        // Left swipe on left-aligned menu
        if (touchStartX - 200 > touchRight && 
            offCanvasShowing && 
            !isRightAligned && 
            !tapping) {
            toggleOffCanvas('hide');
        } 
        // Right swipe on right-aligned menu
        else if (touchStartX + 200 < touchRight && 
            offCanvasShowing && 
            isRightAligned && 
            !tapping) {
            toggleOffCanvas('hide');
        }
    });

    // Set up toggle button click handler
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            toggleOffCanvas();
        });
    });

    // Initialize on window load
    window.addEventListener('load', function() {
        setOffCanvasHeight();
        
        if (offCanvasElement) {
            offCanvasElement.classList.add('js-l-off-canvas-hide');
            
            // Add keyboard trap element
            const tabFix = document.createElement('span');
            tabFix.classList.add('js-tabfix');
            tabFix.tabIndex = 0;
            tabFix.setAttribute('aria-hidden', 'true');
            offCanvasElement.appendChild(tabFix);
        }
    });

    // Handle window resize events
    window.addEventListener('ocResizeEnd', function() {
        setOffCanvasHeight();
    });
})();
//# sourceMappingURL=off-canvas.js.map
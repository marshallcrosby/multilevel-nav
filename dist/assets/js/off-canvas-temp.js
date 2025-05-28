/* eslint-env es6 */
(() => {
    'use strict';

    // Off canvas variables
    const document = window.document;
    const body = document.body;
    const toggleBtns = document.querySelectorAll('.toggle-off-canvas');
    const offCanvasBreakpoint = (body.getAttribute('data-off-canvas-breakpoint')) ? parseInt(body.getAttribute('data-off-canvas-breakpoint')) : undefined;
    const offCanvasElement = document.querySelector('.l-off-canvas');
    const offCanvasContent = document.querySelector('.l-header');
    const offCanvasCanvas = document.querySelector('.l-canvas');
    const headerHeight = offCanvasContent ? offCanvasContent.offsetHeight : 0;
    let docScrollLoc = 0;
    let currentLoc = 0;
    let focusBeforeOffCanvas;
    let tapping = false;
    let touchStartX;

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
    let resizeTO;
    
    window.addEventListener('resize', () => {
        let newWindowWidth = window.innerWidth;
        
        if (windowWidth !== newWindowWidth) {
            if (resizeTO) {
                clearTimeout(resizeTO);
            }
            
            resizeTO = setTimeout(() => {
                window.dispatchEvent(createCustomEvent('ocResizeEnd'));
            }, 150);
        }
        
        windowWidth = newWindowWidth;
    });

    // Check for specific user agent strings
    const agentHas = (keyword) => {
        return navigator.userAgent.toLowerCase().search(keyword.toLowerCase()) > -1;
    }
    
    // Safari detection
    const isSafari = () => {
        return (!!window.ApplePaySetupFeature || !!window.safari) && 
               agentHas('Safari') && !agentHas('Chrome') && !agentHas('CriOS');
    }

    // Add iOS class if using Safari
    if (isSafari()) {
        body.classList.add('is-ios');
    }

    const isVisible = (el) => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
    }

    const getTabbableElements = (container) => {
        const tabbableElementsArray = [
            'a[href]',
            'area[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'button:not([disabled])',
            'iframe',
            'object',
            'embed',
            '[tabindex="0"]',
            '[contenteditable]'
        ];

        return Array.from(container.querySelectorAll(tabbableElementsArray)).filter(el => isVisible(el) && el.tabIndex >= 0);
    }

    let keydownHandler = null;

    const trapKeyboardToOC = () => {
        // Save currently focused element to return to it later
        focusBeforeOffCanvas = document.activeElement;

        keydownHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                toggleOffCanvas('hide');
                return;
            }

            if (e.key === 'Tab') {
                const tabbable = getTabbableElements(offCanvasElement);
                const first = tabbable[0];
                const last = tabbable[tabbable.length - 1];

                if (tabbable.length === 0) {
                    e.preventDefault();
                    return;
                }

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        offCanvasElement.addEventListener('keydown', keydownHandler);

        const initialTabbable = getTabbableElements(offCanvasElement)[0];
        
        if (!document.querySelector('.mln__list .active') && initialTabbable) {
            initialTabbable.focus();
        }
    }

    const removeTrapKeyboardHandlersOC = () => {
        if (keydownHandler) {
            offCanvasElement.removeEventListener('keydown', keydownHandler);
            keydownHandler = null;
        }
    }

    const toggleOffCanvas = (action) =>{
        if (!offCanvasElement) return;
        
        docScrollLoc = window.pageYOffset || document.documentElement.scrollTop;

        // Close off canvas
        if (body.classList.contains('js-off-canvas-showing') || action === 'undefined' || action === 'hide') {   
            document.dispatchEvent(createCustomEvent('hide.offCanvas'));
            
            body.classList.remove('js-off-canvas-showing');

            removeTrapKeyboardHandlersOC();

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
                const transitionHandler = (e) => {
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
                const transitionHandler = (e) => {
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

    //Set the height of the off-canvas element based on content
    const setOffCanvasHeight = () => {
        if (!body.classList.contains('has-header-fixed') && offCanvasElement) {
            const offCanvasHelper = document.querySelector('.l-off-canvas__helper');
            const surround = document.querySelector('.l-surround');
            
            if (!offCanvasHelper || !surround) return;
            
            const offCanvasHeight = offCanvasHelper.offsetHeight;
            const surroundHeight = surround.offsetHeight;
            const setHeight = (offCanvasHeight >= surroundHeight) ? offCanvasHeight : surroundHeight;

            setTimeout(() => {
                if (window.matchMedia(`(max-width: ${offCanvasBreakpoint - 1}px)`).matches) {
                    offCanvasElement.style.minHeight = `${setHeight}px`;
                } else {
                    offCanvasElement.style.minHeight = '';
                }
            }, 300);
        }
    }

    // Create overlay that covers page content when off-canvas is active
    const createOverlay = () => {
        const surround = document.querySelector('.l-surround');
        
        if (!surround) return;
        
        const overlay = document.createElement('div');
        overlay.classList.add('l-off-canvas-overlay');
        surround.prepend(overlay);
        
        // Add click handler to close menu when overlay is clicked
        overlay.addEventListener('click', () => {
            toggleOffCanvas('hide');
        });
    }
    
    // Initialize overlay
    createOverlay();

    // Touch event handling
    body.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });

    // Handle touch movement to close the menu with swipe
    body.addEventListener('touchmove', (e) => {
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
        btn.addEventListener('click', () => {
            toggleOffCanvas();
        });
    });

    // Initialize on window load
    window.addEventListener('load', () => {
        setOffCanvasHeight();
        
        if (offCanvasElement) {
            offCanvasElement.classList.add('js-l-off-canvas-hide');
        }
    });

    // Handle window resize events
    window.addEventListener('ocResizeEnd', () => {
        if (window.matchMedia(`(min-width: ${offCanvasBreakpoint}px)`).matches) {
            removeTrapKeyboardHandlersOC();
            toggleOffCanvas('hide');
        }
        setOffCanvasHeight();
    });
})();
//# sourceMappingURL=off-canvas-temp.js.map
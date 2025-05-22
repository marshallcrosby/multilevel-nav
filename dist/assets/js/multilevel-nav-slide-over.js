/*!
  * Multilevel nav slide over extension v2.0.0.0 Beta
  */

/* eslint-env es6 */
const slideOverKeyboardTrap = (el) => {
    
    // Tabbable elements
    const firstChildList = el.querySelector('.mln__child__list');
    let lastIsMln;
    
    if (firstChildList) {
        const lastChild = firstChildList.querySelector(':scope > .mln__has-child:last-child > .mln__child-controls');
        
        if (lastChild) {
            lastIsMln = lastChild.querySelector(':scope > .mln__toggle-btn, :scope > .mln__toggle-link');
        }
    }

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
    
    // Find all tabbable elements
    const tabbable = el.querySelectorAll(tabbableElementsArray);

    console.log(tabbable);

    const firstTabbable = tabbable[0];
    const lastTabbable = lastIsMln || tabbable[tabbable.length - 1];
    
    // Set focus on first input
    if (firstTabbable) {
        firstTabbable.focus();
    }

    // Redirect last tab to first input
    if (lastTabbable) {
        lastTabbable.addEventListener('keydown', (e) => {
            if (e.which === 9 && !e.shiftKey && document.body.classList.contains('js-off-canvas-showing')) {
                e.preventDefault();
                firstTabbable.focus();
            }
        });
    }

    // Redirect first shift+tab to last input
    if (firstTabbable) {
        firstTabbable.addEventListener('keydown', (e) => {
            if (e.which === 9 && e.shiftKey && document.body.classList.contains('js-off-canvas-showing')) {
                e.preventDefault();
                lastTabbable.focus();
            }
        });
    }
}

const multilevelSlideOverSetup = (elements, options = {}) => {
    
    // Handle string selectors
    if (typeof elements === 'string') {
        elements = document.querySelectorAll(elements);
    }
    
    // Handle single element
    if (elements instanceof HTMLElement) {
        elements = [elements];
    }
    
    // Convert NodeList to array if needed
    if (elements instanceof NodeList) {
        elements = Array.from(elements);
    }

    // Default settings
    const defaults = {
        slideTitles: true,
        slideTitleLink: false,
        backButtonSymbol: '&lsaquo;',
        dynamicBackButtonTitle: false,
        offCanvasCloseAllMenus: false
    };
    
    // Merge defaults with options
    const settings = {...defaults, ...options};
    
    // Process each element
    for (const slideOverNav of elements) {
        const mlnDataBreakpoint = slideOverNav.getAttribute('data-mln-breakpoint') || undefined;

        // Function to close all child menus
        const closeAllChildren = () => {
            if (slideOverNav.classList.contains('mln--navbar-slide-over')) {
                
                // Hide all expanded elements
                const hiddenElements = slideOverNav.querySelectorAll('[aria-hidden="false"]');
                for (const el of hiddenElements) {
                    el.setAttribute('aria-hidden', 'true');
                    el.classList.remove('mln--height-auto', 'mln__child--overflow-visible');
                }
                
                // Remove visible menu class
                const visibleMenus = slideOverNav.querySelectorAll('.mln__visible-menu');
                for (const menu of visibleMenus) {
                    menu.classList.remove('mln__visible-menu');
                }
                
                // Add visible menu class to main list
                const mainList = slideOverNav.querySelector('.mln__list');
                if (mainList) {
                    mainList.classList.add('mln__visible-menu');
                }
                
                // Collapse expanded elements
                const expandedElements = slideOverNav.querySelectorAll('[aria-expanded="true"]');
                for (const el of expandedElements) {
                    el.setAttribute('aria-expanded', 'false');
                    const hasChild = el.closest('.mln__has-child--showing');

                    if (hasChild) {
                        hasChild.classList.remove('mln__has-child--showing');
                    }
                }
                
                // Reset min-height
                slideOverNav.style.minHeight = '';
            }
        }
        
        // Set height on certain elements to make the outer nav height the same
        // height as the current viewable slide
        const setDynamicHeight = () => {
            
            // Reset inline styles
            slideOverNav.querySelectorAll('.mln__child__collapse').forEach(el => {
                el.style.minHeight = '';
            });

            // Get the last showing has-child element
            const allShowing = slideOverNav.querySelectorAll('.mln__has-child.mln__has-child--showing');
            const lastShowing = allShowing[allShowing.length - 1];

            let parentCollapse = null;
            let latestChildShowing = null;

            if (lastShowing) {
                parentCollapse = lastShowing.closest('.mln__child__collapse');

                const directCollapse = lastShowing.querySelector(':scope > .mln__child__collapse');
                if (directCollapse) {
                    latestChildShowing = directCollapse.querySelector(':scope > .mln__child__collapse__helper');
                }
            }

            // Determine element to get height from
            const getHeightFromThis = latestChildShowing || slideOverNav.querySelector('.mln__list');

            // Get height
            const dynamicHeight = getHeightFromThis ? getHeightFromThis.offsetHeight : 0;

            // Apply height to nav
            slideOverNav.style.minHeight = dynamicHeight + 'px';

            // Apply height to parent collapse if available
            if (parentCollapse) {
                parentCollapse.style.minHeight = dynamicHeight + 'px';
            }
        }

        
        // Add slide-over controls to each child menu
        const hasChildElements = slideOverNav.querySelectorAll('.mln__has-child');
        
        for (const navEl of hasChildElements) {
            const childCollapse = navEl.querySelector('.mln__child__collapse');
            
            if (!childCollapse) continue;
            
            const currentMenuId = childCollapse.getAttribute('id');
            const collapseHelper = childCollapse.querySelector('.mln__child__collapse__helper');
            const menuSectionLink = navEl.querySelector('.mln__child-controls > a');
            
            if (!collapseHelper || !menuSectionLink) continue;
            
            const menuSectionLabel = menuSectionLink.innerHTML;
            const backButtonSymbol = settings.backButtonSymbol ? 
                `<span aria-hidden="true">${settings.backButtonSymbol}</span> ` : '';
            
            const isNotLinkable = menuSectionLink.getAttribute('data-mln-not-linkable');
            const useMenuText = isNotLinkable || settings.dynamicBackButtonTitle;
            const backButtonText = useMenuText ? 
                `${backButtonSymbol}${menuSectionLink.textContent}` : 
                `${backButtonSymbol}Back`;
            
            // Create controls container
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'mln__slide-over-controls';
            collapseHelper.insertBefore(controlsDiv, collapseHelper.firstChild);
            
            // Create back button
            const backBtn = document.createElement('button');
            backBtn.className = 'mln__back-btn';
            backBtn.setAttribute('type', 'button');
            backBtn.setAttribute('aria-controls', currentMenuId);
            backBtn.innerHTML = backButtonText;
            controlsDiv.appendChild(backBtn);
            
            // Build slide title (no link)
            if (settings.slideTitles && !settings.slideTitleLink) {
                const titleSpan = document.createElement('span');
                titleSpan.className = 'mln__slide-over-title';
                titleSpan.innerHTML = menuSectionLabel;
                controlsDiv.appendChild(titleSpan);
            }
            
            // Build slide title with link
            if (settings.slideTitles && settings.slideTitleLink) {
                const titleLink = menuSectionLink.cloneNode(true);
                titleLink.classList.add('mln__slide-over-title');
                titleLink.classList.remove('mln__toggle-link');
                titleLink.removeAttribute('role');
                titleLink.removeAttribute('aria-expanded');
                titleLink.removeAttribute('aria-controls');
                
                // Remove toggle indicator if exists
                const toggleIndicator = titleLink.querySelector('.mln__toggle-indicator');
                if (toggleIndicator) {
                    toggleIndicator.remove();
                }
                
                controlsDiv.appendChild(titleLink);
            }
            
            // Add back button click handler
            backBtn.addEventListener('click', () => {
                const toggleElement = navEl.querySelector(`.mln__toggle-btn[aria-controls="${currentMenuId}"], .mln__toggle-link[aria-controls="${currentMenuId}"]`);
                
                if (toggleElement) {
                    
                    // Create and dispatch click event
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    
                    toggleElement.dispatchEvent(clickEvent);
                }
            });
        }
        
        // Event listeners for navigation events
        slideOverNav.addEventListener('show.mln.child', () => {
            if (
                (slideOverNav.classList.contains('mln--navbar-slide-over') && 
                mlnViewport().width < mlnDataBreakpoint) || 
                mlnDataBreakpoint === undefined
            ) {
                setDynamicHeight();
            }
        });
        
        slideOverNav.addEventListener('hide.mln.child', () => {
            if (
                (slideOverNav.classList.contains('mln--navbar-slide-over') && 
                mlnViewport().width < mlnDataBreakpoint) || 
                mlnDataBreakpoint === undefined
            ) {
                setDynamicHeight();
            }
        });
        
        slideOverNav.addEventListener('shown.mln.child', () => {
            const showingElements = slideOverNav.querySelectorAll('.mln__has-child--showing');
            if (showingElements.length) {
                const latestNavShowing = showingElements[showingElements.length - 1];
                latestNavShowing.classList.add('mln__has-child--active');
                
                const childCollapse = latestNavShowing.querySelector('.mln__child__collapse');
                if (childCollapse) {
                    slideOverKeyboardTrap(childCollapse);
                }
            }
        });
        
        // Handle off-canvas close if needed
        if (settings.offCanvasCloseAllMenus) {
            const offCanvasToggles = document.querySelectorAll('.toggle-off-canvas');
            
            for (const toggleButton of offCanvasToggles) {
                
                // Use a one-time listener
                const clickHandler = () => {
                    if (toggleButton.getAttribute('aria-expanded') === 'true') {
                        
                        // Listen for hidden.offCanvas event
                        document.addEventListener('hidden.offCanvas', function offCanvasHiddenHandler() {
                            closeAllChildren();
                            document.removeEventListener('hidden.offCanvas', offCanvasHiddenHandler);
                        });
                    }
                    
                    toggleButton.removeEventListener('click', clickHandler);
                };
                
                toggleButton.addEventListener('click', clickHandler);
            }
        }
        
        // Initialize dynamic height
        setDynamicHeight();
        
        // Handle resize events
        window.addEventListener('mlnResizeEnd', () => {
            if (slideOverNav.classList.contains('mln--navbar-slide-over') && mlnViewport().width > mlnDataBreakpoint) {
                slideOverNav.style.minHeight = '';
            } else {
                setDynamicHeight();
            }
        });
    }
    
    // Return the processed elements for chaining
    return elements;
}

// Helper function to initialize multilevelNavSlideOver on multiple elements
const multilevelNavSlideOver = (selector, options) => {
    const elements = document.querySelectorAll(selector);
    const instances = [];
    
    elements.forEach(element => {
        const instance = multilevelSlideOverSetup(element, options);
        
        if (instance) {
            instances.push(instance);
        }
    });
    
    return instances;
}
//# sourceMappingURL=multilevel-nav-slide-over.js.map
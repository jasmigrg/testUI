(function() {
    'use strict';

    let isCollapsed = true;
    let hoverTimeout = null;
    const HOVER_DELAY = 150;

    const sidebar = document.getElementById('sidebar');
    const menuItems = document.querySelectorAll('.menu-item.has-submenu');

    function expandSidebar() {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }

        sidebar.classList.remove('collapsed');
        sidebar.classList.add('expanded');
        isCollapsed = false;
    }

    /**
     * Collapse sidebar on mouse leave (with delay)
     */
    function collapseSidebar() {
        hoverTimeout = setTimeout(() => {
            sidebar.classList.remove('expanded');
            sidebar.classList.add('collapsed');
            isCollapsed = true;

            // Close all submenus when collapsing
            menuItems.forEach(item => {
                item.classList.remove('open');
            });
        }, HOVER_DELAY);
    }

    /**
     * Initialize hover event listeners
     */
    function initializeHoverBehavior() {
        if (!sidebar) {
            console.error('Sidebar element not found');
            return;
        }

        sidebar.addEventListener('mouseenter', expandSidebar);
        sidebar.addEventListener('mouseleave', collapseSidebar);
    }

    // ============================================
    // Submenu Toggle Behavior
    // ============================================

    /**
     * Toggle submenu visibility
     * @param {HTMLElement} menuItem - The menu item to toggle
     */
    function toggleSubmenu(menuItem) {
        const isOpen = menuItem.classList.contains('open');

        // Close all other submenus
        menuItems.forEach(item => {
            if (item !== menuItem) {
                item.classList.remove('open');
            }
        });

        // Toggle current submenu
        if (isOpen) {
            menuItem.classList.remove('open');
        } else {
            menuItem.classList.add('open');
        }
    }

    /**
     * Initialize submenu toggle event listeners
     */
    function initializeSubmenuBehavior() {
        menuItems.forEach(menuItem => {
            const menuLink = menuItem.querySelector('.menu-link');

            if (menuLink) {
                menuLink.addEventListener('click', function(event) {
                    // Only allow submenu toggle if sidebar is expanded
                    if (!isCollapsed) {
                        event.preventDefault();
                        toggleSubmenu(menuItem);
                    } else {
                        // When collapsed, prevent submenu toggle entirely
                        event.preventDefault();
                    }
                });
            }
        });
    }

    // ============================================

    function setActiveMenuItem() {
        const currentPath = window.location.pathname;

        document.querySelectorAll('.menu-link, .submenu-link').forEach(link => {
            link.classList.remove('active');
        });

        document.querySelectorAll('.menu-link, .submenu-link').forEach(link => {
            const href = link.getAttribute('href');

            if (href && href !== '#') {
                const isMatch =
                    (href === '/' && currentPath === '/') ||
                    (href !== '/' && currentPath.startsWith(href));

                if (isMatch) {
                    link.classList.add('active');

                    const parentMenuItem = link.closest('.has-submenu');
                    if (parentMenuItem) {
                        parentMenuItem.classList.add('open');
                    }
                }
            }
        });
    }

    function initializeKeyboardNavigation() {
        document.addEventListener('keydown', function(event) {
            if (event.ctrlKey && event.key === 'b') {
                event.preventDefault();

                if (isCollapsed) {
                    expandSidebar();
                } else {
                    collapseSidebar();
                }
            }

            // Escape key closes all submenus
            if (event.key === 'Escape') {
                menuItems.forEach(item => {
                    item.classList.remove('open');
                });
            }
        });
    }

    // ============================================
    // Initialization
    // ============================================

    function init() {
        if (sidebar) {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('expanded');
        }
        initializeHoverBehavior();
        initializeSubmenuBehavior();
        setActiveMenuItem();
        initializeKeyboardNavigation();

        console.log('Sidebar navigation initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.SidebarNav = {
        expand: expandSidebar,
        collapse: collapseSidebar,
        toggleSubmenu: toggleSubmenu,
        isCollapsed: () => isCollapsed
    };

})();
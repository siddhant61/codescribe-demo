/**
 * Mobile Menu Toggle Script
 * Handles hamburger menu functionality for mobile navigation
 */

(function() {
  'use strict';
  
  // Create and inject hamburger menu button if on mobile
  function initMobileMenu() {
    const header = document.querySelector('.header-container');
    if (!header) return;
    
    // Check if hamburger button already exists
    let toggleButton = document.querySelector('.mobile-menu-toggle');
    
    if (!toggleButton && window.innerWidth <= 768) {
      // Create hamburger button
      toggleButton = document.createElement('button');
      toggleButton.className = 'mobile-menu-toggle';
      toggleButton.type = 'button';
      toggleButton.setAttribute('aria-label', 'Toggle mobile menu');
      toggleButton.setAttribute('aria-expanded', 'false');
      const nav = header.querySelector('.header-nav');
      if (nav) {
        nav.id = nav.id || 'primary-navigation';
        toggleButton.setAttribute('aria-controls', nav.id);
      }
      toggleButton.innerHTML = '<span></span><span></span><span></span>';
      
      // Insert before header-actions
      const headerActions = header.querySelector('.header-actions');
      if (nav || headerActions) {
        header.insertBefore(toggleButton, nav || headerActions);
      } else {
        header.appendChild(toggleButton);
      }
      
      // Add click event
      toggleButton.addEventListener('click', toggleMobileMenu);
    }
  }
  
  // Toggle mobile menu visibility
  function toggleMobileMenu(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const nav = document.querySelector('.header-nav');
    
    if (!nav) return;
    
    // Toggle button animation
    button.classList.toggle('open');
    
    // Toggle nav visibility
    nav.classList.toggle('mobile-open');
    
    // Update ARIA
    const isOpen = nav.classList.contains('mobile-open');
    button.setAttribute('aria-expanded', isOpen);
  }
  
  // Close menu when clicking nav links
  function closeMenuOnNavClick() {
    const navLinks = document.querySelectorAll('.header-nav .nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        const nav = document.querySelector('.header-nav');
        const button = document.querySelector('.mobile-menu-toggle');
        
        if (nav && nav.classList.contains('mobile-open')) {
          nav.classList.remove('mobile-open');
          if (button) {
            button.classList.remove('open');
            button.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });
  }
  
  // Handle window resize
  function handleResize() {
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.header-nav');
    
    if (window.innerWidth > 768) {
      // Desktop: remove mobile menu button and classes
      if (toggleButton) {
        toggleButton.remove();
      }
      if (nav) {
        nav.classList.remove('mobile-open');
      }
    } else {
      // Mobile: ensure hamburger exists
      initMobileMenu();
    }
  }
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    initMobileMenu();
    closeMenuOnNavClick();
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const nav = document.querySelector('.header-nav');
      const button = document.querySelector('.mobile-menu-toggle');
      if (button && nav?.classList.contains('mobile-open')) {
        nav.classList.remove('mobile-open');
        button.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
        button.focus();
      }
    });
    
    // Handle window resize with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 250);
    });
  }
})();

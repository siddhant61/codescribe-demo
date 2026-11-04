/**
 * Xikolo Knowledge Base - Navigation Script
 * 
 * Handles mobile navigation, active states, and smooth scrolling.
 * 
 * Last Updated: September 30, 2025
 */

(function() {
  'use strict';

  // Set active navigation item based on current page
  function setActiveNavItem() {
    const currentUrl = new URL(window.location.href);
    const pagePath = path => path.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
    const navLinks = document.querySelectorAll('.header-nav .nav-link');
    
    navLinks.forEach(link => {
      const destination = new URL(link.getAttribute('href'), document.baseURI);
      if (destination.origin === currentUrl.origin &&
          pagePath(destination.pathname) === pagePath(currentUrl.pathname)) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // Keep section selection in sync with direct links and browser history.
  // Scrolling/restoration remains the browser's responsibility on Back/Forward.
  function setActiveSectionNavItem() {
    const links = Array.from(document.querySelectorAll('.methodology-nav .nav-link'));
    const activeLink = window.location.hash
      ? links.find(link => link.getAttribute('href') === window.location.hash)
      : links[0];
    if (!activeLink) return;
    links.forEach(link => {
      if (link === activeLink) link.classList.add('active');
      else link.classList.remove('active');
    });
  }

  // Smooth scroll for anchor links
  function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        // Keep native fragment navigation so keyboard focus reaches main.
        if (this.classList.contains('skip-link')) return;
        const targetId = this.getAttribute('href');
        
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Update URL without jumping
          history.pushState(null, null, targetId);
          setActiveSectionNavItem();
        }
      });
    });
  }

  // Update sidebar nav active state on scroll
  function initScrollSpy() {
    const sections = document.querySelectorAll('[id]');
    const sidebarLinks = document.querySelectorAll('.sidebar-nav-link');
    
    if (sections.length === 0 || sidebarLinks.length === 0) return;
    
    function updateActiveSection() {
      let currentSection = '';
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop - 100) {
          currentSection = section.getAttribute('id');
        }
      });
      
      sidebarLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        if (href === '#' + currentSection) {
          link.classList.add('active');
        }
      });
    }
    
    window.addEventListener('scroll', updateActiveSection);
    updateActiveSection(); // Initial call
  }

  // Mobile menu toggle (future enhancement)
  function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-toggle');
    const headerNav = document.querySelector('.header-nav');
    
    if (!mobileMenuButton) return;
    
    mobileMenuButton.addEventListener('click', () => {
      headerNav.classList.toggle('mobile-open');
      mobileMenuButton.setAttribute('aria-expanded', 
        headerNav.classList.contains('mobile-open'));
    });
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    setActiveNavItem();
    setActiveSectionNavItem();
    initSmoothScroll();
    initScrollSpy();
    initMobileMenu();
  });

  window.addEventListener('popstate', () => {
    setActiveNavItem();
    setActiveSectionNavItem();
  });
  window.addEventListener('hashchange', setActiveSectionNavItem);
})();

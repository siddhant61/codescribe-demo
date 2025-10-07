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
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath || 
          link.getAttribute('href') === currentPath.replace(/\/$/, '')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Smooth scroll for anchor links
  function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
      link.addEventListener('click', function(e) {
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
    initSmoothScroll();
    initScrollSpy();
    initMobileMenu();
  });

  // Update active nav on page navigation (for SPAs, future enhancement)
  window.addEventListener('popstate', setActiveNavItem);
})();

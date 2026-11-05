/**
 * Cluster Report Interactive Features
 * 
 * Features:
 * - Sticky sidebar with active section highlighting
 * - Smooth scroll navigation
 * - Interactive checklists
 * 
 * Last Updated: September 30, 2025
 */

(function() {
  'use strict';

  // ============================================================================
  // Sticky Sidebar & Active Section Highlighting
  // ============================================================================

  function initStickyNavigation() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarNav = document.querySelector('.sidebar-nav');
    const article = document.querySelector('article');
    
    if (!sidebar || !sidebarNav || !article) return;

    // Get all sections in the article
    const sections = Array.from(article.querySelectorAll('h2, h3')).map(heading => {
      const headingId = heading.id;
      // Find the corresponding sidebar link by comparing href attributes
      const link = Array.from(sidebarNav.querySelectorAll('a')).find(a => 
        a.getAttribute('href') === `#${headingId}`
      );
      return {
        id: headingId,
        element: heading,
        link: link
      };
    }).filter(section => section.id && section.link);

    // Track current active section
    let currentActiveId = null;

    // Highlight active section in sidebar
    function highlightActiveSection() {
      const scrollPosition = window.scrollY + 100; // Offset for header
      
      // Find the current section
      let activeSection = null;
      for (const section of sections) {
        if (section.element.offsetTop <= scrollPosition) {
          activeSection = section;
        } else {
          break;
        }
      }

      // Update active state if changed
      if (activeSection && activeSection.id !== currentActiveId) {
        // Remove previous active
        sidebarNav.querySelectorAll('.sidebar-nav-link').forEach(link => {
          link.classList.remove('active');
        });

        // Add new active
        if (activeSection.link) {
          activeSection.link.classList.add('active');
          currentActiveId = activeSection.id;
        }
      }
    }

    // Throttle scroll events for performance
    let scrollTimeout;
    function onScroll() {
      if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
      }
      scrollTimeout = window.requestAnimationFrame(highlightActiveSection);
    }

    // Add scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });
    
    // Initial highlight
    highlightActiveSection();
  }

  // ============================================================================
  // Smooth Scroll Navigation
  // ============================================================================

  // Native details remains usable without JavaScript. Expand it on wide screens
  // and collapse it on narrow screens so long contents do not bury the report.
  function initResponsiveContents() {
    const toc = document.querySelector('.cs-report-toc');
    if (!toc) return;
    const desktop = window.matchMedia('(min-width: 1025px)');
    const sync = () => { toc.open = desktop.matches; };
    sync();
    desktop.addEventListener('change', sync);
  }

  // ============================================================================
  // Interactive Checklists
  // ============================================================================

  function initChecklists() {
    // Find all checklist items
    const checklistItems = document.querySelectorAll('.prose ul li');
    
    checklistItems.forEach(item => {
      const text = item.textContent.trim();
      
      // Check if it's a checkbox item (starts with [ ] or [x])
      if (text.startsWith('[ ]') || text.startsWith('[x]')) {
        const isChecked = text.startsWith('[x]');
        const labelText = text.replace(/^\[[ x]\]\s*/, '');
        
        // Create checkbox element
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'checklist-checkbox';
        checkbox.checked = isChecked;
        checkbox.id = `checklist-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create label
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.className = 'checklist-label';
        label.textContent = labelText;
        
        // Clear item and add new elements
        item.textContent = '';
        item.className = 'checklist-item';
        item.appendChild(checkbox);
        item.appendChild(label);
        
        // Add change listener to save state
        checkbox.addEventListener('change', function() {
          // Save to localStorage
          const checklistKey = `checklist-${window.location.pathname}`;
          const savedState = JSON.parse(localStorage.getItem(checklistKey) || '{}');
          savedState[labelText] = this.checked;
          localStorage.setItem(checklistKey, JSON.stringify(savedState));
          
          // Visual feedback
          if (this.checked) {
            label.style.textDecoration = 'line-through';
            label.style.opacity = '0.6';
          } else {
            label.style.textDecoration = 'none';
            label.style.opacity = '1';
          }
        });
        
        // Restore saved state
        const checklistKey = `checklist-${window.location.pathname}`;
        const savedState = JSON.parse(localStorage.getItem(checklistKey) || '{}');
        if (savedState[labelText] !== undefined) {
          checkbox.checked = savedState[labelText];
          if (checkbox.checked) {
            label.style.textDecoration = 'line-through';
            label.style.opacity = '0.6';
          }
        }
      }
    });
  }

  // ============================================================================
  // Indent Subsections in Sidebar
  // ============================================================================

  function indentSubsections() {
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav-item');
    
    sidebarNavItems.forEach(item => {
      const link = item.querySelector('.sidebar-nav-link');
      if (!link) return;
      
      const href = link.getAttribute('href');
      const targetId = href.slice(1); // Remove the # symbol
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        // Check if it's an h3 (subsection)
        if (targetElement.tagName === 'H3') {
          item.classList.add('sidebar-nav-subsection');
        } else if (targetElement.tagName === 'H2') {
          item.classList.add('sidebar-nav-section');
        } else if (targetElement.tagName === 'H4') {
          item.classList.add('sidebar-nav-subsubsection');
        }
      }
    });
  }

  // ============================================================================
  // Initialize All Features
  // ============================================================================

  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    initStickyNavigation();
    initResponsiveContents();
    initChecklists();
    indentSubsections();
  }

  // Start initialization
  init();

})();

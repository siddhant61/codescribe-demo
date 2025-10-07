/**
 * Knowledge Graph Mobile Enhancements
 * Handles mobile-specific interactions for the knowledge graph details panel
 */

(function() {
  'use strict';
  
  function initMobileKnowledgeGraph() {
    const detailsPanel = document.getElementById('details-panel');
    if (!detailsPanel) return;
    
    // Only add mobile functionality on mobile devices
    if (window.innerWidth > 768) return;
    
    // Close panel when clicking the close button (::after pseudo-element area)
    detailsPanel.addEventListener('click', function(e) {
      // Check if click is in the top-right corner where close button is
      const rect = detailsPanel.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Close button area: top-right corner (approximately 60x60px)
      if (clickX > rect.width - 60 && clickY < 60) {
        detailsPanel.classList.add('hidden');
        e.stopPropagation();
      }
    });
    
    // Close panel when clicking outside (on the backdrop)
    document.addEventListener('click', function(e) {
      if (!detailsPanel.classList.contains('hidden') && 
          !detailsPanel.contains(e.target) &&
          !e.target.closest('.node')) {
        detailsPanel.classList.add('hidden');
      }
    });
    
    // Prevent clicks inside panel from closing it
    detailsPanel.addEventListener('click', function(e) {
      e.stopPropagation();
    });
    
    // Add swipe-down gesture to close panel (only at top of scroll)
    let touchStartY = 0;
    let touchEndY = 0;
    let canSwipeClose = false;
    
    detailsPanel.addEventListener('touchstart', function(e) {
      touchStartY = e.touches[0].clientY;
      // Check if at the top of the scrollable content
      canSwipeClose = detailsPanel.scrollTop === 0;
    }, { passive: true });
    
    detailsPanel.addEventListener('touchmove', function(e) {
      touchEndY = e.touches[0].clientY;
      
      // Only show visual feedback if we're at the top AND swiping down
      if (canSwipeClose && detailsPanel.scrollTop === 0) {
        const swipeDistance = touchEndY - touchStartY;
        
        // Show visual feedback for downward swipe only
        if (swipeDistance > 0) {
          const translateY = Math.min(swipeDistance * 0.5, 100);
          detailsPanel.style.transform = `translateY(${translateY}px)`;
          detailsPanel.style.transition = 'none';
        }
      }
    }, { passive: true });
    
    detailsPanel.addEventListener('touchend', function(e) {
      const swipeDistance = touchEndY - touchStartY;
      
      // If swiped down more than 100px while at the top, close the panel
      if (canSwipeClose && swipeDistance > 100) {
        detailsPanel.classList.add('hidden');
      }
      
      // Reset transform with transition
      detailsPanel.style.transition = '';
      detailsPanel.style.transform = '';
      touchStartY = 0;
      touchEndY = 0;
      canSwipeClose = false;
    }, { passive: true });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileKnowledgeGraph);
  } else {
    initMobileKnowledgeGraph();
  }
  
  // Re-initialize on window resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initMobileKnowledgeGraph, 250);
  });
})();

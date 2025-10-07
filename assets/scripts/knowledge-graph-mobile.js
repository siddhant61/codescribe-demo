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
    
    // Add swipe-down gesture to close panel
    let touchStartY = 0;
    let touchEndY = 0;
    
    detailsPanel.addEventListener('touchstart', function(e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    detailsPanel.addEventListener('touchmove', function(e) {
      touchEndY = e.touches[0].clientY;
      
      // If swiping down and at the top of scrollable content
      const detailsContent = document.getElementById('details-content');
      if (detailsContent && detailsContent.scrollTop === 0) {
        const swipeDistance = touchEndY - touchStartY;
        
        // Show visual feedback for swipe
        if (swipeDistance > 0) {
          const translateY = Math.min(swipeDistance, 200);
          detailsPanel.style.transform = `translateY(${translateY}px)`;
        }
      }
    }, { passive: true });
    
    detailsPanel.addEventListener('touchend', function(e) {
      const swipeDistance = touchEndY - touchStartY;
      
      // If swiped down more than 100px, close the panel
      if (swipeDistance > 100) {
        detailsPanel.classList.add('hidden');
      }
      
      // Reset transform
      detailsPanel.style.transform = '';
      touchStartY = 0;
      touchEndY = 0;
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

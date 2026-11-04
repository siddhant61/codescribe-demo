/** Accessible details panel and mobile swipe dismissal. Install listeners once. */
(function() {
  'use strict';

  function initDetailsPanel() {
    const panel = document.getElementById('details-panel');
    const closeButton = document.getElementById('details-close');
    if (!panel || !closeButton) return;
    const mobile = window.matchMedia('(max-width: 768px)');
    let opener = null;
    let wasHidden = panel.classList.contains('hidden');
    let touchStartY = null;
    let swipeDistance = 0;

    const close = () => panel.classList.add('hidden');
    closeButton.addEventListener('click', close);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.classList.contains('hidden')) close();
    });
    document.addEventListener('click', event => {
      if (mobile.matches && !panel.classList.contains('hidden') &&
          !event.composedPath().includes(panel) && !event.target.closest('.node') &&
          !event.target.closest('#workflow-selector')) close();
    });

    new MutationObserver(() => {
      const hidden = panel.classList.contains('hidden');
      if (wasHidden && !hidden) {
        opener = document.activeElement;
        panel.scrollTop = 0;
        closeButton.focus({ preventScroll: true });
      } else if (!wasHidden && hidden && panel.contains(document.activeElement)) {
        if (opener && opener.isConnected) opener.focus({ preventScroll: true });
      }
      wasHidden = hidden;
    }).observe(panel, { attributes: true, attributeFilter: ['class'] });

    // Following a relationship replaces the focused link with new details.
    const content = document.getElementById('details-content');
    if (content) new MutationObserver(() => {
      if (!panel.classList.contains('hidden') && document.activeElement === document.body) {
        closeButton.focus({ preventScroll: true });
      }
    }).observe(content, { childList: true });

    const resetSwipe = () => {
      panel.style.transition = '';
      panel.style.transform = '';
      touchStartY = null;
      swipeDistance = 0;
    };
    panel.addEventListener('touchstart', event => {
      resetSwipe();
      if (mobile.matches && panel.scrollTop === 0 && event.touches.length === 1) {
        touchStartY = event.touches[0].clientY;
      }
    }, { passive: true });
    panel.addEventListener('touchmove', event => {
      if (touchStartY === null || !mobile.matches || panel.scrollTop > 0) return;
      swipeDistance = event.touches[0].clientY - touchStartY;
      if (swipeDistance > 0) {
        panel.style.transform = `translateY(${Math.min(swipeDistance * 0.5, 100)}px)`;
        panel.style.transition = 'none';
      }
    }, { passive: true });
    panel.addEventListener('touchend', () => {
      if (mobile.matches && swipeDistance > 100 && panel.scrollTop === 0) close();
      resetSwipe();
    }, { passive: true });
    panel.addEventListener('touchcancel', resetSwipe, { passive: true });
    mobile.addEventListener('change', resetSwipe);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetailsPanel);
  } else {
    initDetailsPanel();
  }
})();

/* Keep fragment targets and report contents below the actual sticky header. */
(function () {
  'use strict';
  function init() {
    const header = document.querySelector('.page-header');
    if (!header) return;
    const update = () => {
      const offset = Math.ceil(header.getBoundingClientRect().height) + 16;
      document.documentElement.style.setProperty('--cs-header-offset', `${offset}px`);
    };
    update();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(update).observe(header);
    } else {
      window.addEventListener('resize', update);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

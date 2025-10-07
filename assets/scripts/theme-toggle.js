/**
 * Xikolo Knowledge Base - Theme Toggle Script
 * 
 * Handles dark/light mode toggling and persistence.
 * 
 * Last Updated: September 30, 2025
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'xikolo-theme';
  const THEME_DARK = 'dark';
  const THEME_LIGHT = 'light';

  // Get saved theme or default to light
  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY) || THEME_LIGHT;
  }

  // Save theme to localStorage
  function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // Apply theme to document
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update button icon and aria-label
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      const icon = theme === THEME_DARK ? '☀️' : '🌙';
      const label = theme === THEME_DARK ? 'Switch to light mode' : 'Switch to dark mode';
      themeToggle.setAttribute('aria-label', label);
      
      // Update SVG icon if needed
      updateThemeIcon(themeToggle, theme);
    }
  }

  // Update theme toggle icon
  function updateThemeIcon(button, theme) {
    const svg = button.querySelector('svg');
    if (!svg) return;
    
    if (theme === THEME_DARK) {
      // Sun icon for switching to light mode
      svg.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    } else {
      // Moon icon for switching to dark mode
      svg.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    }
  }

  // Toggle theme
  function toggleTheme() {
    const currentTheme = getSavedTheme();
    const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
    
    saveTheme(newTheme);
    applyTheme(newTheme);
    
    // Add transition class for smooth theme change
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);
  }

  // Initialize theme on page load
  function initTheme() {
    const savedTheme = getSavedTheme();
    
    // Check for system preference if no saved theme
    if (!localStorage.getItem(STORAGE_KEY)) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? THEME_DARK : THEME_LIGHT;
      applyTheme(systemTheme);
      saveTheme(systemTheme);
    } else {
      applyTheme(savedTheme);
    }
    
    // Set up theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  }

  // Listen for system theme changes
  function watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(STORAGE_KEY)) {
        const newTheme = e.matches ? THEME_DARK : THEME_LIGHT;
        applyTheme(newTheme);
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  watchSystemTheme();
})();

/**
 * Example Theme — Front-end Navigation
 *
 * Handles responsive navigation behaviour: toggling the mobile menu,
 * managing ARIA attributes for accessibility, and trapping focus inside
 * the open menu.
 *
 * @file      navigation.js
 * @package   ExampleTheme
 * @since     1.0.0
 */

(function () {
  'use strict';

  /**
   * Initialize responsive navigation for a given container.
   *
   * Finds the toggle button and navigation list inside the container,
   * binds click and keyboard handlers, and sets the initial ARIA state.
   *
   * @since 1.0.0
   *
   * @param {HTMLElement} container The navigation wrapper element.
   * @return {void}
   */
  function initNavigation(container) {
    var button = container.querySelector('.menu-toggle');
    var menu = container.querySelector('.nav-menu');

    if (!button || !menu) {
      return;
    }

    button.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');

    button.addEventListener('click', function () {
      toggleMenu(button, menu);
    });

    // Close on Escape key.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isMenuOpen(button)) {
        toggleMenu(button, menu);
        button.focus();
      }
    });
  }

  /**
   * Toggle the navigation menu open or closed.
   *
   * Flips the `aria-expanded` attribute on the button and `aria-hidden`
   * on the menu element. Adds or removes the `is-open` CSS class on the
   * menu for styling hooks.
   *
   * @since 1.0.0
   *
   * @param {HTMLButtonElement} button The toggle button element.
   * @param {HTMLElement}       menu   The navigation list element.
   * @return {void}
   */
  function toggleMenu(button, menu) {
    var expanded = isMenuOpen(button);

    button.setAttribute('aria-expanded', String(!expanded));
    menu.setAttribute('aria-hidden', String(expanded));
    menu.classList.toggle('is-open', !expanded);
  }

  /**
   * Check whether the navigation menu is currently open.
   *
   * Reads the `aria-expanded` attribute from the toggle button.
   *
   * @since 1.0.0
   *
   * @param {HTMLButtonElement} button The toggle button element.
   * @return {boolean} True if the menu is expanded, false otherwise.
   */
  function isMenuOpen(button) {
    return button.getAttribute('aria-expanded') === 'true';
  }

  // Initialize on DOM ready.
  document.addEventListener('DOMContentLoaded', function () {
    var navContainers = document.querySelectorAll('.site-navigation');
    navContainers.forEach(initNavigation);
  });
})();

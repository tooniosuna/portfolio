// ==========================================================================
// main.js
// Shared behavior for every page (index.html and credentials/index.html).
// Real interactive features (typewriter, collapsible timeline cards) get
// added slice by slice — this file currently only handles the mobile nav
// toggle, plus the Slice 0 pipeline check.
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Slice 0 pipeline check — safe to remove once real content replaces it.
  const jsCheck = document.getElementById("js-check");
  if (jsCheck) {
    jsCheck.textContent = "JavaScript loaded correctly ✅";
  }

  // Mobile nav toggle: shows/hides the nav menu on small screens and keeps
  // the hamburger icon + aria-expanded in sync with the open/closed state.
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close the menu automatically after tapping a link (mobile UX).
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }
});

/* Ethan Fong Coaching — main.js
 * Progressive-enhancement interactions: sticky header, mobile menu,
 * smooth anchor scrolling, scroll-reveal, and footer year.
 * Vanilla JS, no dependencies. Loaded with `defer`.
 */
(function () {
  "use strict";

  // 1. Flag that JS is on — CSS uses `.js .reveal` to hide before reveal.
  document.documentElement.classList.add("js");

  var prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  function init() {
    var header = document.getElementById("siteHeader");
    var navToggle = document.getElementById("navToggle");
    var primaryNav = document.getElementById("primaryNav");

    // 2. Sticky-header shadow on scroll.
    if (header) {
      var toggleScrolled = function () {
        if (window.scrollY > 10) {
          header.classList.add("scrolled");
        } else {
          header.classList.remove("scrolled");
        }
      };
      toggleScrolled();
      window.addEventListener("scroll", toggleScrolled, { passive: true });
    }

    // 3. Mobile menu open/close.
    var closeMenu = function () {
      if (!primaryNav) return;
      primaryNav.classList.remove("open");
      if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    };

    if (navToggle && primaryNav) {
      navToggle.addEventListener("click", function () {
        var isOpen = primaryNav.classList.toggle("open");
        navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      // Close when a nav link is clicked.
      var navLinks = primaryNav.querySelectorAll("a");
      for (var i = 0; i < navLinks.length; i++) {
        navLinks[i].addEventListener("click", closeMenu);
      }
    }

    // Close menu on Escape.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Esc") {
        closeMenu();
      }
    });

    // 4. Smooth scroll for in-page anchors, offset by header height.
    var headerHeight = function () {
      return header ? header.offsetHeight : 0;
    };

    var anchors = document.querySelectorAll('a[href^="#"]');
    for (var a = 0; a < anchors.length; a++) {
      anchors[a].addEventListener("click", function (e) {
        var href = this.getAttribute("href");
        if (!href || href === "#") return;

        var target = document.getElementById(href.slice(1));
        if (!target) return;

        e.preventDefault();

        var top =
          target.getBoundingClientRect().top +
          window.pageYOffset -
          headerHeight() -
          12;

        window.scrollTo({
          top: top < 0 ? 0 : top,
          behavior: prefersReducedMotion ? "auto" : "smooth"
        });

        // Move focus to the target for a11y without a second scroll jump.
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }
        target.focus({ preventScroll: true });
      });
    }

    // 5. Scroll-reveal via IntersectionObserver.
    var revealEls = document.querySelectorAll(".reveal");
    if (revealEls.length) {
      if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(
          function (entries, obs) {
            for (var e = 0; e < entries.length; e++) {
              if (entries[e].isIntersecting) {
                entries[e].target.classList.add("is-visible");
                obs.unobserve(entries[e].target);
              }
            }
          },
          { threshold: 0.1 }
        );
        for (var r = 0; r < revealEls.length; r++) {
          observer.observe(revealEls[r]);
        }
      } else {
        for (var n = 0; n < revealEls.length; n++) {
          revealEls[n].classList.add("is-visible");
        }
      }
    }

    // 6. Footer year.
    var yearEl = document.getElementById("year");
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

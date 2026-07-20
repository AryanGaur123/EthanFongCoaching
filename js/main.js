/* Ethan Fong Coaching — main.js
 * Progressive-enhancement interactions + tasteful premium motion for the
 * black-and-blue redesign: sticky header, mobile menu, smooth anchor
 * scrolling, scroll-reveal (with stagger), count-up numbers, pointer-reactive
 * aurora drift, and footer year.
 * Vanilla JS, no dependencies. Loaded with `defer`.
 */
(function () {
  "use strict";

  // 1. Flag that JS is on — CSS uses `.js .reveal` to hide before reveal.
  document.documentElement.classList.add("js");

  // Single motion flag. When reduced motion is preferred we skip / simplify
  // every decorative animation below (no parallax, no count-up — final values
  // are set immediately instead).
  var prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  // Coarse pointers (touch) get no cursor parallax.
  var coarsePointer = window.matchMedia
    ? window.matchMedia("(pointer: coarse)").matches
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
    //    CSS supplies the per-element transition-delay via `.reveal[data-delay]`,
    //    so we only add `is-visible` here (never clearing delays) — stagger is
    //    handled entirely in CSS.
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
          { threshold: 0.12 }
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

    // ---- Premium enhancements (all null-guarded + reduced-motion-aware) ----
    initCountUp();
    initAuroraParallax();
  }

  /* A. Count-up numbers.
   * For each `[data-count]`, animate 0 → target integer once it scrolls into
   * view, honoring optional data-prefix / data-suffix. Placeholders are kept
   * intact: we skip animation when data-count is missing / 0, the target is
   * non-numeric, or the visible text still contains a "[" bracket. Under
   * reduced motion (or no IntersectionObserver) we set the final value at once.
   */
  function initCountUp() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;

    var format = function (el, value) {
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      el.textContent = prefix + String(value) + suffix;
    };

    var animate = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var text = el.textContent || "";

      // Keep placeholder text: not a positive number, or "fill me in" bracket.
      if (!isFinite(target) || target <= 0 || text.indexOf("[") !== -1) {
        return;
      }

      if (prefersReducedMotion) {
        format(el, target);
        return;
      }

      var duration = 1200; // ~1.2s
      var start = null;
      // Ease-out cubic for a confident, decelerating count.
      var easeOut = function (t) {
        return 1 - Math.pow(1 - t, 3);
      };

      var step = function (now) {
        if (start === null) start = now;
        var elapsed = now - start;
        var progress = elapsed / duration;
        if (progress > 1) progress = 1;
        var current = Math.round(easeOut(progress) * target);
        format(el, current);
        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          format(el, target); // ensure exact landing
        }
      };

      window.requestAnimationFrame(step);
    };

    if ("IntersectionObserver" in window && !prefersReducedMotion) {
      var countObserver = new IntersectionObserver(
        function (entries, obs) {
          for (var e = 0; e < entries.length; e++) {
            if (entries[e].isIntersecting) {
              animate(entries[e].target);
              obs.unobserve(entries[e].target);
            }
          }
        },
        { threshold: 0.4 }
      );
      for (var i = 0; i < els.length; i++) {
        countObserver.observe(els[i]);
      }
    } else {
      // No observer support (or reduced motion): resolve final values now.
      for (var j = 0; j < els.length; j++) {
        animate(els[j]);
      }
    }
  }

  /* B. Pointer-reactive aurora drift.
   * On pointer move over the hero, gently translate the two aurora orbs in
   * opposite directions (parallax) using transform + rAF throttling. Disabled
   * under reduced motion or on coarse/touch pointers. Uses only transform, so
   * it never causes layout shift or horizontal scroll.
   */
  function initAuroraParallax() {
    if (prefersReducedMotion || coarsePointer) return;

    var hero = document.getElementById("hero");
    var aurora1 = document.querySelector(".aurora-1");
    var aurora2 = document.querySelector(".aurora-2");
    if (!hero || (!aurora1 && !aurora2)) return;

    var targetX = 0; // cursor offset from hero center
    var targetY = 0;
    var ticking = false;

    var render = function () {
      ticking = false;
      // Small parallax factors, opposite directions for depth.
      if (aurora1) {
        aurora1.style.transform =
          "translate3d(" + targetX * 0.03 + "px," + targetY * 0.03 + "px,0)";
      }
      if (aurora2) {
        aurora2.style.transform =
          "translate3d(" + targetX * -0.024 + "px," + targetY * -0.024 + "px,0)";
      }
    };

    var onMove = function (e) {
      var rect = hero.getBoundingClientRect();
      // Offset of the cursor from the hero's center.
      targetX = e.clientX - (rect.left + rect.width / 2);
      targetY = e.clientY - (rect.top + rect.height / 2);
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(render);
      }
    };

    hero.addEventListener("pointermove", onMove, { passive: true });

    // Ease the orbs back to rest when the pointer leaves the hero.
    hero.addEventListener(
      "pointerleave",
      function () {
        targetX = 0;
        targetY = 0;
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(render);
        }
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

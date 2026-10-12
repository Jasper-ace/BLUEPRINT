// ─────────────────────────────────────────────────────────────────────────────
// Blueprint Training — script.js
// ─────────────────────────────────────────────────────────────────────────────

// ── Sticky Navbar: Scroll Elevation ──────────────────────────────────────────
// The navbar stays fully visible at all times (sticky).
// Class toggle runs directly in the scroll event (no rAF delay) for
// zero-lag shadow response.
(function () {
    var navbar = document.querySelector('.site-navbar');
    if (!navbar) return;

    var TOP_ZONE = 10; // px - shadow appears once scrolled past this
    var isScrolled = false;

    window.addEventListener('scroll', function () {
        var shouldBeScrolled = window.scrollY > TOP_ZONE;
        if (shouldBeScrolled !== isScrolled) {
            isScrolled = shouldBeScrolled;
            navbar.classList.toggle('scrolled', isScrolled);
        }
    }, { passive: true });

    // Run once on load in case the page was refreshed mid-scroll
    isScrolled = window.scrollY > TOP_ZONE;
    navbar.classList.toggle('scrolled', isScrolled);
})();


// ── Smooth Scroll Helper ──────────────────────────────────────────────────────
/**
 * Smoothly scrolls to a section by ID, accounting for the fixed navbar height.
 * Uses a hand-rolled easing animation for consistent ~750ms duration across all
 * browsers (including those that don't support scroll-behavior: smooth).
 *
 * @param {string} targetId   - The section's `id` attribute (without `#`).
 * @param {number} [duration] - Scroll duration in milliseconds.
 */
function smoothScrollToSection(targetId, duration) {
    duration = duration || 750;
    var target = document.getElementById(targetId);
    if (!target) return;

    // Measure the fixed navbar height dynamically so it stays accurate if the
    // nav ever changes size (e.g., on resize or at different scroll positions).
    var navbar =
        document.querySelector('header[class*="fixed"]') ||
        document.querySelector('nav[class*="fixed"]');
    var navHeight = navbar ? navbar.getBoundingClientRect().height : 0;

    // 32px breathing room so the section heading sits comfortably below the navbar
    var targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 0;
    var startY = window.scrollY;
    var distance = targetTop - startY;
    var startTime = null;

    // Ease-in-out cubic — smooth, premium feel
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var elapsed = timestamp - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = easeInOutCubic(progress);

        window.scrollTo(0, startY + distance * eased);

        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// ── Intercept same-page anchor clicks ────────────────────────────────────────
// Attaches a capturing listener so it fires before browser default.
// Handles any <a href="#section"> that resolves to a local section on the
// current page. Works on all pages (index.html, facilities.html, etc.).
document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');

    // Only handle pure hash links (same-page navigation, e.g. href="#about")
    if (!href || !href.startsWith('#')) return;

    var targetId = href.slice(1);
    var targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    e.preventDefault();
    smoothScrollToSection(targetId);

    // Close mobile menus if open
    var mobileMenu = document.getElementById('mobile-menu');
    var mobileBackdropEl = document.getElementById('mobile-backdrop');
    if (mobileMenu) {
        mobileMenu.classList.add('-translate-x-full');
        if (mobileBackdropEl) {
            mobileBackdropEl.classList.add('opacity-0', 'pointer-events-none');
            mobileBackdropEl.classList.remove('opacity-100');
        }
        document.body.style.overflow = '';
        var btn = document.getElementById('mobile-menu-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    var mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) mobileNav.classList.add('-translate-x-full');
}, true);

// ── Cross-page hash navigation ────────────────────────────────────────────────
// When arriving on index.html via a hash URL (e.g. from facilities.html
// clicking "index.html#about"), suppress the browser's instant jump and
// instead animate a smooth scroll after the page fully loads.
(function handleHashOnLoad() {
    if (!window.location.hash) return;

    var targetId = window.location.hash.slice(1);

    // Cancel the browser's default anchor-jump by resetting to the top
    // immediately. This must run synchronously before the first paint.
    window.scrollTo(0, 0);

    // Once everything has loaded and painted, start the smooth animation.
    window.addEventListener('load', function () {
        setTimeout(function () {
            smoothScrollToSection(targetId, 800);
        }, 120); // small delay so layout/fonts have settled
    });
})();

// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // ── Hero Carousel ─────────────────────────────────────────────────────────
    var track = document.getElementById('carousel-track');
    var dots = document.querySelectorAll('[data-slide]');
    var currentIndex = 0;
    var slideCount = 2;

    function goToSlide(index) {
        if (!track) return;
        track.style.transform = 'translateX(-' + (index * 100) + '%)';

        dots.forEach(function (dot, i) {
            if (i === index) {
                dot.classList.remove('bg-on-primary/30', 'hover:bg-on-primary/60');
                dot.classList.add('bg-secondary-container', 'shadow-[0_0_10px_rgba(254,179,22,0.4)]');
            } else {
                dot.classList.add('bg-on-primary/30', 'hover:bg-on-primary/60');
                dot.classList.remove('bg-secondary-container', 'shadow-[0_0_10px_rgba(254,179,22,0.4)]');
            }
        });

        currentIndex = index;
    }

    dots.forEach(function (dot) {
        dot.addEventListener('click', function (e) {
            var index = parseInt(e.target.getAttribute('data-slide'));
            goToSlide(index);
        });
    });

    // Auto-advance carousel every 7 seconds
    if (track) {
        setInterval(function () {
            goToSlide((currentIndex + 1) % slideCount);
        }, 7000);
    }

    // ── Mobile Side Drawer (index.html) ───────────────────────────────────────
    var mobileMenuBtn = document.getElementById('mobile-menu-btn');
    var mobileMenuClose = document.getElementById('mobile-menu-close');
    var mobileMenuEl = document.getElementById('mobile-menu');
    var mobileBackdrop = document.getElementById('mobile-backdrop');

    function openMobileMenu() {
        if (!mobileMenuEl) return;
        mobileMenuEl.classList.remove('-translate-x-full');
        if (mobileBackdrop) {
            mobileBackdrop.classList.remove('opacity-0', 'pointer-events-none');
            mobileBackdrop.classList.add('opacity-100');
        }
        document.body.style.overflow = 'hidden'; // lock page scroll
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
    }

    function closeMobileMenu() {
        if (!mobileMenuEl) return;
        mobileMenuEl.classList.add('-translate-x-full');
        if (mobileBackdrop) {
            mobileBackdrop.classList.add('opacity-0', 'pointer-events-none');
            mobileBackdrop.classList.remove('opacity-100');
        }
        document.body.style.overflow = ''; // restore page scroll
        if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }

    // Open on burger click
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
    // Close on X button inside drawer
    if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
    // Close on backdrop tap
    if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileMenu);
    // Close when a nav link is tapped
    if (mobileMenuEl) {
        mobileMenuEl.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // ── Active Nav Highlight via IntersectionObserver ─────────────────────────
    // More accurate than scroll-offset: tracks which section is most visible.
    var sections = Array.from(document.querySelectorAll('section[id]'));
    var navLinks = document.querySelectorAll('.nav-link');

    if (sections.length > 0 && navLinks.length > 0) {
        var visibilityMap = {};

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    visibilityMap[entry.target.id] = entry.intersectionRatio;
                });

                // Activate the nav link for the most-visible section
                var activeSectionId = '';
                var maxRatio = 0;
                Object.keys(visibilityMap).forEach(function (id) {
                    if (visibilityMap[id] > maxRatio) {
                        maxRatio = visibilityMap[id];
                        activeSectionId = id;
                    }
                });

                navLinks.forEach(function (link) {
                    var linkHref = link.getAttribute('href');
                    // Match both "#about" and "index.html#about" forms
                    var isActive =
                        linkHref === ('#' + activeSectionId) ||
                        linkHref === ('index.html#' + activeSectionId);

                    link.classList.toggle('text-primary-container', isActive);
                    link.classList.toggle('active', isActive);
                    link.classList.toggle('text-on-surface-variant', !isActive);
                });
            },
            {
                // Top margin accounts for the fixed navbar (~80-96px);
                // bottom margin keeps the section from activating too late.
                rootMargin: '-96px 0px -40% 0px',
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
            }
        );

        sections.forEach(function (section) {
            visibilityMap[section.id] = 0;
            observer.observe(section);
        });
    }
});

// ── Facilities Page: Mobile Nav Slide-in ──────────────────────────────────────
(function () {
    var menuBtn = document.getElementById('facilities-menu-btn');
    var mobileNav = document.getElementById('mobile-nav');
    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', function () {
            mobileNav.classList.toggle('-translate-x-full');
        });
    }
})();

// ── Universal Nav Click Ripple ────────────────────────────────────────────────
// Works on all pages: targets any <a> inside a <nav> or <header>,
// plus links with class .nav-link
document.querySelectorAll('nav a, header a, .nav-link').forEach(function (link) {
    link.style.position = 'relative';
    link.style.overflow = 'hidden';
    link.style.display = link.style.display || 'inline-flex';

    link.addEventListener('click', function (e) {
        // Press scale animation
        this.classList.remove('nav-clicked');
        void this.offsetWidth; // force reflow to restart animation
        this.classList.add('nav-clicked');
        this.addEventListener('animationend', function () {
            this.classList.remove('nav-clicked');
        }.bind(this), { once: true });

        // Ripple bubble
        var ripple = document.createElement('span');
        ripple.classList.add('nav-ripple-el');
        var rect = this.getBoundingClientRect();
        ripple.style.top = (e.clientY - rect.top) + 'px';
        ripple.style.left = (e.clientX - rect.left) + 'px';
        this.appendChild(ripple);
        ripple.addEventListener('animationend', function () { ripple.remove(); });
    });
});
(function () {
    const link = document.getElementById('tos-link');
    const modal = document.getElementById('tos-modal');
    const panel = document.getElementById('tos-panel');
    const backdrop = document.getElementById('tos-backdrop');
    const closeBtn = document.getElementById('tos-close-btn');
    const acceptBtn = document.getElementById('tos-accept-btn');

    if (!link || !modal || !panel) return;

    function openModal() {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        // Allow the display change to apply before animating in
        requestAnimationFrame(() => {
            panel.classList.remove('scale-95', 'opacity-0');
            panel.classList.add('scale-100', 'opacity-100');
        });
    }

    function closeModal() {
        panel.classList.remove('scale-100', 'opacity-100');
        panel.classList.add('scale-95', 'opacity-0');
        document.body.style.overflow = '';
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 250);
    }

    link.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
    });

    [backdrop, closeBtn, acceptBtn].forEach((el) => {
        if (el) el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
})();
(function () {
    var overlay = document.getElementById('pl-overlay');
    if (!overlay) return; // not on a page with a preloader
    if (sessionStorage.getItem('bp_visited')) {
        overlay.style.display = 'none';
        return;
    }
    sessionStorage.setItem('bp_visited', '1');
    document.body.style.overflow = 'hidden';
    var content = document.querySelector('.pl-content');
    var stage = document.getElementById('pl-stage');
    // Aim the dive zoom at the centre of the logo
    function setOrigin() {
        content.style.transformOrigin = '50% 50%';
    }
    setOrigin();
    window.addEventListener('resize', setOrigin);
    // Kick off the exit animation after the logo has been on screen (1400ms hold)
    setTimeout(function () { setOrigin(); stage.classList.add('diving'); }, 1400);
    // The fade-up animation is 0.7s — start fading the overlay at 1400 + 700 = 2100ms
    // Then release body scroll immediately so the page is ready underneath
    setTimeout(function () {
        overlay.classList.add('pl-hidden');
        document.body.style.overflow = '';
        // Remove DOM node after the 0.6s CSS opacity transition fully completes
        setTimeout(function () { overlay.parentNode && overlay.parentNode.removeChild(overlay); }, 650);
    }, 2100);
})();
(function(){
  var ALL = document.querySelectorAll('.cc');
  if (!ALL || ALL.length === 0) return; // new courses.html uses .course-card — skip this block
  var activeCat = 'all';
  var searchVal = '';

  /* â”€â”€ Count badges on pills â”€â”€ */
  var counts = {};
  ALL.forEach(function(c){ counts[c.dataset.cat] = (counts[c.dataset.cat]||0)+1; });
  document.querySelectorAll('.fp[data-cat]').forEach(function(btn){
    var cat = btn.dataset.cat;
    var badge = btn.querySelector('.fp-badge');
    if(badge && cat!=='all') badge.textContent = counts[cat]||0;
  });

  /* â”€â”€ Master filter â”€â”€ */
  function applyFilter(){
    var visible = 0;
    ALL.forEach(function(card,i){
      var catMatch = activeCat==='all' || card.dataset.cat===activeCat;
      var titleEl = card.querySelector('.cc-header-title') || card.querySelector('.cc-title');
      var searchMatch = !searchVal || (titleEl && titleEl.textContent.toLowerCase().includes(searchVal));
      if(catMatch && searchMatch){
        card.classList.remove('hidden-card');
        card.style.animationDelay = (visible*0.035)+'s';
        visible++;
      } else {
        card.classList.add('hidden-card');
      }
    });
    var catNames = {'all':'All Programmes','language':'Language','management':'Management & Business','technology':'Technology & IT','creative':'Creative & Beauty','engineering':'Engineering'};
    document.querySelector('.courses-title').textContent = catNames[activeCat]||'All Programmes';
    var label = searchVal ? 'Found '+visible+' course'+(visible!==1?'s':'') : 'Showing '+visible+' of 27 courses';
    document.getElementById('result-label').textContent = label;
    var emptyEl = document.getElementById('empty-state');
    emptyEl.classList.toggle('visible', visible===0);
  }

  /* â”€â”€ Category filter (pills) â”€â”€ */
  window.filterCourses = function(btn){
    var cat = btn.dataset.cat;
    if(cat===activeCat && !searchVal) return;
    activeCat = cat;
    document.querySelectorAll('.fp').forEach(function(p){
      p.classList.toggle('active', p===btn);
      p.setAttribute('aria-selected', p===btn);
    });
    window.scrollTo({top:document.getElementById('main-content').offsetTop-140,behavior:'smooth'});
    applyFilter();
  };

  /* â”€â”€ Category strip chips â”€â”€ */
  window.filterByChip = function(cat){
    var btn = document.querySelector('.fp[data-cat="'+cat+'"]');
    if(btn) filterCourses(btn);
  };

  /* â”€â”€ Search â”€â”€ */
  var searchInput = document.getElementById('course-search');
  searchInput.addEventListener('input', function(){
    searchVal = this.value.toLowerCase().trim();
    applyFilter();
  });

  /* â”€â”€ Mobile nav (side drawer) â”€â”€ */
  var mobileMenu = document.getElementById('mobile-menu');
  var mobileBackdrop = document.getElementById('mobile-backdrop');
  var mobileMenuBtn = document.getElementById('mobile-menu-btn');
  var mobileMenuClose = document.getElementById('mobile-menu-close');
  function openMobileMenu() {
    mobileMenu.classList.remove('-translate-x-full');
    mobileBackdrop.classList.remove('opacity-0','pointer-events-none');
    mobileBackdrop.classList.add('opacity-100');
    mobileMenuBtn && mobileMenuBtn.setAttribute('aria-expanded','true');
  }
  function closeMobileMenu() {
    mobileMenu.classList.add('-translate-x-full');
    mobileBackdrop.classList.add('opacity-0','pointer-events-none');
    mobileBackdrop.classList.remove('opacity-100');
    mobileMenuBtn && mobileMenuBtn.setAttribute('aria-expanded','false');
  }
  if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
  if(mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
  if(mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileMenu);
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape') closeMobileMenu();
  });

  /* â”€â”€ Card enter key â”€â”€ */
  ALL.forEach(function(card){
    card.addEventListener('keydown',function(e){
      if(e.key==='Enter'){ var a=card.querySelector('.cc-enroll')||card.querySelector('.cc-arrow'); if(a) a.click(); }
    });
  });

  /* â”€â”€ Stagger animation on load â”€â”€ */
  ALL.forEach(function(card,i){ card.style.animationDelay = (i*0.04)+'s'; });
})();

/* ==========================================================================
   Consolidated Scripts from index.html (Interactive Photo Stack / Facilities)
   ========================================================================== */
(function () {
                                                                'use strict';

                                                                /* ════════════════════════════════════════════════
                                                                   BROWSING AN OLD PHOTO STACK — click, and the top
                                                                   print slides off to the side (alternating left/
                                                                   right, like a hand pushing it aside) revealing the
                                                                   next photo underneath, which was already resting
                                                                   at a slight tilt and straightens up as it comes
                                                                   to the front. The swiped photo is quietly recycled
                                                                   to the bottom of the pile.
                                                                ════════════════════════════════════════════════ */

                                                                var IMGS = [
                                                                        'facilities/IMG_7878.JPG',
                                                                        'facilities/IMG_7882.png',
                                                                        'facilities/IMG_7891.png',
                                                                        'facilities/IMG_7895.JPG',
                                                                        'facilities/IMG_7910.png',
                                                                        'facilities/IMG_7916.JPG',
                                                                        'facilities/IMG_7917.png',
                                                                        'facilities/IMG_7925.png'
                                                                ];
                                                                var TOTAL = IMGS.length;
                                                                var T_SWIPE = 480;   /* top photo sliding away, ms */
                                                                var T_SETTLE = 420;   /* rest of pile shifting up, ms */

                                                                var cur = 0;
                                                                var busy = false;
                                                                var hintGone = false;
                                                                var swipeDir = 1;    /* alternates 1 / -1 for left/right variety */
                                                                var cards, dots, veil, ripple, hint;

                                                                IMGS.forEach(function (src) { (new Image()).src = src; });

                                                                /* Resting look for a card at "offset" positions back in the pile (0 = top/visible) */
                                                                function styleFor(offset) {
                                                                        var capped = Math.min(offset, 4);
                                                                        /* alternate slight tilt per depth so it looks like a hand-stacked pile of prints */
                                                                        var tiltSign = (offset % 2 === 0) ? 1 : -1;
                                                                        var tilt = capped === 0 ? 0 : tiltSign * (2 + capped * 1.3);
                                                                        return {
                                                                                transform: 'translate(' + (tiltSign * capped * 3) + 'px,' + (capped * 4) + 'px) ' +
                                                                                        'rotate(' + tilt + 'deg) ' +
                                                                                        'scale(' + (1 - capped * 0.035) + ')',
                                                                                opacity: offset === 0 ? 1 : Math.max(0.4, 1 - capped * 0.15),
                                                                                zIndex: 50 - offset
                                                                        };
                                                                }

                                                                function applyStyle(card, s, withTransition) {
                                                                        card.style.transition = withTransition
                                                                                ? 'transform ' + T_SETTLE + 'ms cubic-bezier(0.25,0.9,0.35,1), opacity ' + T_SETTLE + 'ms ease'
                                                                                : 'none';
                                                                        card.style.transform = s.transform;
                                                                        card.style.opacity = s.opacity;
                                                                        card.style.zIndex = s.zIndex;
                                                                }

                                                                function init() {
                                                                        cards = document.querySelectorAll('.fg-card');
                                                                        dots = document.querySelectorAll('.fg-dot');
                                                                        veil = document.getElementById('fg-veil');
                                                                        ripple = document.getElementById('fg-ripple');
                                                                        hint = document.getElementById('fg-hint');

                                                                        cards.forEach(function (card, i) {
                                                                                card.style.backgroundImage = "url('" + IMGS[i] + "')";
                                                                                var offset = (i - cur + TOTAL) % TOTAL;
                                                                                applyStyle(card, styleFor(offset), false);
                                                                        });
                                                                }

                                                                function flashVeil() {
                                                                        if (!veil) return;
                                                                        veil.classList.add('fg-veil-flash');
                                                                        setTimeout(function () { veil.classList.remove('fg-veil-flash'); }, 90);
                                                                }

                                                                function triggerRipple() {
                                                                        if (!ripple) return;
                                                                        ripple.classList.remove('fg-ripple-go');
                                                                        void ripple.offsetWidth;
                                                                        ripple.classList.add('fg-ripple-go');
                                                                }

                                                                function goTo(next) {
                                                                        if (busy || next === cur) return;
                                                                        busy = true;

                                                                        if (!hintGone && hint) {
                                                                                hint.classList.add('fg-hint-gone');
                                                                                hintGone = true;
                                                                        }

                                                                        triggerRipple();

                                                                        var topCard = cards[cur];
                                                                        var dir = swipeDir;
                                                                        swipeDir *= -1; /* alternate direction next time, like a real hand shuffling prints */

                                                                        /* ── TOP PHOTO SLIDES/SWIPES OFF like pushing it aside by hand ── */
                                                                        topCard.style.zIndex = '55';
                                                                        topCard.style.transition =
                                                                                'transform ' + T_SWIPE + 'ms cubic-bezier(0.36,0.66,0.35,1),' +
                                                                                'opacity ' + T_SWIPE + 'ms ease-in';
                                                                        topCard.style.transform =
                                                                                'translate(' + (dir * 130) + '%, 18%) rotate(' + (dir * 22) + 'deg) scale(0.94)';
                                                                        topCard.style.opacity = '0';

                                                                        setTimeout(flashVeil, T_SWIPE * 0.3);

                                                                        /* ── REST OF THE PILE SHIFTS UP ONE POSITION, STRAIGHTENING AS IT NEARS THE TOP ── */
                                                                        for (var i = 0; i < TOTAL; i++) {
                                                                                if (i === cur) continue;
                                                                                var offset = (i - next + TOTAL) % TOTAL;
                                                                                applyStyle(cards[i], styleFor(offset), true);
                                                                        }

                                                                        dots[cur].classList.remove('fg-dot-active');
                                                                        dots[next].classList.add('fg-dot-active');

                                                                        /* ── Recycle the swiped photo to the bottom of the pile, no visible snap ── */
                                                                        setTimeout(function () {
                                                                                var backOffset = (cur - next + TOTAL) % TOTAL;
                                                                                applyStyle(topCard, styleFor(backOffset), false);
                                                                                cur = next;
                                                                                busy = false;
                                                                        }, T_SWIPE + 20);
                                                                }

                                                                window.fgAdvance = function () { goTo((cur + 1) % TOTAL); };
                                                                window.fgGoTo = function (n) { goTo(n); };

                                                                if (document.readyState === 'loading') {
                                                                        document.addEventListener('DOMContentLoaded', init);
                                                                } else {
                                                                        init();
                                                                }
                                                        })();

/* ==========================================================================
   Consolidated Scripts from courses.html (Filter, Search, Modal, Drawer)
   ========================================================================== */
(function() {
  "use strict";

  /* ── 1. Navbar elevation on scroll ── */
  var navbar = document.querySelector('.site-navbar');
  window.addEventListener('scroll', function() {
    if (!navbar) return;
    if (window.scrollY > 20) {
      navbar.classList.add('shadow-md');
    } else {
      navbar.classList.remove('shadow-md');
    }
  });

  /* ── 2. Mobile Drawer ── */
  var mobileMenuBtn = document.getElementById('mobile-menu-btn');
  var mobileMenuClose = document.getElementById('mobile-menu-close');
  var mobileMenu = document.getElementById('mobile-menu');
  var mobileBackdrop = document.getElementById('mobile-backdrop');

  function openMobileNav() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('-translate-x-full');
    if (mobileBackdrop) {
      mobileBackdrop.classList.remove('opacity-0', 'pointer-events-none');
      mobileBackdrop.classList.add('opacity-100');
    }
    document.body.style.overflow = 'hidden';
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMobileNav() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('-translate-x-full');
    if (mobileBackdrop) {
      mobileBackdrop.classList.add('opacity-0', 'pointer-events-none');
      mobileBackdrop.classList.remove('opacity-100');
    }
    document.body.style.overflow = '';
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileNav);
  if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileNav);
  if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileNav);
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', closeMobileNav);
    });
  }

  /* ── 3. Filter, Search, and Level Filter State ── */
  var pills = document.querySelectorAll('.filter-pill');
  var cards = document.querySelectorAll('.course-card');
  var searchInput = document.getElementById('course-search');
  var levelSelect = document.getElementById('level-filter');
  var countLabel = document.getElementById('courses-count-label');
  var emptyState = document.getElementById('empty-state');
  var clearFiltersBtn = document.getElementById('clear-filters-btn');
  var totalCards = cards.length;

  var currentCat = 'all';
  var currentLevel = 'any';
  var searchQuery = '';

  function matchesLevel(cardLevel, selectedLevel) {
    if (selectedLevel === 'any') return true;
    var normCard = (cardLevel || '').toLowerCase();
    // Rule: "All Levels" courses must appear under every level filter
    if (normCard === 'all-levels' || normCard === 'all levels') return true;
    return normCard === selectedLevel;
  }

  function update() {
    var visible = 0;

    cards.forEach(function(card) {
      var cat = card.dataset.cat || '';
      var lvl = card.dataset.level || '';
      var title = (card.querySelector('.course-title')?.textContent || '').toLowerCase();

      var catOk = (currentCat === 'all') || (cat === currentCat);
      var lvlOk = matchesLevel(lvl, currentLevel);
      var queryOk = (searchQuery === '') || (title.indexOf(searchQuery) !== -1);

      if (catOk && lvlOk && queryOk) {
        card.style.display = '';
        visible++;
      } else {
        card.style.display = 'none';
      }
    });

    // Update Showing X of Y courses count
    if (countLabel) {
      countLabel.textContent = 'Showing ' + visible + ' of ' + totalCards + ' courses';
    }

    // Update empty state
    if (emptyState) {
      if (visible === 0) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
      } else {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
      }
    }

    // Update dynamic counts on pills based on level & search
    updatePillCounts();
  }

  function updatePillCounts() {
    var catCounts = {
      all: 0,
      language: 0,
      management: 0,
      technology: 0,
      creative: 0,
      engineering: 0
    };

    cards.forEach(function(card) {
      var cat = card.dataset.cat || '';
      var lvl = card.dataset.level || '';
      var title = (card.querySelector('.course-title')?.textContent || '').toLowerCase();

      var lvlOk = matchesLevel(lvl, currentLevel);
      var queryOk = (searchQuery === '') || (title.indexOf(searchQuery) !== -1);

      if (lvlOk && queryOk) {
        catCounts.all++;
        if (catCounts.hasOwnProperty(cat)) {
          catCounts[cat]++;
        }
      }
    });

    Object.keys(catCounts).forEach(function(k) {
      var badge = document.getElementById('count-' + k);
      if (badge) {
        badge.textContent = catCounts[k];
      }
    });
  }

  // Category Pill Clicks
  pills.forEach(function(pill) {
    pill.addEventListener('click', function() {
      pills.forEach(function(p) {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');
      currentCat = pill.dataset.filter || 'all';
      update();
    });
  });

  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      searchQuery = searchInput.value.trim().toLowerCase();
      update();
    });
  }

  // Level filter select
  if (levelSelect) {
    levelSelect.addEventListener('change', function() {
      currentLevel = levelSelect.value;
      update();
    });
  }

  // Clear filters button
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', function() {
      currentCat = 'all';
      currentLevel = 'any';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      if (levelSelect) levelSelect.value = 'any';
      pills.forEach(function(p) {
        if (p.dataset.filter === 'all') {
          p.classList.add('active');
          p.setAttribute('aria-selected', 'true');
        } else {
          p.classList.remove('active');
        }
      });
      update();
    });
  }


  /* ── 4. Outline Modal (Gold Timeline & Keyboard Focus Trap) ── */
  var outlineModal = document.getElementById('course-outline-modal');
  var modalCloseBtn = document.getElementById('modal-close-btn');
  var modalFooterClose = document.getElementById('modal-footer-close');
  var modalTitle = document.getElementById('modal-course-title');
  var modalBadge = document.getElementById('modal-course-badge');
  var modalSubtitle = document.getElementById('modal-course-subtitle');
  var modalDescText = document.getElementById('modal-desc-text');
  var modalLevelVal = document.getElementById('modal-level-val');
  var modalWaLink = document.getElementById('modal-wa-link');
  var timelineGrid = document.getElementById('modal-timeline-grid');

  var lastFocusedElement = null;

  var sessionData = [
    { num: "Session 01", title: "Introduction & Core Fundamentals", desc: "Foundational principles, terminology, and baseline evaluation." },
    { num: "Session 02", title: "Essential Principles & Methods", desc: "Core concepts, frameworks, and practical conventions." },
    { num: "Session 03", title: "Standard Protocols & Tools", desc: "Industry workflows, standard operating tools, and safety/quality basics." },
    { num: "Session 04", title: "Applied Exercises & Demonstrations", desc: "Hands-on guided walkthroughs and real-time case practice." },
    { num: "Session 05", title: "Practical Case Studies & Analysis", desc: "Reviewing workplace scenarios and diagnosing key problem spaces." },
    { num: "Session 06", title: "Interactive Workshop & Lab", desc: "Collaborative studio exercise and intermediate tool execution." },
    { num: "Session 07", title: "Intermediate Techniques & Workflow", desc: "Refining precision, speed, and standard operational execution." },
    { num: "Session 08", title: "Tactical Execution & Scenarios", desc: "Unscripted scenario solving and advanced troubleshooting." },
    { num: "Session 09", title: "Industry Standards & Compliance", desc: "Regulatory alignment, best practices, and regional UAE benchmarks." },
    { num: "Session 10", title: "Collaborative Project Simulations", desc: "Team simulation, peer review, and complex scenario handling." },
    { num: "Session 11", title: "Skill Synthesis & Integration", desc: "Holistic review of all topics and pre-evaluation readiness." },
    { num: "Session 12", title: "Capstone Evaluation & Certification", desc: "Final practical assessment, instructor feedback, and certificate issuance." }
  ];

  function renderTimeline() {
    if (!timelineGrid) return;
    timelineGrid.innerHTML = '';
    sessionData.forEach(function(s, idx) {
      var card = document.createElement('div');
      card.className = 'timeline-session-card flex items-start gap-3 relative overflow-hidden';
      card.innerHTML = 
        '<div class="flex flex-col items-center flex-shrink-0 pt-0.5">' +
          '<span class="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100 mb-2"></span>' +
          '<span class="w-px h-full bg-amber-200"></span>' +
        '</div>' +
        '<div class="flex-1">' +
          '<div class="flex items-center justify-between gap-2 mb-1">' +
            '<span class="session-number-pill">' + s.num + '</span>' +
            '<span class="text-[11px] font-semibold text-slate-400">3 hrs</span>' +
          '</div>' +
          '<h4 class="text-xs font-bold text-slate-800 mb-1">' + s.title + '</h4>' +
          '<p class="text-[12px] text-slate-500 leading-relaxed">' + s.desc + '</p>' +
        '</div>';
      timelineGrid.appendChild(card);
    });
  }

  function openOutlineModal(cardEl, triggerBtn) {
    if (!outlineModal || !cardEl) return;
    lastFocusedElement = triggerBtn || document.activeElement;

    var title = cardEl.querySelector('.course-title')?.textContent.trim() || 'Course outline';
    var cat = cardEl.dataset.cat || '';
    var desc = cardEl.querySelector('.course-desc')?.textContent.trim() || '';
    var lvl = cardEl.querySelector('.level-badge span:last-child')?.textContent.trim() || 'All Levels';

    if (modalTitle) modalTitle.textContent = title;
    if (modalBadge) {
      modalBadge.innerHTML = '<span class="material-symbols-outlined text-[14px]">verified</span><span>' + cat.toUpperCase() + ' &bull; UAE CERTIFIED</span>';
    }
    if (modalSubtitle) {
      modalSubtitle.textContent = 'Structured 12-session training programme (3 hours per session) at Blueprint Training Centre, Dubai.';
    }
    if (modalDescText) modalDescText.textContent = desc;
    if (modalLevelVal) modalLevelVal.textContent = lvl;

    if (modalWaLink) {
      modalWaLink.href = 'https://wa.me/971559809491?text=' + encodeURIComponent('Hello, I am interested in enrolling in the ' + title + ' at Blueprint Training Centre. I would appreciate it if you could provide me with further information regarding the course schedule, fees, and enrollment requirements. Thank you, and I look forward to hearing from you.');
    }

    renderTimeline();
    outlineModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Move focus into modal
    setTimeout(function() {
      if (modalCloseBtn) modalCloseBtn.focus();
      else outlineModal.focus();
    }, 50);
  }

  function closeOutlineModal() {
    if (!outlineModal) return;
    outlineModal.classList.remove('active');
    document.body.style.overflow = '';

    // Return focus to trigger button
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  // Attach click to all outline buttons
  document.querySelectorAll('.view-outline-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var card = btn.closest('.course-card');
      openOutlineModal(card, btn);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeOutlineModal);
  if (modalFooterClose) modalFooterClose.addEventListener('click', closeOutlineModal);

  if (outlineModal) {
    outlineModal.addEventListener('click', function(e) {
      if (e.target === outlineModal) closeOutlineModal();
    });
  }

  // Keyboard navigation: Escape to close & Tab trap
  document.addEventListener('keydown', function(e) {
    if (!outlineModal || !outlineModal.classList.contains('active')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeOutlineModal();
      return;
    }

    if (e.key === 'Tab') {
      var focusableElements = outlineModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      var focusable = Array.prototype.filter.call(focusableElements, function(el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
      });
      if (focusable.length === 0) return;

      var firstElement = focusable[0];
      var lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });

  // Initial pill counts setup
  update();
})();

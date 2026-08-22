// ─────────────────────────────────────────────────────────────────────────────
// Blueprint Training — script.js
// ─────────────────────────────────────────────────────────────────────────────

// ── Auto-hide Navbar on Scroll ────────────────────────────────────────────────
// Hides the navbar when scrolling DOWN, reveals it when scrolling UP.
// Works universally on every page (index.html, facilities.html, etc.) by
// targeting the .site-navbar class.
(function () {
    var navbar = document.querySelector('.site-navbar');
    if (!navbar) return;

    var lastScrollY = window.scrollY;
    var ticking = false;

    // Minimum scroll distance before we react — prevents jitter on tiny nudges
    var THRESHOLD = 5;
    // Don't hide the navbar until the user has scrolled past this point
    var TOP_ZONE = 80;

    function updateNavbar() {
        var currentScrollY = window.scrollY;
        var diff = currentScrollY - lastScrollY;

        if (currentScrollY <= TOP_ZONE) {
            // Always show near the top of the page
            navbar.classList.remove('navbar-hidden');
        } else if (diff > THRESHOLD) {
            // Scrolling DOWN — hide
            navbar.classList.add('navbar-hidden');

            // If the mobile menu is open, close it gracefully
            var mobileMenuDrawer = document.getElementById('mobile-menu');
            var mobileBackdropEl2 = document.getElementById('mobile-backdrop');
            if (mobileMenuDrawer && !mobileMenuDrawer.classList.contains('-translate-x-full')) {
                mobileMenuDrawer.classList.add('-translate-x-full');
                if (mobileBackdropEl2) {
                    mobileBackdropEl2.classList.add('opacity-0', 'pointer-events-none');
                    mobileBackdropEl2.classList.remove('opacity-100');
                }
                document.body.style.overflow = '';
                var menuBtn = document.getElementById('mobile-menu-btn');
                if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
            }
        } else if (diff < -THRESHOLD) {
            // Scrolling UP — reveal
            navbar.classList.remove('navbar-hidden');
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    }, { passive: true });
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

    // 8px breathing room so the section heading isn't flush against the navbar
    var targetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
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
        var c = content.getBoundingClientRect();
        content.style.transformOrigin = '50% 50%';
    }
    setOrigin();
    window.addEventListener('resize', setOrigin);
    setTimeout(function () { setOrigin(); stage.classList.add('diving'); }, 1200);
    setTimeout(function () {
        overlay.classList.add('pl-hidden');
        document.body.style.overflow = '';
        setTimeout(function () { overlay.parentNode && overlay.parentNode.removeChild(overlay); }, 450);
    }, 2050);
})();

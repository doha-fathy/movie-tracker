<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MovieTracker</title>

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Font Awesome -->
    <link rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        crossorigin="anonymous" referrerpolicy="no-referrer">

    <!-- CSS files -->
    <link rel="stylesheet" href="Styles/Movies.css">
    <link rel="stylesheet" href="Styles/Style.css">

    <!-- All header styles are now in Style.css -->
</head>

<body>

    <!-- HEADER -->
    <header class="site-header">
        <div class="header-container">

            <!-- Logo -->
            <button onclick="if(typeof navigateTo === 'function') navigateTo('movies')"
                class="logo"
                aria-label="Home">
                <img src="Images/logo.png" alt="MovieMania Logo" onerror="this.style.display='none'">
                <span class="logo-text">MovieMania</span>
            </button>

            <!-- DESKTOP NAVIGATION -->
            <div id="navbar" class="desktop-nav">
                <div class="spinner"></div>
            </div>

            <!-- Hamburger button -->
            <button class="hamburger" id="hamburgerBtn" aria-label="Toggle menu" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>

        <!-- Mobile drawer -->
        <div class="mobile-drawer" id="mobileDrawer" aria-hidden="true">
            <div class="px-5 py-4 flex flex-col gap-3" id="mobile-nav"></div>
        </div>
    </header>

    <!-- Main content -->
    <main id="app">
        <div class="page-loader">
            <div class="spinner"></div>
        </div>
    </main>

    <script>
        (function() {
            const btn = document.getElementById('hamburgerBtn');
            const drawer = document.getElementById('mobileDrawer');
            const mobileNav = document.getElementById('mobile-nav');

            if (!btn || !drawer) return;

            function copyNavToMobile() {
                const navbar = document.getElementById('navbar');
                if (!navbar || !mobileNav || navbar.children.length === 0) return;

                mobileNav.innerHTML = '';
                Array.from(navbar.children).forEach(child => {
                    const clone = child.cloneNode(true);
                    clone.classList.add('w-full', 'text-left');
                    mobileNav.appendChild(clone);
                });

                const searchInput = mobileNav.querySelector('#globalSearchInput');

                if (searchInput) {
                    searchInput.oninput = function() {
                        const q = this.value.trim();

                        if (q.length < 2) return;

                        btn.classList.remove('open');
                        drawer.classList.remove('open');
                        btn.setAttribute('aria-expanded', 'false');

                        window.history.pushState({}, "", `?page=search&query=${encodeURIComponent(q)}`);

                        if (typeof router === 'function') {
                            router();
                        }
                    };
                }
            }

            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const isOpen = btn.classList.toggle('open');
                drawer.classList.toggle('open', isOpen);
                btn.setAttribute('aria-expanded', String(isOpen));
                if (isOpen) copyNavToMobile();
            });

            document.addEventListener('click', function(e) {
                if (!btn.contains(e.target) && !drawer.contains(e.target)) {
                    btn.classList.remove('open');
                    drawer.classList.remove('open');
                    btn.setAttribute('aria-expanded', 'false');
                }
            });

            const navbar = document.getElementById('navbar');
            if (navbar) {
                const observer = new MutationObserver(function() {
                    if (drawer.classList.contains('open')) copyNavToMobile();
                });
                observer.observe(navbar, {
                    childList: true,
                    subtree: true
                });
            }
        })();
    </script>

</body>

</html>
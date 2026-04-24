<?php
// footer.php
?>

<footer class="site-footer">
    <div class="footer-container">

        <!-- Logo & Tagline -->
        <div class="footer-logo">
            <span class="logo-text">MovieMania</span>
            <p class="tagline">Your ultimate movie companion.</p>
        </div>

        <!-- Links -->
        <div class="footer-links">

            <a href="#" class="footer-link"
                onclick="navigateTo('movies')">
                Movies
            </a>

            <a href="#" class="footer-link"
                onclick="navigateTo('upcoming')">
                Upcoming
            </a>

            <a href="#" class="footer-link"
                onclick="navigateTo('watchlist')">
                Watchlist
            </a>

        </div>

        <!-- Social Icons -->
        <div class="footer-social">
            <a href="#" class="social-icon">
                <i class="fa-brands fa-twitter"></i>
            </a>
            <a href="#" class="social-icon">
                <i class="fa-brands fa-instagram"></i>
            </a>
            <a href="#" class="social-icon">
                <i class="fa-brands fa-github"></i>
            </a>
        </div>

        <!-- Divider -->
        <div class="footer-divider"></div>

        <!-- Copyright -->
        <p class="footer-copyright">
            © <?php echo date('Y'); ?> MovieMania. All rights reserved.
        </p>

    </div>
</footer>
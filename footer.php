<?php
// footer.php
?>

<footer style="
background: rgba(0,0,0,0.8);
    margin-top: 60px;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 40px 24px 24px;
    color: rgba(255,255,255,0.4);
    font-family: ui-sans-serif, system-ui, sans-serif;
">
    <div style="
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
    ">

        <!-- Logo & Tagline -->
        <div style="text-align: center;">
            <span style="
                font-size: 1.4rem;
                font-weight: 800;
                background: linear-gradient(90deg, #6a0dad, #c1246b, #ff8c42);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                letter-spacing: -0.5px;
            ">MovieMania</span>
            <p style="margin: 6px 0 0; font-size: 0.8rem;">Your ultimate movie companion.</p>
        </div>

        <!-- Links -->
    <div style="display: flex; gap: 24px; flex-wrap: wrap; justify-content: center;">
   
        <a href="#" class="footer-link"
        onclick="navigateTo('movies')"
        style="color: rgba(255,255,255,0.4); font-size: 0.85rem; text-decoration: none;"
        onmouseover="this.style.color='#c1246b'"
        onmouseout="this.style.color='rgba(255,255,255,0.4)'">
        Movies
        </a>

        <a href="#" class="footer-link"
        onclick="navigateTo('upcoming')"
        style="color: rgba(255,255,255,0.4); font-size: 0.85rem; text-decoration: none;"
        onmouseover="this.style.color='#c1246b'"
        onmouseout="this.style.color='rgba(255,255,255,0.4)'">
        Upcoming
        </a>

        <a href="#" class="footer-link"
        onclick="navigateTo('watchlist')"
        style="color: rgba(255,255,255,0.4); font-size: 0.85rem; text-decoration: none;"
        onmouseover="this.style.color='#c1246b'"
        onmouseout="this.style.color='rgba(255,255,255,0.4)'">
        Watchlist
        </a>

    </div>

        <!-- Social Icons -->
        <div style="display: flex; gap: 16px;">
            <a href="#" style="
                width: 36px; height: 36px;
                border-radius: 50%;
                border: 1px solid rgba(255,255,255,0.12);
                display: flex; align-items: center; justify-content: center;
                color: rgba(255,255,255,0.4);
                text-decoration: none;
                transition: all 0.2s;
            "
            onmouseover="this.style.borderColor='#c1246b'; this.style.color='#c1246b';"
            onmouseout="this.style.borderColor='rgba(255,255,255,0.12)'; this.style.color='rgba(255,255,255,0.4)';">
                <i class="fa-brands fa-twitter" style="font-size: 0.85rem;"></i>
            </a>
            <a href="#" style="
                width: 36px; height: 36px;
                border-radius: 50%;
                border: 1px solid rgba(255,255,255,0.12);
                display: flex; align-items: center; justify-content: center;
                color: rgba(255,255,255,0.4);
                text-decoration: none;
                transition: all 0.2s;
            "
            onmouseover="this.style.borderColor='#c1246b'; this.style.color='#c1246b';"
            onmouseout="this.style.borderColor='rgba(255,255,255,0.12)'; this.style.color='rgba(255,255,255,0.4)';">
                <i class="fa-brands fa-instagram" style="font-size: 0.85rem;"></i>
            </a>
            <a href="#" style="
                width: 36px; height: 36px;
                border-radius: 50%;
                border: 1px solid rgba(255,255,255,0.12);
                display: flex; align-items: center; justify-content: center;
                color: rgba(255,255,255,0.4);
                text-decoration: none;
                transition: all 0.2s;
            "
            onmouseover="this.style.borderColor='#c1246b'; this.style.color='#c1246b';"
            onmouseout="this.style.borderColor='rgba(255,255,255,0.12)'; this.style.color='rgba(255,255,255,0.4)';">
                <i class="fa-brands fa-github" style="font-size: 0.85rem;"></i>
            </a>
        </div>

        <!-- Divider -->
        <div style="width: 100%; height: 1px; background: rgba(255,255,255,0.06);"></div>

        <!-- Copyright -->
        <p style="font-size: 0.78rem; margin: 0;">
            © <?php echo date('Y'); ?> MovieMania. All rights reserved.
        </p>

    </div>
</footer>
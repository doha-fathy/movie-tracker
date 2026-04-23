let isRouting = false;

async function router() {
    if (isRouting) return;
    isRouting = true;

    const params = new URLSearchParams(window.location.search);
    const page   = params.get("page") || "movies";
    const id     = params.get("id");

    const authStatus = await checkAuthStatus();

    if (page === "watchlist" && !authStatus.authenticated) {
        window.history.replaceState({}, "", "?page=login");
        renderNavbar(false);
        loadLoginPage();
        isRouting = false;
        return;
    }

    if (authStatus.authenticated && (page === "login" || page === "signup")) {
        window.history.replaceState({}, "", "?page=movies");
        renderNavbar(true);
        loadMoviesPage();
        isRouting = false;
        return;
    }

    renderNavbar(authStatus.authenticated);

    switch (page) {
        case "signup":    loadSignupPage();    break;
        case "login":     loadLoginPage();     break;
        case "movies":    loadMoviesPage();    break;
        case "upcoming":  loadUpcomingPage();  break;
        case "watchlist": loadWatchlistPage(); break;
        case "profile":   loadProfilePage();   break;
        case "details":   loadDetailsPage(id); break;
        default:          loadMoviesPage();
    }

    isRouting = false;
}

function navigateTo(page, id = null) {
    const url = id ? `?page=${page}&id=${id}` : `?page=${page}`;
    window.history.pushState({}, "", url);
    router();
}

window.addEventListener("popstate", router);

function renderNavbar(isAuthenticated) {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    
    if (!isAuthenticated) {
        navbar.innerHTML = `
            <button class="nav-link" onclick="navigateTo('movies')">Movies</button>
            <button class="nav-link" onclick="navigateTo('upcoming')">Upcoming</button>
            <button class="nav-link" onclick="navigateTo('watchlist')">Watch List</button>
            <div class="search-wrap">
                <input type="text" class="search-input" placeholder="Search movies..." id="globalSearchInput">
                <button class="search-btn" id="globalSearchBtn"><i class="fa-solid fa-magnifying-glass"></i></button>
            </div>
            <button class="btn-login" onclick="navigateTo('login')">Login</button>
            <button class="btn-signup" onclick="navigateTo('signup')">Sign Up</button>
        `;
    } else {
        navbar.innerHTML = `
            <button class="nav-link" onclick="navigateTo('movies')">Movies</button>
            <button class="nav-link" onclick="navigateTo('upcoming')">Upcoming</button>
            <button class="nav-link" onclick="navigateTo('watchlist')">Watch List</button>
            <div class="search-wrap">
                <input type="text" class="search-input" placeholder="Search movies..." id="globalSearchInput">
                <button class="search-btn" id="globalSearchBtn"><i class="fa-solid fa-magnifying-glass"></i></button>
            </div>
            <button class="nav-link" onclick="navigateTo('profile')">
                <i class="fa-solid fa-circle-user"></i> Profile
            </button>
            <button class="btn-logout" onclick="window.handleLogout()">Logout</button>
        `;
    }
    
    // Setup search
    setTimeout(() => {
        const searchInput = document.getElementById('globalSearchInput');
        const searchBtn = document.getElementById('globalSearchBtn');
        if (searchInput && searchBtn) {
            searchBtn.onclick = () => {
                const query = searchInput.value.trim();
                if (query) navigateTo('movies');
            };
            searchInput.onkeypress = (e) => {
                if (e.key === 'Enter') searchBtn.onclick();
            };
        }
    }, 50);
}

function loadSignupPage() {
    document.getElementById("app").innerHTML = `<div id="auth-container"></div>`;
    showRegisterForm();
}

function loadLoginPage() {
    document.getElementById("app").innerHTML = `<div id="auth-container"></div>`;
    showLoginForm();
}

function loadMoviesPage() {
    document.getElementById("app").innerHTML = `<div id="movies-content" class = "mt-20"></div>`;
    loadMovies();
}

function loadUpcomingPage() {
    document.getElementById("app").innerHTML = `<div id="upcoming-content" class = "mt-20"></div>`;
    loadUpcoming();
}

function loadWatchlistPage() {
    document.getElementById("app").innerHTML = `<div id="watchlist-container" class = "mt-20"></div>`;
    loadWatchlist();
}

function loadProfilePage() {
    document.getElementById("app").innerHTML = `<div id="profile-container" class = "mt-20"></div>`;
    renderProfilePage("profile-container");
}

function loadDetailsPage(id) {
    document.getElementById("app").innerHTML = `<div id="movie-details"></div>`;
    loadMovieDetails(id);
}

window.updateUIForAuth = async function () {
    const authStatus = await checkAuthStatus();
    if (authStatus.authenticated) {
        window.history.replaceState({}, "", "?page=movies");
        renderNavbar(true);
        loadMoviesPage();
    } else {
        window.history.replaceState({}, "", "?page=login");
        renderNavbar(false);
        loadLoginPage();
    }
};

window.handleLogout = async function () {
    if (confirm("Are you sure you want to logout?")) {
        await fetch("Auth.php?action=logout");
        window.history.replaceState({}, "", "?page=movies");
        renderNavbar(false);
        loadMoviesPage();
    }
};

router();
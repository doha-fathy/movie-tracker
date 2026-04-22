let isRouting = false;

async function router() {
    if (isRouting) return;
    isRouting = true;

    const params = new URLSearchParams(window.location.search);
    const page   = params.get("page") || "login";
    const id     = params.get("id");

    const authStatus  = await checkAuthStatus();
    const publicPages = ["signup", "login"];

    if (!authStatus.authenticated && !publicPages.includes(page)) {
        window.history.replaceState({}, "", "?page=login");
        renderNavbar(false);
        loadLoginPage();
        isRouting = false;
        return;
    }

    if (authStatus.authenticated && publicPages.includes(page)) {
        window.history.replaceState({}, "", "?page=movies");
        renderNavbar(true);
        loadMoviesPage();
        isRouting = false;
        return;
    }

    renderNavbar(authStatus.authenticated);

    // renderNavbar(true)

    switch (page) {
        case "signup":    loadSignupPage();    break;
        case "login":     loadLoginPage();     break;
        case "movies":    loadMoviesPage();    break;
        case "upcoming":  loadUpcomingPage();  break;
        case "watchlist": loadWatchlistPage(); break;
        case "profile":   loadProfilePage();   break;
        case "details":   loadDetailsPage(id); break;
        default:          loadLoginPage();
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
    if (!isAuthenticated) {
        navbar.innerHTML = "";
        return;
    }
    navbar.innerHTML = `
        <nav class="fixed top-0 w-full bg-black/90 text-white px-6 py-4 flex justify-between items-center z-50">
            <h1 class="text-red-500 font-bold text-2xl cursor-pointer"
                onclick="navigateTo('movies')">
                MovieTracker
            </h1>
            <div class="flex gap-6 font-semibold">
                <a onclick="navigateTo('movies')"    class="hover:text-red-400 cursor-pointer transition-all">Movies</a>
                <a onclick="navigateTo('upcoming')"  class="hover:text-red-400 cursor-pointer transition-all">Upcoming</a>
                <a onclick="navigateTo('watchlist')" class="hover:text-red-400 cursor-pointer transition-all">Watch List</a>
                <a onclick="navigateTo('profile')"   class="hover:text-red-400 cursor-pointer transition-all">Profile</a>
            </div>
            <button onclick="window.handleLogout()"
                class="bg-red-500 px-4 py-1 rounded-lg hover:bg-red-600 transition-all">
                Logout
            </button>
        </nav>
    `;
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
    document.getElementById("app").innerHTML = `<div id="movies-content"></div>`;
    loadMovies();       
}

function loadUpcomingPage() {
    document.getElementById("app").innerHTML = `<div id="upcoming-content"></div>`;
    loadUpcoming();      
}

function loadWatchlistPage() {
    document.getElementById("app").innerHTML = `<div id="watchlist-container"></div>`;
    loadWatchlist();    
}

function loadProfilePage() {
    document.getElementById("app").innerHTML = `<div id="profile-container"></div>`;
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
        window.history.replaceState({}, "", "?page=login");
        renderNavbar(false);
        loadLoginPage();
    }
};

router();

// renderNavbar(true);
// loadMoviesPage();
let isRouting = false;

async function router() {
  if (isRouting) return;
  isRouting = true;

  const params = new URLSearchParams(window.location.search);
  const page = params.get("page") || "movies";
  const id = params.get("id");
  const query = params.get("query") || ""; // added for search

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
    case "signup":
      loadSignupPage();
      break;
    case "login":
      loadLoginPage();
      break;
    case "movies":
      loadMoviesPage();
      break;
    case "upcoming":
      loadUpcomingPage();
      break;
    case "watchlist":
      loadWatchlistPage();
      break;
    case "profile":
      loadProfilePage();
      break;
    case "details":
      loadDetailsPage(id);
      break;
    case "verify_email":
      loadVerifyEmailPage();
      break;
    case "search":
      loadSearchPage(query);
      break; // added for search feature
    default:
      loadMoviesPage();
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
    const input = document.getElementById("globalSearchInput");
    const btn = document.getElementById("globalSearchBtn");
    if (!input || !btn) return;

    const go = () => {
      const q = input.value.trim();
      if (!q) return;
      window.history.pushState(
        {},
        "",
        `?page=search&query=${encodeURIComponent(q)}`,
      );
      router();
    };

    btn.onclick = go;
    input.onkeypress = (e) => {
      if (e.key === "Enter") go();
    };

    // keep search input filled when already on search page
    const p = new URLSearchParams(window.location.search);
    if (p.get("page") === "search" && p.get("query")) {
      input.value = decodeURIComponent(p.get("query"));
    }
  }, 50);
}

// Search results page
async function loadSearchPage(query) {
  const app = document.getElementById("app");

  app.innerHTML = `
        <div style="padding:80px 20px 40px; max-width:1400px; margin:0 auto;">
            <h2 style="color:#fff; font-size:1.3rem; font-weight:700; margin-bottom:8px;">
                Results for <span style="color:#C1246B;">"${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}"</span>
            </h2>
            <p id="search-count" style="color:rgba(255,255,255,0.5); margin-bottom:24px;">Searching…</p>
            <div id="search-grid" class="movies-row" style="flex-wrap:wrap; overflow:visible; gap:16px;"></div>
        </div>`;

  const results = await ApiOps.searchMovies(query);
  const grid = document.getElementById("search-grid");
  const count = document.getElementById("search-count");
  if (!grid || !count) return;

  if (!results || results.length === 0) {
    count.textContent = "No results found.";
    return;
  }

  count.textContent = `${results.length} result(s) found`;
  results.forEach((movie, i) => grid.appendChild(Movies.createCard(movie, i)));
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
  document.getElementById("app").innerHTML =
    `<div id="movies-content" class = "mt-20"></div>`;
  loadMovies();
}

function loadUpcomingPage() {
  document.getElementById("app").innerHTML =
    `<div id="upcoming-content" class = "mt-20"></div>`;
  loadUpcoming();
}

function loadWatchlistPage() {
  document.getElementById("app").innerHTML =
    `<div id="watchlist-container" class = "mt-20"></div>`;
  loadWatchlist();
}

function loadProfilePage() {
  document.getElementById("app").innerHTML =
    `<div id="profile-container" class = "mt-20"></div>`;
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

function loadVerifyEmailPage() {
    document.getElementById("app").innerHTML = `<div id="verify-email-container"></div>`;
    renderVerifyEmailPage("verify-email-container");
}

router();

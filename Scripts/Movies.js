const Movies = (() => {
  const SECTIONS = [
    {
      id: "daily-trend",
      title: "🔥 Daily Trending",
      fetcher: () => ApiOps.getTrendingDay(),
    },
    {
      id: "weekly-trend",
      title: "📈 Weekly Trending",
      fetcher: () => ApiOps.getTrendingWeek(),
    },
    {
      id: "popular",
      title: "⭐ Popular",
      fetcher: () => ApiOps.getPopularMovies(),
    },
    {
      id: "top-rated",
      title: "🏆 Top Rated",
      fetcher: () => ApiOps.getTopRatedMovies(),
    },
  ];

  async function init() {
    const page = document.getElementById("movies-content");
    if (!page) return;

    SECTIONS.forEach((section) => {
      const sectionEl = _buildSectionSkeleton(section);
      page.appendChild(sectionEl);
    });

    await Promise.all(SECTIONS.map((section) => _loadSection(section)));
  }

  function _buildSectionSkeleton(section) {
    const wrapper = document.createElement("div");
    wrapper.className = "movies-section";
    wrapper.id = `section-${section.id}`;

    const title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = section.title;

    const loading = document.createElement("div");
    loading.className = "row-loading";
    loading.id = `loading-${section.id}`;
    loading.textContent = "Loading...";

    const error = document.createElement("div");
    error.className = "row-error";
    error.id = `error-${section.id}`;
    error.style.display = "none";

    const scrollWrapper = document.createElement("div");
    scrollWrapper.className = "scroll-wrapper";

    const arrowLeft = document.createElement("button");
    arrowLeft.className = "scroll-arrow arrow-left";
    arrowLeft.textContent = "‹";

    const row = document.createElement("div");
    row.className = "movies-row";
    row.id = `row-${section.id}`;

    const arrowRight = document.createElement("button");
    arrowRight.className = "scroll-arrow arrow-right";
    arrowRight.textContent = "›";

    arrowLeft.addEventListener("click", () =>
      row.scrollBy({ left: -320, behavior: "smooth" })
    );

    arrowRight.addEventListener("click", () =>
      row.scrollBy({ left: 320, behavior: "smooth" })
    );

    scrollWrapper.appendChild(arrowLeft);
    scrollWrapper.appendChild(row);
    scrollWrapper.appendChild(arrowRight);

    wrapper.appendChild(title);
    wrapper.appendChild(loading);
    wrapper.appendChild(error);
    wrapper.appendChild(scrollWrapper);

    return wrapper;
  }

  async function _loadSection(section) {
    const row = document.getElementById(`row-${section.id}`);
    const loading = document.getElementById(`loading-${section.id}`);
    const error = document.getElementById(`error-${section.id}`);

    const movies = await section.fetcher();

    loading.style.display = "none";

    if (!movies || movies.length === 0) {
      error.textContent = "No movies found.";
      error.style.display = "block";
      return;
    }

    movies.forEach((movie, i) => {
      row.appendChild(_createCard(movie, i));
    });
  }

  function _createCard(movie, index) {
    const posterSrc = movie.poster || "assets/no-poster.jpg";
    const rating = movie.rating
      ? parseFloat(movie.rating).toFixed(1)
      : "N/A";

    const ratingClass =
      movie.rating >= 7 ? "high" : movie.rating >= 5 ? "mid" : "low";

    const card = document.createElement("div");
    card.className = "movie-card";
    card.style.animationDelay = `${index * 40}ms`;

    const posterDiv = document.createElement("div");
    posterDiv.className = "card-poster";

    const img = document.createElement("img");
    img.src = posterSrc;
    img.alt = movie.title;
    img.loading = "lazy";

    const ratingBadge = document.createElement("span");
    ratingBadge.className = `card-rating ${ratingClass}`;
    ratingBadge.textContent = `⭐ ${rating}`;

    posterDiv.appendChild(img);
    posterDiv.appendChild(ratingBadge);

    const infoDiv = document.createElement("div");
    infoDiv.className = "card-info";

    const titleP = document.createElement("p");
    titleP.className = "card-title";
    titleP.textContent = movie.title;

    const addBtn = document.createElement("button");
    addBtn.className = "btn-add-watchlist";
    addBtn.textContent = "+ Add to Watching List";
    addBtn.dataset.id = movie.id;

    infoDiv.appendChild(titleP);
    infoDiv.appendChild(addBtn);

    card.appendChild(posterDiv);
    card.appendChild(infoDiv);

    card.addEventListener("click", (e) => {
      if (e.target.closest(".btn-add-watchlist")) return;
      navigateTo("details", movie.id);
    });

    addBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await _addToWatchlist(movie, addBtn);
    });

    return card;
  }

  async function _addToWatchlist(movie, btn) {
    btn.disabled = true;
    btn.textContent = "Loading...";

    try {
      const fullDetails = await ApiOps.getMovieDetails(movie.id);
      console.log("Movie Details:", fullDetails);

      if (!fullDetails || !fullDetails.movie) {
        btn.textContent = "✗ Failed";
        btn.classList.add("btn-error");
        btn.disabled = false;
        return;
      }

      const movieData = fullDetails.movie;

      const response = await fetch("watchlist_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          tmdb_id: movieData.id, 
          title: movieData.title,
          poster_path: movieData.poster, // تأكدي إن ده صح
          release_date: movieData.release_date || "",
          description: movieData.overview || "",
        }),
      });

      const result = await response.json();
      console.log("Watchlist Response:", result);

      if (!result.success) {
        btn.textContent = result.message || "✗ Error";
        btn.classList.add("btn-error");
        btn.disabled = false;
      } else {
        btn.textContent = "✓ Added";
        btn.classList.add("btn-added");
      }
    } catch (err) {
      console.error("Watchlist Error:", err);
      btn.textContent = "✗ Failed";
      btn.classList.add("btn-error");
      btn.disabled = false;
    }
  }

  return { init };
})();

function loadMovies() {
  Movies.init();
}


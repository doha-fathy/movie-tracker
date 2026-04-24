const Upcoming = (() => {
  async function init() {
    const page = document.getElementById("upcoming-content");
    if (!page) return;

    await _loadUpcoming(page);
  }
  async function _loadUpcoming(page) {
    const loading = document.createElement("div");
    loading.className = "upcoming-loading";
    loading.textContent = "Loading upcoming movies...";
    page.appendChild(loading);
    const movies = await ApiOps.getUpcomingMovies();
    loading.remove();
    hideLoader();
    if (!movies || movies.length === 0) {
      const err = document.createElement("div");
      err.className = "upcoming-error";
      err.textContent = "No upcoming movies found.";
      page.appendChild(err);
      return;
    }
    const sorted = [...movies].sort((a, b) => {
      const dA =
        a.release_date && a.release_date !== "TBA"
          ? new Date(a.release_date)
          : Infinity;
      const dB =
        b.release_date && b.release_date !== "TBA"
          ? new Date(b.release_date)
          : Infinity;
      return dA - dB;
    });
    _renderTimeline(page, sorted);
  }
  function _renderTimeline(page, movies) {
    const groups = _groupByMonth(movies);
    Object.entries(groups).forEach(([monthLabel, items]) => {
      const monthSection = document.createElement("div");
      monthSection.className = "upcoming-month-section";
      const monthH3 = document.createElement("h3");
      monthH3.className = "upcoming-month-label";
      monthH3.textContent = monthLabel;
      const scrollWrapper = document.createElement("div");
      scrollWrapper.className = "scroll-wrapper";
      const arrowLeft = document.createElement("button");
      arrowLeft.className = "scroll-arrow arrow-left";
      arrowLeft.textContent = "‹";
      const row = document.createElement("div");
      row.className = "upcoming-row";
      const arrowRight = document.createElement("button");
      arrowRight.className = "scroll-arrow arrow-right";
      arrowRight.textContent = "›";
      arrowLeft.addEventListener("click", () =>
        row.scrollBy({ left: -320, behavior: "smooth" }),
      );
      arrowRight.addEventListener("click", () =>
        row.scrollBy({ left: 320, behavior: "smooth" }),
      );
      items.forEach((movie, i) => {
        const card = _createCard(movie, i);
        row.appendChild(card);
      });
      scrollWrapper.appendChild(arrowLeft);
      scrollWrapper.appendChild(row);
      scrollWrapper.appendChild(arrowRight);
      monthSection.appendChild(monthH3);
      monthSection.appendChild(scrollWrapper);
      page.appendChild(monthSection);
    });
  }
  function _groupByMonth(movies) {
    const groups = {};
    movies.forEach((movie) => {
      let label = "TBA";
      if (movie.release_date && movie.release_date !== "TBA") {
        const date = new Date(movie.release_date);
        label = date.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(movie);
    });
    return groups;
  }
  function _createCard(movie, index) {
    const posterSrc = movie.poster || "assets/no-poster.jpg";
    const releaseDate = _formatDate(movie.release_date);
    const card = document.createElement("div");
    card.className = "upcoming-card";
    card.style.animationDelay = `${index * 60}ms`;
    const posterDiv = document.createElement("div");
    posterDiv.className = "upcoming-poster";
    const img = document.createElement("img");
    img.src = posterSrc;
    img.alt = movie.title;
    img.loading = "lazy";
    const overlay = document.createElement("div");
    overlay.className = "upcoming-overlay";
    const dateBadge = document.createElement("span");
    dateBadge.className = "upcoming-date-badge";
    dateBadge.textContent = releaseDate;
    overlay.appendChild(dateBadge);
    posterDiv.appendChild(img);
    posterDiv.appendChild(overlay);
    const infoDiv = document.createElement("div");
    infoDiv.className = "upcoming-info";
    const titleP = document.createElement("p");
    titleP.className = "upcoming-title";
    titleP.textContent = movie.title;
    const dateP = document.createElement("p");
    dateP.className = "upcoming-date";
    dateP.textContent = releaseDate;
    infoDiv.appendChild(titleP);
    infoDiv.appendChild(dateP);
    card.appendChild(posterDiv);
    card.appendChild(infoDiv);
    card.addEventListener("click", () => {
      navigateTo("details", movie.id);
    });
    return card;
  }
  function _formatDate(dateStr) {
    if (!dateStr || dateStr === "TBA") return "TBA";
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return { init };
})();

// document.addEventListener('DOMContentLoaded', Upcoming.init);

function loadUpcoming() {
  Upcoming.init();
}

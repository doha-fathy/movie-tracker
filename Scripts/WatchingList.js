const API_URL_WatchingList = "watchlist_api.php";

//------------------------ LOAD WATCHLIST ------------------------
async function loadWatchlist() {
  try {
    const response = await fetch(API_URL_WatchingList);

    if (!response.ok) {
      throw new Error("There was a problem connecting to the server");
    }

    const data = await response.json();
    console.log("Watchlist Data:", data);

    if (!data.success) {
      console.error("Error from server:", data.message);
      return;
    }

    let moviesList = [];

    //  handle normal case
    if (Array.isArray(data.data)) {
      moviesList = data.data;
    }
    //  handle old nested response (fallback)
    else if (data.data && Array.isArray(data.data.data)) {
      moviesList = data.data.data;
    } else {
      console.error("Unexpected data format:", data);
    }

    console.log("Final moviesList:", moviesList);

    renderWatchlist(moviesList);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
  }
}

//------------------------ DELETE ------------------------
async function deleteFromWatchlist(movieId) {
  const confirmDelete = confirm(
    "Are you sure you want to remove this movie from the watchlist?",
  );
  if (!confirmDelete) return;

  try {
    const response = await fetch(API_URL_WatchingList, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
        movie_id: movieId,
      }),
    });

    if (!response.ok) {
      throw new Error("There was a problem connecting to the server");
    }

    const data = await response.json();
    console.log("Delete Response:", data);

    if (!data.success) {
      alert("Failed to delete the movie: " + data.message);
    } else {
      alert("Movie deleted successfully!");
      loadWatchlist(); // refresh
    }
  } catch (error) {
    console.error("Error deleting movie:", error);
    alert("Sorry, something went wrong while deleting.");
  }
}

//------------------------ RENDER ------------------------
function renderWatchlist(movies) {
  const container = document.getElementById("watchlist-container");
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(movies) || movies.length === 0) {
    container.innerHTML =
      "<p>Your watchlist is empty. Start adding movies now!</p>";
    return;
  }

  let html = "";
  movies.forEach((movie) => {
    const imageUrl = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "Images/posterPlaceholder.jpg";

    html += `
    <div class="movie-card" id="movie-card-${movie.id}" style="cursor:pointer;">
        <img src="${imageUrl}" alt="${movie.title}" onclick="navigateTo('details', '${movie.tmdb_id}')">
        <h3 class="movie-title-watchlist" onclick="navigateTo('details', '${movie.tmdb_id}')">${movie.title}</h3>
        <button onclick="event.stopPropagation(); deleteFromWatchlist(${movie.id})" class="watchlist-delete-btn">
            <i class="fa-solid fa-trash"></i> Delete
        </button>
    </div>
            `;
  });

  container.innerHTML = html;
}

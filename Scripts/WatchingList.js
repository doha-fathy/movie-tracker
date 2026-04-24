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
      hideLoader();
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
  } finally {
    hideLoader();
  }
}

//------------------------ DELETE ------------------------
async function deleteFromWatchlist(movieId) {
  const result = await Swal.fire({
    title: "Remove Movie?",
    text: "Are you sure you want to remove this from your watchlist?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#C1246B",
    cancelButtonColor: "rgba(255,255,255,0.1)",
    confirmButtonText: "Yes, remove it",
    cancelButtonText: "Cancel",
    background: "#1a0a12",
    color: "#fff",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(API_URL_WatchingList, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", movie_id: movieId }),
    });

    if (!response.ok) throw new Error("Server error");

    const data = await response.json();

    if (!data.success) {
      Swal.fire({
        title: "Error",
        text: data.message,
        icon: "error",
        background: "#1a0a12",
        color: "#fff",
        confirmButtonColor: "#C1246B",
      });
    } else {
      await Swal.fire({
        title: "Removed!",
        text: "Movie removed from your watchlist.",
        icon: "success",
        background: "#1a0a12",
        color: "#fff",
        confirmButtonColor: "#C1246B",
        timer: 2500,
        showConfirmButton: false,
      });
      loadWatchlist();
    }
  } catch (error) {
    console.error("Error deleting movie:", error);
    Swal.fire({
      title: "Oops!",
      text: "Something went wrong. Please try again.",
      icon: "error",
      background: "#1a0a12",
      color: "#fff",
      confirmButtonColor: "#C1246B",
    });
  }
}
//------------------------ RENDER ------------------------
function renderWatchlist(movies) {
  const container = document.getElementById("watchlist-container");
  if (!container) return;

  container.innerHTML = "";

  if (!Array.isArray(movies) || movies.length === 0) {
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.minHeight = "70vh";
    container.innerHTML = `<div class="flex flex-col items-center justify-center text-center px-4">
          <i class="fa-solid fa-film text-6xl mb-6 text-[rgba(193,36,107,0.4)]"></i>
          <h2 class="text-2xl font-bold text-white mb-2">Your watchlist is empty</h2>
          <p class="text-white/40 text-sm mb-6">Movies you save will appear here.</p>
          <button onclick="navigateTo('movies')"
                  class="px-6 py-2.5 rounded-lg text-white text-sm font-semibold border-2 border-transparent bg-[#C1246B] hover:bg-transparent hover:border-[#C1246B] transition-all duration-200">
              Browse Movies
          </button>
      </div>`;
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

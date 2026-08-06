function createMovieCard(movie, index = 0) {
  const posterSrc =
    movie.poster && movie.poster.trim() !== ""
      ? movie.poster
      : "Images/posterPlaceholder.jpg";

  const rating = movie.rating ? parseFloat(movie.rating).toFixed(1) : "N/A";
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

  img.onerror = () => {
    img.src = "Images/posterPlaceholder.jpg";
  };

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

  const btn = document.createElement("button");
  btn.className = "btn-add-watchlist";
  btn.textContent = "Show Details";

  infoDiv.appendChild(titleP);
  infoDiv.appendChild(btn);

  card.appendChild(posterDiv);
  card.appendChild(infoDiv);

  card.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    navigateTo("details", movie.id);
  });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    navigateTo("details", movie.id);
  });

  return card;
}

let modalResolve = null;

function ensureModalDom() {
  if (document.getElementById("customModalOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "customModalOverlay";
  overlay.className =
    "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300";
  overlay.innerHTML = `
    <div id="customModalBox"
      class="relative bg-[#1a0a12] text-white rounded-2xl shadow-[0_0_40px_rgba(193,36,107,0.35)]
             border border-[#C1246B]/30 w-[90%] max-w-[480px] p-6 scale-95 transition-transform duration-300">
      <button id="customModalClose"
        class="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none transition">
        &times;
      </button>
      <div id="customModalContent"></div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target.id === "customModalOverlay") cancelModal();
  });
  overlay
    .querySelector("#customModalClose")
    .addEventListener("click", cancelModal);
}

function openModalVisual() {
  const overlay = document.getElementById("customModalOverlay");
  overlay.classList.remove("opacity-0", "pointer-events-none");
  requestAnimationFrame(() => {
    overlay.querySelector("#customModalBox").classList.remove("scale-95");
    overlay.querySelector("#customModalBox").classList.add("scale-100");
  });
}

function closeModalVisual() {
  const overlay = document.getElementById("customModalOverlay");
  if (!overlay) return;
  overlay.classList.add("opacity-0", "pointer-events-none");
  overlay.querySelector("#customModalBox").classList.remove("scale-100");
  overlay.querySelector("#customModalBox").classList.add("scale-95");
}

function cancelModal() {
  closeModalVisual();
  if (modalResolve) {
    modalResolve({ confirmed: false });
    modalResolve = null;
  }
}

function showReviewModal({
  title = "Rate this movie",
  movieName = "",
  maxStars = 5,
  initialRating = 0,
  showComment = false,
  initialComment = "",
} = {}) {
  ensureModalDom();

  return new Promise((resolve) => {
    modalResolve = resolve;
    let rating = initialRating;

    document.getElementById("customModalContent").innerHTML = `
      <h2 class="text-2xl font-bold text-center mb-1">${title}</h2>
      <p class="text-gray-300 text-center mb-4">
          ${
            showComment
              ? `Rate <span class="font-semibold text-white">${movieName}</span> and share your thoughts`
              : `How would you rate <span class="font-semibold text-white">${movieName}</span>?`
          }
      </p>

      <div id="modalStars" class="flex justify-center gap-2 text-3xl mb-2">
        ${Array.from(
          { length: maxStars },
          (_, i) => `
          <i class="fa-regular fa-star cursor-pointer text-gray-400 hover:text-yellow-400 transition" data-rating="${i + 1}"></i>
        `,
        ).join("")}
      </div>
      <div id="modalRatingLabel" class="text-center text-yellow-400 font-semibold mb-4">
        ${initialRating ? `${initialRating} / ${maxStars}` : "Select a rating"}
      </div>

      ${
        showComment
          ? `
        <textarea id="modalComment" rows="4" placeholder="Write your review (optional)"
          class="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500
                 resize-none focus:outline-none focus:ring-1 focus:ring-[#C1246B]">${initialComment}</textarea>
      `
          : ""
      }

      <div class="flex justify-end gap-3 mt-5">
        <button id="modalCancelBtn"
          class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition">Cancel</button>
        <button id="modalConfirmBtn"
          class="px-4 py-2 rounded-lg bg-[#C1246B] hover:bg-white hover:text-[#C1246B]
                 border border-transparent hover:border-[#C1246B] transition">Submit</button>
      </div>
    `;

    const stars = document.querySelectorAll("#modalStars i");
    const label = document.getElementById("modalRatingLabel");

    function paintStars(upTo) {
      stars.forEach((s, i) => {
        s.className =
          i < upTo
            ? "fa-solid fa-star cursor-pointer text-yellow-400 transition"
            : "fa-regular fa-star cursor-pointer text-gray-400 hover:text-yellow-400 transition";
      });
    }
    paintStars(rating);

    stars.forEach((star, i) => {
      star.addEventListener("mouseenter", () => paintStars(i + 1));
      star.addEventListener("click", () => {
        rating = i + 1;
        label.classList.remove("text-red-400");
        label.textContent = `${rating} / ${maxStars}`;
      });
    });
    document
      .getElementById("modalStars")
      .addEventListener("mouseleave", () => paintStars(rating));

    document
      .getElementById("modalCancelBtn")
      .addEventListener("click", cancelModal);

    document.getElementById("modalConfirmBtn").addEventListener("click", () => {
      if (rating < 1) {
        label.textContent = "Please select a rating";
        label.classList.add("text-red-400");
        return;
      }
      const comment = showComment
        ? document.getElementById("modalComment").value.trim()
        : "";
      closeModalVisual();
      modalResolve = null;
      resolve({ confirmed: true, rating, comment });
    });

    openModalVisual();
  });
}

async function loadMovieDetails(movieId) {
  const movieDetails = await ApiOps.getMovieDetails(movieId);
  const movie = movieDetails.movie;
  const cast = movieDetails.cast;
  let reviews = movieDetails.reviews;
  const videos = movieDetails.videos;
  const recommendations = await ApiOps.getRecommendations(movieId);
  const similarMovies = await ApiOps.getSimilarMovies(movieId);

  hideLoader();
  const detailsContent = document.getElementById("movie-details");

  if (!movie) return;

  async function loadDBReviews() {
    try {
      const res = await fetch(`reviews_api.php?movie_id=${movieId}`);
      const dbData = await res.json();
      if (dbData.success) {
        const dbReviews = dbData.data.reviews.map((r) => ({
          username: r.username,
          content: r.comment,
          createdAt: r.created_at,
          rating: r.rating,
          avatar: r.photo,
        }));
        reviews = [...dbReviews, ...movieDetails.reviews];
      }
    } catch (e) {
      console.error("Failed to load DB reviews", e);
    }
  }

  await loadDBReviews();

  async function loadUserReview() {
    const response = await fetch(
      `reviews_api.php?movie_id=${movieId}&mine=true`,
    );
    const data = await response.json();

    return data.success ? data.data.review : null;
  }

  async function loadMovieLocal() {
    const response = await fetch(
      `reviews_api.php?movie_id=${movieId}&local=true`,
    );
    const data = await response.json();

    return data.success ? data.data.locals : null;
  }

  // helpers
  function formatRuntime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  async function formatRating(rating, vote_count) {
    const locals = await loadMovieLocal();
    let local_rate = locals?.local_rating_avg ?? 0;
    let local_count = locals?.local_rating_count ?? 0;
    console.log(local_rate);
    console.log(local_count);
    console.log(rating);
    console.log(vote_count);
    let total_rate =
      (rating * vote_count + local_rate * local_count) /
      (vote_count + local_count);
    // return `${Math.round(total_rate * 10)}%`;
    return { rate: total_rate.toFixed(1), count: local_count + vote_count };
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const duration = formatRuntime(movie.runtime);
  const rating = await formatRating(movie.rating, movie.vote_count);

  detailsContent.innerHTML = `
                     <div
                  class="pt-16 bg-cover bg-center text-white bg-[linear-gradient(to_right,rgba(27,9,8,0.9),rgba(27,9,8,0.7)),url('${movie.backdrop}')]"
                  >
                  <div class="p-6 w-full lg:w-[95%] mx-auto">
                  <div class="flex flex-col lg:flex-row flex-wrap">
                  <div class="w-full lg:w-1/3 mt-3 relative flex justify-center">
                  <div class="w-[340px] rounded-xl shadow-[1px_1px_15px_#FEE2FE]">
                <img
                src=${movie.poster}
                alt="Movie Image"
                class="w-full h-full rounded-xl"
                />
                </div>
                <button
                id = "trailerBtn"
                class="rounded-lg bg-red-500 py-2 px-4 font-bold text-white absolute bottom-10 left-1/2 -translate-x-1/2 hover:scale-110 hover:bg-red-600 hover:cursor-pointer transition-all duration-300"
                >
                <i class="fa-solid fa-circle-play"></i> Watch Trailer
                </button>
                </div>
                
                <div class="w-full lg:w-2/3 mt-3">
                <div class="flex flex-col gap-4 flex items-center lg:items-start">
                <h1 class="text-4xl font-bold my-2 text-center lg:text-start">
                ${movie.title}
                </h1>
                <div class="flex gap-2 items-center" id = "genres">
              
                </div>
                <div class="flex gap-3 items-center">
                <p class="pe-3 border-e border-gray-100/50">${movie.release_date}</p>
                <p>${duration}</p>
                </div>
                <div class="flex gap-3 items-center">
                <div class="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm border border-white/10">
                <div class="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-black">
                    <i class="fas fa-star text-lg"></i>
                </div>

                <div id="rateBadge">
                    <div class="flex items-baseline gap-1">
                        <span class="text-white text-xl font-bold">${rating.rate}</span>
                        <span class="text-gray-300 text-sm">/10</span>
                    </div>

                    <div class="text-xs text-gray-400">
                        ${rating.count.toLocaleString()} votes
                    </div>
                </div>
            </div>
                <p class="text-lg font-bold">Rating</p>
                </div>
                <div class="flex gap-5">
                <div
                id="rateBtn"
                class="bg-[#C1246B] h-10 w-10 rounded-full flex justify-center items-center hover:cursor-pointer hover:text-[#C1246B] hover:bg-white transition-all duration-300"
                title="Rate"
                  >
                  <i class="fa-solid fa-star-half-stroke"></i>
                  </div>
                  <div
                  id="watchlistBtn"
                  class="bg-[#C1246B] h-10 w-10 rounded-full flex justify-center items-center hover:cursor-pointer hover:text-[#C1246B] hover:bg-white transition-all duration-300"
                  title="Add to Watch List"
                  >
                  <i class="fa-solid fa-bookmark"></i>
                  </div>
                  </div>
                  <p class="text-gray-500 font-bold italic text-lg">
                  ${movie.tagline}
                  </p>
                  <div class="pt-3">
                  <p
                  class="font-bold pb-2 text-3xl border-b border-gray-100/25 lg:text-start text-center"
                  >
                  Overview
                  </p>
                  <p class="mt-2 lg:text-start text-center">
                  ${movie.overview}
                  </p>
                  </div>
                  </div>
                  </div>
                  </div>
                  </div>
                  </div>

                <div class="mt-8 p-6 w-full lg:w-[95%] mx-auto">
                  <h2 class="text-3xl font-bold mb-4 pb-2 text-white">Main Actors</h2>

                  <div
                    class="relative flex gap-10 overflow-x-auto pb-4 scroll-smooth custom-scroll-actors"
                    id = "actorsDiv"
                  >
                  </div>
                </div>

        <div class="mt-12 mb-6 w-[95%] mx-auto">

          <h2 class="text-3xl font-bold text-white mb-6">Reviews</h2>

          <div class="flex flex-col gap-4">
            <div class="pe-4 w-full">
              <div class="flex flex-col gap-6">
                <div id="reviewsContainer" class="flex flex-col gap-6">
                </div>

                <button
                  id="showMoreBtn"
                  class="group flex gap-2 hover:text-black text-[#C1246B] items-center text-lg hover:shadow-[2px_2px_20px_#ff95c5d4] hover:bg-gray-100/25 rounded-lg py-1 px-3 w-fit transition-all duration-300"
                >
                  <p>Show More</p>
                  <i
                    class="fa-solid fa-arrow-right-long group-hover:translate-x-2 transition-all duration-300"
                  ></i>
                </button>
              </div>
            </div>
          </div>

      <div class="mt-10 relative overflow-hidden rounded-2xl border border-[#C1246B]/30 bg-gradient-to-br from-[#2a0f1c] via-[#1a0a12] to-[#2a0f1c] p-8">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-[#C1246B]/20 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-[#E13661]/10 rounded-full blur-3xl"></div>

        <div class="relative flex flex-col items-center text-center gap-3">
          <div class="w-14 h-14 rounded-full bg-[#C1246B]/15 border border-[#C1246B]/40 flex items-center justify-center mb-1">
            <i class="fa-solid fa-comment-dots text-2xl text-[#E13661]"></i>
          </div>

          <h3 class="text-2xl font-bold text-white">Got thoughts on this movie?</h3>
          <p class="text-gray-400 max-w-md">
            Share your opinion about <span class="text-white font-semibold">${movie.title}</span> and help others decide what to watch next
          </p>

          <button
            id="addReviewBtn"
            type="button"
            class="mt-3 flex items-center justify-center gap-2
                  w-fit
                  px-10 py-3
                  bg-[#C1246B]
                  text-white
                  font-semibold
                  rounded-xl
                  shadow-lg shadow-[#C1246B]/40
                  hover:bg-[#E13661]
                  hover:scale-105
                  focus:outline-none focus:ring-2 focus:ring-[#E13661] focus:ring-offset-2 focus:ring-offset-[#1a0a12]
                  transition-all duration-300"
          >
            <i class="fa-solid fa-pen" aria-hidden="true"></i>
            Add Review
          </button>
        </div>
      </div>

        </div>

      <div
        class="flex gap-6 border-b border-gray-300/50 mb-6 mt-12 justify-center pb-2"
      >
        <button
          class="tab-btn px-4 py-2 font-semibold text-lg bg-[#C1246B] text-white rounded-2xl border border-red-400/25 hover:bg-white hover:text-[#C1246B] transition-all duration-300"
          data-tab="similar"
        >
          Similar Movies
        </button>

        <button
          class="tab-btn px-4 py-2 font-semibold text-lg bg-red-200/50 text-black rounded-2xl border border-red-400/25 hover:bg-white hover:text-[#C1246B] transition-all duration-300"
          data-tab="recommendations"
        >
          Recommendations
        </button>
      </div>

      
      <div id="similar" class="tab-content mb-6 w-full lg:w-[95%] mx-auto">
        <h2 class="text-xl font-bold text-white my-4">Similar Movies</h2>

        <div
          class="flex flex-col gap-3 lg:flex-wrap lg:flex-row lg:gap-0"
          id="similarMovies"
        >
            </div>
          </div>

        </div>
      </div>

       <div
        id="recommendations"
        class="tab-content mb-6 w-full lg:w-[95%] mx-auto hidden"
      >
        <h2 class="text-xl font-bold text-white my-4">Recommended Movies</h2>

        <div
          class="flex flex-col gap-3 lg:flex-wrap lg:flex-row lg:gap-0"
          id="recommendationsMovies"
        >

        </div>
      </div>
                  `;

  const watchlistBtn = document.getElementById("watchlistBtn");

  watchlistBtn.addEventListener("click", async () => {
    // UI Feedback: Change icon to a spinner or change color to show loading
    const icon = watchlistBtn.querySelector("i");
    const originalClass = icon.className;
    icon.className = "fa-solid fa-spinner fa-spin"; // Simple loading state

    try {
      const response = await fetch("watchlist_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster,
          release_date: movie.release_date || "",
          description: movie.overview || "",
          tmdb_rate: movie.rating,
          tmdb_count: movie.vote_count,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Success state: change background or icon
        watchlistBtn.classList.remove("bg-[#C1246B]");
        watchlistBtn.classList.add("bg-green-600");
        icon.className = "fa-solid fa-check";
        watchlistBtn.title = "Added to Watchlist";
      } else {
        // Handle failure (user not logged in)
        alert(result.message || "Failed to add to watchlist");
        icon.className = originalClass;
      }
    } catch (err) {
      console.error("Watchlist Error:", err);
      alert("Network error. Please try again.");
      icon.className = originalClass;
    }
  });

  function upsertReview(review) {
    const index = reviews.findIndex((r) => r.username === review.username);

    if (index !== -1) {
      if (review.rating !== undefined && review.rating !== null) {
        reviews[index].rating = review.rating;
      }

      if (review.content !== undefined && review.content !== null) {
        reviews[index].content = review.content;
      }

      if (review.createdAt !== undefined && review.createdAt !== null) {
        reviews[index].createdAt = review.createdAt;
      }
    } else {
      reviews.unshift(review);
    }

    renderReviews();
  }

  //------------------------ Rate button --------------------------------------

  const rateBtn = document.getElementById("rateBtn");

  rateBtn.addEventListener("click", async () => {
    const review = await loadUserReview();
    const initialRating = review?.rating ? Math.round(review.rating) : 0;

    const result = await showReviewModal({
      title: "Rate this movie",
      movieName: movie.title,
      maxStars: 10,
      initialRating,
      showComment: false,
    });

    if (!result.confirmed) return;

    const ratingOutOfTen = result.rating;

    try {
      const response = await fetch("reviews_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rate",
          movie: {
            tmdb_id: movieId,
            title: movie.title,
            poster_path: movie.poster,
            release_date: movie.release_date || "",
            description: movie.overview || "",
            tmdb_rate: movie.rating,
            tmdb_count: movie.vote_count,
          },
          rating: ratingOutOfTen,
        }),
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();

      if (!data.success) {
        alert(data.message || "Failed to submit rating.");
        return;
      }

      const updatedRating = await formatRating(movie.rating, movie.vote_count);
      const rateBadge = document.getElementById("rateBadge");
      rateBadge.innerHTML = `
        <div class="flex items-baseline gap-1">
          <span class="text-white text-xl font-bold">${updatedRating.rate}</span>
          <span class="text-gray-300 text-sm">/10</span>
        </div>

        <div class="text-xs text-gray-400">
          ${updatedRating.count.toLocaleString()} votes
        </div>
      `;

      upsertReview({
        username: data.data.username,
        content: data.data.comment,
        createdAt: data.data.created_at,
        rating: data.data.rating,
        avatar: data.data.photo,
      });

      // REASON: this part is too expensive for just adding a rate so it is commented
      // await loadDBReviews();
      // renderReviews();
    } catch (err) {
      console.error("Rate Error:", err);
      alert("Network error. Please try again.");
    }
  });

  //---------------------------------------------------------------------------

  const genresDiv = document.getElementById("genres");
  const actorsDiv = document.getElementById("actorsDiv");
  const similarDiv = document.getElementById("similarMovies");
  const recommendationsDiv = document.getElementById("recommendationsMovies");

  actorsDiv.innerHTML = "";
  similarDiv.innerHTML = "";
  recommendationsDiv.innerHTML = "";

  const trailer = videos.find((v) => v.type === "Trailer");

  const trailerBtn = document.getElementById("trailerBtn");

  if (trailer) {
    trailerBtn.addEventListener("click", () => {
      window.open(trailer.url, "_blank");
    });
  } else {
    trailerBtn.disabled = true;
    trailerBtn.innerText = "No Trailer Available";
    trailerBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  movie.genres.map((g) => {
    genresDiv.innerHTML += `<p class="w-fit px-3 rounded-xl bg-red-200/50">${g.name}</p>`;
  });

  cast.map((actor) => {
    actorsDiv.innerHTML += `<div class="min-w-[130px] text-center">
                      <img
                        src="${actor.profile || "Images/actorPlaceholder.jpg"}"
                        class="w-48 h-48 rounded-full object-cover mx-auto"
                      />
                      <p class="mt-2 font-semibold text-sm text-white">${actor.name}</p>
                      <p class="text-gray-500 text-xs italic">${actor.character}</p>
                    </div>`;
  });

  similarMovies.forEach((m, i) => {
    similarDiv.appendChild(createMovieCard(m, i));
  });

  recommendations.forEach((m, i) => {
    recommendationsDiv.appendChild(createMovieCard(m, i));
  });

  document.querySelectorAll(".showDetailsBtn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const movieId = e.currentTarget.dataset.movieId;
      navigateTo("details", movieId);
    });
  });

  const reviewsContainer = document.getElementById("reviewsContainer");
  const showMoreBtn = document.getElementById("showMoreBtn");

  let expanded = false;

  function renderReviews() {
    reviewsContainer.innerHTML = "";

    const reviewsWithComments = reviews.filter(
      (review) => review.content && review.content.trim() !== "",
    );

    const displayedReviews = expanded
      ? reviewsWithComments
      : reviewsWithComments.slice(0, 3);

    displayedReviews.forEach((review) => {
      const photo =
        review.avatar && review.avatar.trim()
          ? review.avatar
          : "uploads/default.png";

      const reviewDate = formatDate(review.createdAt);

      const starsOutOfTen = Math.round(review.rating || 0);

      reviewsContainer.innerHTML += `
      <div class="flex flex-col gap-3 border border-gray-400/25 rounded-xl p-4 shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300 bg-gray-200/50">

        <div class="flex gap-2 text-yellow-500">
          ${Array.from(
            { length: starsOutOfTen },
            () => `
            <i class="fa-solid fa-star text-xl"></i>
          `,
          ).join("")}
          ${Array.from(
            { length: 10 - starsOutOfTen },
            () => `
              <i class="fa-regular fa-star text-xl"></i>
            `,
          ).join("")}
        </div>
        <p class="text-lg font-semibold">
          ${review.content}
        </p>
        <div class="flex gap-2">
          <img
            src="${photo}"
            alt="${review.username}"
            class="h-16 w-16 rounded-full object-cover bg-white"
          />
          <div>
            <p class="text-xl font-bold">${review.username}</p>
            <p class="text-sm text-gray-600 font-medium">
              reviewed at ${reviewDate}
            </p>
          </div>
        </div>

      </div>
    `;
    });

    if (reviews.length <= 3) {
      showMoreBtn.classList.add("hidden");
      return;
    }
    showMoreBtn.classList.remove("hidden");

    showMoreBtn.innerHTML = expanded
      ? `Show Less <i class="fa-solid fa-arrow-right-long group-hover:translate-x-2 transition-all duration-300"></i>`
      : `Show More <i class="fa-solid fa-arrow-right-long group-hover:translate-x-2 transition-all duration-300"></i>`;
  }

  showMoreBtn.addEventListener("click", () => {
    expanded = !expanded;
    renderReviews();
  });

  renderReviews();

  //------------------------ Add Review button  -----------

  const addReviewBtn = document.getElementById("addReviewBtn");

  addReviewBtn.addEventListener("click", async () => {
    const result = await showReviewModal({
      title: "Add your review",
      movieName: movie.title,
      maxStars: 10,
      initialRating: 0,
      showComment: true,
    });

    if (!result.confirmed) return;

    const ratingOutOfTen = result.rating;
    const comment = result.comment;

    const movePayload = {
      tmdb_id: movieId,
      title: movie.title,
      poster_path: movie.poster,
      release_date: movie.release_date || "",
      description: movie.overview || "",
      tmdb_rate: movie.rating,
      tmdb_count: movie.vote_count,
    };

    try {
      // 1. Save the rating
      const rateResponse = await fetch("reviews_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rate",
          movie: movePayload,
          rating: ratingOutOfTen,
        }),
      });

      const rateData = await rateResponse.json();

      if (!rateData.success) {
        alert(rateData.message || "Failed to submit rating.");
        return;
      }

      let finalData = rateData;

      // 2. Save the comment separately (only if the user actually wrote one)
      if (comment && comment.trim() !== "") {
        const commentResponse = await fetch("reviews_api.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "comment",
            movie: movePayload,
            comment: comment,
          }),
        });

        const commentData = await commentResponse.json();

        if (!commentData.success) {
          alert(commentData.message || "Failed to submit review comment.");
          // rating was still saved, so continue with rateData for the UI update
        } else {
          finalData = commentData; // prefer the comment response since it includes the comment
        }
      }

      // Update rating badge
      const updatedRating = await formatRating(movie.rating, movie.vote_count);
      const rateBadge = document.getElementById("rateBadge");
      rateBadge.innerHTML = `
        <div class="flex items-baseline gap-1">
          <span class="text-white text-xl font-bold">${updatedRating.rate}</span>
          <span class="text-gray-300 text-sm">/10</span>
        </div>

        <div class="text-xs text-gray-400">
          ${updatedRating.count.toLocaleString()} votes
        </div>
      `;

      // Update local UI state with whichever response has the freshest comment/rating
      upsertReview({
        username: finalData.data.username,
        content:
          comment && comment.trim() !== "" ? comment : finalData.data.comment,
        createdAt: finalData.data.created_at,
        rating: rateData.data.rating, // always use the rating response's rating (authoritative)
        avatar: finalData.data.photo,
      });
    } catch (err) {
      alert("Network error. Please try again.");
    }
  });

  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      contents.forEach((c) => c.classList.add("hidden"));

      document.getElementById(target).classList.remove("hidden");

      tabs.forEach((tab) => {
        tab.classList.remove("bg-[#C1246B]", "text-white");
        tab.classList.add("bg-red-200/50", "text-bleck");
      });

      tab.classList.add("bg-[#C1246B]", "text-white");
      tab.classList.remove("bg-red-200/50", "text-black");
    });
  });
}
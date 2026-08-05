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

// const movieId = 550;
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
          avatar: r.photo
        }));
        reviews = [...dbReviews, ...movieDetails.reviews];
      }
    } catch (e) {
      console.error("Failed to load DB reviews", e);
    }
  }

  await loadDBReviews();

  async function loadUserReview(){
    const response = await fetch(`reviews_api.php?movie_id=${movieId}&mine=true`);
    const data = await response.json();

    return data.success ? data.data.review : null;
  }
  
    async function loadMovieLocal(){
    const response = await fetch(`reviews_api.php?movie_id=${movieId}&local=true`);
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
    let total_rate = (rating * vote_count + local_rate * local_count) / (vote_count + local_count);
    // return `${Math.round(total_rate * 10)}%`;
    return {rate: total_rate.toFixed(1), count: local_count + vote_count};
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

        <div class="mt-12 mb-6 w-full lg:w-[95%] mx-auto">
        <h2 class="text-3xl font-bold mb-4 pb-2 text-white">Reviews</h2>

        <div class="flex flex-col gap-4">
          <div class="pe-4 w-full">
            <div class="mt-4 flex flex-col gap-6">
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

           <div class="w-full">
            <form id="reviewForm" class="flex flex-col gap-4">
              <textarea
                id="reviewInput"
                placeholder="Write your review..."
                class="w-full p-4 rounded-lg border border-gray-300 resize-none focus:shadow-[2px_2px_20px_#fe90c1] focus:ring-1 focus:outline-none focus:ring-[#F87171]"
                rows="5"
              ></textarea>

              <button
                type="submit"
                class="w-fit px-5 py-2 bg-[#C1246B] hover:border-[#E13661] text-white rounded-lg hover:bg-white hover:text-[#E13661] border border-transparent transition-all duration-300"
              >
                Add Review
              </button>
            </form>
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
          tmdb_count: movie.vote_count
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
        // Handle failure (e.g., user not logged in)
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
    const index = reviews.findIndex(r => r.username === review.username);

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
    let rating = review?.rating ?? 0;
    const result = await Swal.fire({
      title: "",
      html: `
        <div class="flex flex-col items-center gap-4">
          <i class="fa-solid fa-star text-6xl text-yellow-400"></i>

          <h2 class="text-2xl font-bold">Rate this movie</h2>

          <p class="text-gray-300">
            How would you rate this title?
          </p>

          <div id="ratingStars" class="flex gap-2 text-3xl mt-2">
            ${Array.from({ length: 10 }, (_, i) => `
              <i class="fa-regular fa-star cursor-pointer hover:text-yellow-400 transition"
                data-rating="${i + 1}"></i>
            `).join("")}
          </div>

          <div id="selectedRating" class="text-lg font-semibold text-yellow-400 mt-2">
            Select a rating
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Rate",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#C1246B",
      cancelButtonColor: "rgba(255,255,255,0.1)",
      background: "#1a0a12",
      color: "#fff",
      width: "520px",
      didOpen: () => {

        const stars = document.querySelectorAll("#ratingStars i");
        const label = document.getElementById("selectedRating");

        stars.forEach((star, index) => {
          star.addEventListener("mouseenter", () => {
            stars.forEach((s, i) => {
              s.className = i <= index
                ? "fa-solid fa-star cursor-pointer text-yellow-400 transition"
                : "fa-regular fa-star cursor-pointer text-gray-400 transition";
            });
          });

          star.addEventListener("click", () => {
            rating = index + 1;
            label.textContent = `${rating} / 10`;
          });
        });

        document.getElementById("ratingStars")
          .addEventListener("mouseleave", () => {
            stars.forEach((s, i) => {
              s.className = i < rating
                ? "fa-solid fa-star cursor-pointer text-yellow-400 transition"
                : "fa-regular fa-star cursor-pointer text-gray-400 transition";
            });
          });
      }
    });

    if(result.isConfirmed){

      const response = await fetch("reviews_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rate",
          movie: { tmdb_id: movieId,
            title: movie.title,
            poster_path: movie.poster,
            release_date: movie.release_date || "",
            description: movie.overview || "",
            tmdb_rate: movie.rating,
            tmdb_count: movie.vote_count },
          rating: rating,
        }),
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
          title: "Rated!",
          text: "Rating added successfuly.",
          icon: "success",
          background: "#1a0a12",
          color: "#fff",
          confirmButtonColor: "#C1246B",
          timer: 2500,
          showConfirmButton: false,
        });

        rating = await formatRating(movie.rating, movie.vote_count);
         rateBadge = document.getElementById("rateBadge");
         rateBadge.innerHTML = `
         <div class="flex items-baseline gap-1">
              <span class="text-white text-xl font-bold">${rating.rate}</span>
              <span class="text-gray-300 text-sm">/10</span>
          </div>

          <div class="text-xs text-gray-400">
              ${rating.count.toLocaleString()} votes
          </div>
         `
          upsertReview({
            username: data.data.username,
            content: data.data.comment,
            createdAt: data.data.created_at,
            rating: data.data.rating,
            avatar: data.data.photo,
          });
          reviewInput.value = "";        

        // REASON: this part is too expensive for just adding a rate so it is commented
        // await loadDBReviews();
        // reviewInput.value = "";
        // renderReviews();
      }

    } else {
      return;
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
      review => review.content && review.content.trim() !== ""
    );

    const displayedReviews = expanded
      ? reviewsWithComments
      : reviewsWithComments.slice(0, 3);

    displayedReviews.forEach((review) => {

      const photo = review.avatar && review.avatar.trim()
      ? review.avatar
      : "uploads/default.png";

      const reviewDate = formatDate(review.createdAt);
      reviewsContainer.innerHTML += `
      <div class="flex flex-col gap-3 border border-gray-400/25 rounded-xl p-4 shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300 bg-gray-200/50">

        <div class="flex gap-2 text-yellow-500">
          ${Array.from({ length: review.rating }, () => `
            <i class="fa-solid fa-star"></i>
          `).join("")}
          ${Array.from({ length: (10 - review.rating) }, () => `
              <i class="fa-regular fa-star"></i>
            `).join("")}
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

  //==================================================================

  const reviewForm = document.getElementById("reviewForm");
  const reviewInput = document.getElementById("reviewInput");

  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const content = reviewInput.value.trim();
    if (!content) return;

    // const authStatus = await checkAuthStatus();
    // if (!authStatus.authenticated) {
    //   navigateTo("login");
    //   return;
    // }

    // const username = authStatus.user.username;
    const createdAt = new Date().toISOString().split("T")[0];

    try {
      const response = await fetch("reviews_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          movie: { tmdb_id: movieId,
            title: movie.title,
            poster_path: movie.poster,
            release_date: movie.release_date || "",
            description: movie.overview || "",
            tmdb_rate: movie.rating,
            tmdb_count: movie.vote_count
           },
          // rating: 6,
          comment: content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        upsertReview({
          username: data.data.username,
          content: data.data.comment,
          createdAt: data.data.created_at,
          rating: data.data.rating,
          avatar: data.data.photo,
        });
        reviewInput.value = ""; 
        
        // REASON: this part is too expensive for just adding a rate so it is commented
        // await loadDBReviews();
        // reviewInput.value = "";
        // renderReviews();
      } else {
        alert(data.message || "Failed to submit review.");
      }
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

// loadMovie(movieId);

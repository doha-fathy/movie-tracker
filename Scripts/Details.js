// const movieId = 550;
async function loadMovieDetails(movieId) {
  const movieDetails = await ApiOps.getMovieDetails(movieId);
  const movie = movieDetails.movie;
  const cast = movieDetails.cast;
  const reviews = movieDetails.reviews;
  const videos = movieDetails.videos;
  const recommendations = await ApiOps.getRecommendations(movieId);
  const similarMovies = await ApiOps.getSimilarMovies(movieId);

  const detailsContent = document.getElementById("movie-details");

  if (!movie) return;

  function formatRuntime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  const duration = formatRuntime(movie.runtime);

  function formatRating(rating) {
    return `${Math.round(rating * 10)}%`;
  }

  const rating = formatRating(movie.rating);

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

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
                <div
                class="w-14 h-14 bg-[#C1246B] rounded-full flex justify-center items-center"
                >
                <div
                class="w-12 h-12 bg-white rounded-full flex justify-center items-center text-[#C1246B] font-bold"
                >
                ${rating}
                </div>
                </div>
                <p class="text-lg font-bold">Rating</p>
                </div>
                <div class="flex gap-5">
                <div
                class="bg-[#C1246B] h-10 w-10 rounded-full flex justify-center items-center hover:cursor-pointer hover:text-[#C1246B] hover:bg-white transition-all duration-300"
                title="Add to Favorite"
                  >
                  <i class="fa-solid fa-heart"></i>
                  </div>
                  <div
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

  const genresDiv = document.getElementById("genres");
  const actorsDiv = document.getElementById("actorsDiv");
  const similarDiv = document.getElementById("similarMovies");
  const recommendationsDiv = document.getElementById("recommendationsMovies");

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

  similarMovies.map((movie) => {
    const similarRating = formatRating(movie.rating);
    similarDiv.innerHTML += ` <div class="p-2 w-full lg:w-1/3 xl:w-1/4 group hover:cursor-pointer rounded-2xl hover:shadow-[2px_2px_20px_#ff95c5d4]">
            <div class="flex flex-col items-center justify-center relative rounded-2xl">
              <div
                class="lg:w-[270px] w-full h-[250px] rounded-2xl overflow-hidden relative"
              >
                <img
                   src="${movie.poster || "Images/posterPlaceholder.jpg"}"
                  alt="Movie Poster"
                  class="w-full h-full rounded-2xl object-cover group-hover:scale-110 transition-all duration-300"
                />
              </div>
              <div
                class="flex flex-col gap-2 justify-center items-center bg-black/70 inset-0 absolute rounded-2xl text-white group-hover:opacity-100 opacity-0 transition-all duration-300"
              >
                <p class="font-bold text-xl text-center">${movie.title}</p>
                <p class="font-bold text-xl">
                  <i class="fa-solid fa-star text-yellow-500 text-sm"></i>
                  <span class="text-[#E13661] font-bold text-xl">${similarRating}</span>
                </p>
                <button class="flex items-center transition-all duration-300 hover:text-[#E13661] showDetailsBtn" data-movie-id=${movie.id}>
                  Show Details
                  <i
                    class="fa-solid fa-arrow-right-long transition-all duration-300 group-hover:translate-x-3"
                  ></i>
                </button>
              </div>
              </div>`;
  });

  recommendations.map((movie) => {
    const recommendationRating = formatRating(movie.rating);
    recommendationsDiv.innerHTML += ` <div class="p-2 w-full lg:w-1/3 xl:w-1/4 group hover:cursor-pointer rounded-2xl hover:shadow-[2px_2px_20px_#ff95c5d4]">
            <div class="flex flex-col items-center justify-center relative rounded-2xl">
              <div
                class="lg:w-[270px] w-full h-[250px] rounded-2xl overflow-hidden"
              >
                <img
                  src="${movie.poster || "../Images/posterPlaceholder.jpg"}"
                  alt="Movie Poster"
                  class="w-full h-full rounded-2xl object-cover group-hover:scale-110 transition-all duration-300"
                />
              </div>
              <div
                class="flex flex-col gap-2 justify-center items-center bg-black/70 inset-0 absolute rounded-2xl text-white group-hover:opacity-100 opacity-0 transition-all duration-300"
              >
                <p class="font-bold text-xl text-center">${movie.title}</p>
                <p class="font-bold text-xl">
                  <i class="fa-solid fa-star text-yellow-500 text-sm"></i>
                  <span class="text-[#E13661] font-bold text-xl">${recommendationRating}</span>
                </p>
                <button class="flex items-center transition-all duration-300 hover:text-[#E13661] showDetailsBtn" data-movie-id=${movie.id}>
                  Show Details
                  <i
                    class="fa-solid fa-arrow-right-long transition-all duration-300 group-hover:translate-x-3"
                  ></i>
                </button>
              </div>
              </div>`;
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

    const displayedReviews = expanded ? reviews : reviews.slice(0, 3);

    displayedReviews.forEach((review) => {
      const reviewDate = formatDate(review.createdAt);
      reviewsContainer.innerHTML += `
      <div class="flex flex-col gap-3 border border-gray-400/25 rounded-xl p-4 shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300 bg-gray-200/50">

        <div class="flex gap-2 text-yellow-500">
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
          <i class="fa-solid fa-star"></i>
        </div>
        <p class="text-lg font-semibold">
          ${review.content}
        </p>
        <div class="flex gap-2">
          <div class="bg-white flex justify-center items-center h-16 w-16 text-2xl rounded-full">
            <i class="fa-solid fa-user"></i>
          </div>
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

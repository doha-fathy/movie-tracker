
const API_URL_WatchingList = 'watchlist_api.php';


async function loadWatchlist() {
    try {
        
        const response = await fetch(API_URL_WatchingList);

        if (!response.ok) {
            throw new Error('There was a problem connecting to the server');
        }

        const data = await response.json();

       
        if (data.error) {
            console.error("Error from server:", data.error);
            return; 
        }

      
    console.log("Data returned from PHP:", data);

    let moviesList = [];

    if (Array.isArray(data)) {
    
    moviesList = data;
    } else if (data.movies) {
   
    moviesList = data.movies;
    } else if (data.data) {
    
    moviesList = data.data;
    } else {
    console.error("Unexpected data format: could not find a movies array!", data);
    }

renderWatchlist(moviesList);

    } catch (error) {
        console.error('Error fetching watchlist:', error);
    }
}



 
async function deleteFromWatchlist(movieId) {
    const confirmDelete = confirm("Are you sure you want to remove this movie from the watchlist?");
    if (!confirmDelete) return;

    try {
        const response = await fetch(API_URL_WatchingList, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'delete',
                movie_id: movieId
            })
        });

        if (!response.ok) {
            throw new Error('There was a problem connecting to the server');
        }

        const data = await response.json();

        if (data.error) {
            alert("Failed to delete the movie: " + data.error);
        } else {
            alert("Movie deleted successfully!");
            loadWatchlist(); 
        }

    } catch (error) {
        console.error('Error deleting movie:', error);
        alert("Sorry, something went wrong while deleting.");
    }
}



function renderWatchlist(movies) {
    const container = document.getElementById('watchlist-container');
    if (!container) return; 

    container.innerHTML = ''; 

    if (!movies || movies.length === 0) {
        container.innerHTML = '<p>Your watchlist is empty. Start adding movies now!</p>';
        return;
    }

    movies.forEach(movie => {
        
        const imageUrl = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://via.placeholder.com/500x750?text=No+Image';

        const movieCard = `
            <div class="movie-card" id="movie-card-${movie.id}">
                <img src="${imageUrl}" alt="${movie.title}">
                <h3>${movie.title}</h3>
                <button onclick="deleteFromWatchlist(${movie.id})">Delete</button>
            </div>
        `;
        container.innerHTML += movieCard;
    });
}
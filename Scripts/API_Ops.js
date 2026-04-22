const API_URL = 'API_Ops.php';

/**
 * A main and unified function to send requests to the server (PHP)
 * @param {string} action - The route name (e.g., 'upcoming', 'popular')
 * @param {object} params - Any additional data you need to send (such as movie ID or search query)
 * @returns {Promise<any>} - Returns the data or null in case of an error
 */
async function fetchFromAPI(action, params = {}) {
    try {
        const url = new URL(API_URL, window.location.href);
        url.searchParams.append('action', action);

      
        for (const key in params) {
            url.searchParams.append(key, params[key]);
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            return result.data;
        } else {
            console.error("API Error from PHP:", result.error);
            return null;
        }

    } catch (error) {
        console.error("Fetch Request Failed:", error);
        return null;
    }
}

const ApiOps = {

    getUpcomingMovies: async () => {
        return await fetchFromAPI('upcoming');
    },

    getPopularMovies: async () => {
        return await fetchFromAPI('popular');
    },

   
    getTopRatedMovies: async () => {
        return await fetchFromAPI('topRated');
    },

    
    discoverMovies: async (filters = {}) => {
        return await fetchFromAPI('discover', filters);
    },

   
    getMovieDetails: async (movieId) => {
        return await fetchFromAPI('movieDetails', { id: movieId });
    },

  
    searchMovies: async (searchQuery) => {
        return await fetchFromAPI('search', { query: searchQuery });
    },

  
    getAllGenres: async () => {
        return await fetchFromAPI('getAllGenres');
    },

  
    getTrendingDay: async () => {
        return await fetchFromAPI('trendingPerDay');
    },

    
    getTrendingWeek: async () => {
        return await fetchFromAPI('trendingPerWeek');
    },

 
    getRecommendations: async (movieId) => {
        return await fetchFromAPI('recommendations', { id: movieId });
    },

   
    getSimilarMovies: async (movieId) => {
        return await fetchFromAPI('similar', { id: movieId });
    }
};
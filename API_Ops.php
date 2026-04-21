<?php

header("Content-Type: application/json");

$routes = [
    'discover' => [
        'handler' => 'getMovieList',
        'endpoint' => 'discover/movie'
    ],
    'getAllGenres' => [
        'handler' => 'getAllGenres',
        'endpoint' => 'genre/movie/list'
    ],
    'popular' => [
        'handler' => 'getMovieList',
        'endpoint' => 'movie/popular'
    ],
    'topRated' => [
        'handler' => 'getMovieList',
        'endpoint' => 'movie/top_rated'
    ],
    'upcoming' => [
        'handler' => 'getMovieList',
        'endpoint' => 'movie/upcoming'
    ],
    'movieDetails' => [
        'handler' => 'getMovieDetails',
        'endpoint' => 'movie'
    ],
    'search' => [
        'handler' => 'getMovieList',
        'endpoint' => 'search/movie'
    ],
    'trendingPerDay' => [
        'handler' => 'getMovieList',
        'endpoint' => 'trending/movie/day'
    ],
    'trendingPerWeek' => [
        'handler' => 'getMovieList',
        'endpoint' => 'trending/movie/week'
    ],
    'recommendations' => [
        'handler' => 'getMovieList',
        'endpoint' => 'movie/{id}/recommendations'
    ],
    'similar' => [
        'handler' => 'getMovieList',
        'endpoint' => 'movie/{id}/similar'
    ],
    'reviews' => [
        'handler' => 'getReviews',
        'endpoint' => 'movie/{id}/reviews'
    ]
];


$action = $_GET['action'] ?? '';

if (!array_key_exists($action, $routes)) {
    respond(false, null, "Invalid API action");
}

$params = $_GET;
unset($params['action']);

$handler = $routes[$action]['handler'];
$endpoint = $routes[$action]['endpoint'];

if (!function_exists($handler)) {
    respond(false, null, "Handler not implemented");
}

$handler($params, $endpoint);

// only used when sending the response [success => error = null, failure => data = null]
function respond(bool $success, $data = null, $error = null) {
    echo json_encode([
        "success" => $success,
        "data" => $data,
        "error" => $error
    ]);
    exit;
}


// function filterParams($params) {
//     $cleaned = [];

//     foreach ($params as $key => $value) {

//         if ($value === null) continue;

//         if (is_string($value)) {
//             $value = trim($value);
//             if ($value === '') continue;
//         }

//         // optional: handle arrays (like with_ids, genres, etc.)
//         if (is_array($value)) {
//             $value = array_filter($value, fn($v) => $v !== null && $v !== '');
//             if (empty($value)) continue;
//         }

//         $cleaned[$key] = $value;
//     }

//     return $cleaned;
// }


function injectPathParam($endpoint, $params){
    // Inject dynamic path params (like {id})
    if (strpos($endpoint, '{id}') !== false) {

        if (!isset($params['id']) || !is_numeric($params['id'])) {
            respond(false, null, "Valid movie ID is required");
        }

        $endpoint = str_replace('{id}', $params['id'], $endpoint);

        unset($params['id']); //// don't include in query string
    }

    return $endpoint;
}


function filterParams($params) {
    $cleaned = [];

    foreach ($params as $key => $value) {

        if ($value === null) continue;

        if (is_string($value)) {
            $value = trim($value);
            if ($value === '') continue;
        }

        $cleaned[$key] = $value;
    }

    return $cleaned;
}


function buildTmdbUrl($endpoint, $params = []) {
    $baseurl = rtrim(getenv('BASE_URL'), '/');
    $apikey  = getenv('API_KEY');

    $params = filterParams($params);

    return $baseurl . "/" . ltrim($endpoint, '/')
        . "?api_key=" . $apikey
        . "&" . http_build_query($params);
}


function tmdbRequest($url) {
    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Accept: application/json"
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        return null;
    }

    $data = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        return null;
    }

    return $data;
}


function getMovieList($params, $endpoint) {

    $endpoint = injectPathParam($endpoint, $params);

    $url = buildTmdbUrl($endpoint, $params);

    $data = tmdbRequest($url);

    if (!$data) {
        respond(false, null, "Failed to fetch data");
        return;
    }

    $results = array_map(function ($item) {
        return [
            'id'     => $item['id'] ?? null,
            'title'  => $item['title'] ?? ($item['name'] ?? null),
            'rating' => $item['vote_average'] ?? null,
            'poster' => $item['poster_path'] ?? null,
        ];
    }, $data['results'] ?? []);

    respond(true, $results);
}


function getReviews($params, $endpoint) {

    $endpoint = injectPathParam($endpoint, $params);

    $url = buildTmdbUrl($endpoint, $params);

    $data = tmdbRequest($url);

    if (!$data) {
        respond(false, null, "Failed to fetch reviews");
        return;
    }

    $reviews = array_map(function ($item) {
        return [
            'film_id'        => $item['id'] ?? null,
            'username'  => $item['author_details']['username'] ?? null,
            'avatar'    => $item['author_details']['avatar_path']
                            ? "https://image.tmdb.org/t/p/w185" . $item['author_details']['avatar_path']
                            : null,
            'rating'    => $item['author_details']['rating'] ?? null,
            'content'   => isset($item['content'])
                            ? substr($item['content'], 0, 300) . '...'
                            : null,
            'createdAt' => isset($item['created_at'])
                            ? date("Y-m-d", strtotime($item['created_at']))
                            : null,
        ];
    }, $data['results'] ?? []);

    respond(true, $reviews);
}


function getAllGenres($params, $endpoint) {

    $url = buildTmdbUrl($endpoint, $params);

    $data = tmdbRequest($url);

    if (!$data) {
        respond(false, null, "Failed to fetch genres");
        return;
    }

    $genres = array_map(function ($item) {
        return [
            'id'   => $item['id'] ?? null,
            'name' => $item['name'] ?? null
        ];
    }, $data['genres'] ?? []);

    respond(true, $genres);
}



function getMovieDetails($params, $endpoint) {

    $endpoint = injectPathParam($endpoint, $params);

    $params['append_to_response'] = 'videos,credits';

    $url = buildTmdbUrl($endpoint, $params);

    $data = tmdbRequest($url);

    if (!$data) {
        respond(false, null, "Failed to fetch movie details");
    }

    // =========================
    ///////////// MOVIE CORE INFO \\\\\\\\\\\\\\\\\
    // =========================
    $movie = [
        'id' => $data['id'] ?? null,
        'title' => $data['title'] ?? null,
        'overview' => $data['overview'] ?? null,
        'tagline' => $data['tagline'] ?? null,
        'release_date' => $data['release_date'] ?? null,
        'runtime' => $data['runtime'] ?? null,
        'rating' => $data['vote_average'] ?? null,
        'vote_count' => $data['vote_count'] ?? null,
        'language' => $data['original_language'] ?? null,

        'poster' => $data['poster_path']
            ? "https://image.tmdb.org/t/p/w500" . $data['poster_path']
            : null,

        'backdrop' => $data['backdrop_path']
            ? "https://image.tmdb.org/t/p/original" . $data['backdrop_path']
            : null,

        'genres' => array_map(function ($g) {
            return [
                'id' => $g['id'] ?? null,
                'name' => $g['name'] ?? null
            ];
        }, $data['genres'] ?? []),
    ];

    // =========================
    ////////// VIDEOS (FILTERED) \\\\\\\\\\\
    // =========================
    $videos = array_values(array_filter(array_map(function ($v) {
        if (($v['site'] ?? '') !== 'YouTube') return null;

        return [
            'id' => $v['id'] ?? null,
            'name' => $v['name'] ?? null,
            'key' => $v['key'] ?? null,
            'type' => $v['type'] ?? null,
            'url' => isset($v['key'])
                ? "https://www.youtube.com//embed/" . $v['key']
                : null
        ];
    }, $data['videos']['results'] ?? [])));

    // =========================
    /////////// CAST (TOP 10 ONLY) \\\\\\\\\\\\
    // =========================
    $cast = array_slice(
        array_map(function ($c) {
            return [
                'id' => $c['id'] ?? null,
                'name' => $c['name'] ?? null,
                'character' => $c['character'] ?? null,
                'profile' => $c['profile_path']
                    ? "https://image.tmdb.org/t/p/w185" . $c['profile_path']
                    : null
            ];
        }, $data['credits']['cast'] ?? []),
        0,
        10
    );

    // =========================
    // FINAL RESPONSE
    // =========================
    respond(true, [
        'movie' => $movie,
        'videos' => $videos,
        'cast' => $cast
    ]);
}
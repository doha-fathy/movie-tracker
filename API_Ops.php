<?php

$env = parse_ini_file(__DIR__ . '/.env');
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
        'handler' => 'getUpcomingMovies',
        'endpoint' => 'movie/upcoming'
    ],
    'movieDetails' => [
        'handler' => 'getMovieDetails',
        'endpoint' => 'movie/{id}'
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
    ]
];

/**
 * Helper to get the RAW query parameters because PHP 
 * converts dots (.) and spaces ( ) to underscores automatically.
 */
function getRawQueryParams() {
    $params = [];
    $queryString = $_SERVER['QUERY_STRING'] ?? '';
    
    if (empty($queryString)) return [];

    // Split by &
    $pairs = explode('&', $queryString);
    foreach ($pairs as $pair) {
        $parts = explode('=', $pair, 2);
        if (count($parts) === 2) {
            $key = urldecode($parts[0]);
            $value = urldecode($parts[1]);
            $params[$key] = $value;
        }
    }
    return $params;
}


$action = $_GET['action'] ?? '';

if (!array_key_exists($action, $routes)) {
    respond(false, null, "Invalid API action");
}

$params = getRawQueryParams();
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
    ], JSON_PRETTY_PRINT);
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


function injectPathParam($endpoint, &$params){
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
    global $env;    
    $baseurl = rtrim($env['BASE_URL'], '/');
    $apikey  = $env['API_KEY'];

    $params = filterParams($params);

    $url = $baseurl . "/" . ltrim($endpoint, '/')
        . "?api_key=" . $apikey
        . "&" . http_build_query($params);

    // var_dump($url);
    return $url;
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
            'poster' => $item['poster_path']       // image size(w500) -> good for UI cards
                ? "https://image.tmdb.org/t/p/w500" . $item['poster_path']
                : null
        ];
    }, $data['results'] ?? []);

    respond(true, $results);
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

    $params['append_to_response'] = 'videos,credits,reviews';

    $url = buildTmdbUrl($endpoint, $params);
    $data = tmdbRequest($url);

    if (!$data) {
        respond(false, null, "Failed to fetch movie details");
    }

    // =========================
    // MOVIE CORE INFO
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

        'poster' => !empty($data['poster_path'])
            ? "https://image.tmdb.org/t/p/w500" . $data['poster_path']
            : null,

        'backdrop' => !empty($data['backdrop_path'])
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
    // VIDEOS (YouTube only)
    // =========================
    $videos = array_values(array_filter(array_map(function ($v) {
        if (($v['site'] ?? '') !== 'YouTube') return null;

        return [
            'id' => $v['id'] ?? null,
            'name' => $v['name'] ?? null,
            'key' => $v['key'] ?? null,
            'type' => $v['type'] ?? null,
            'url' => isset($v['key'])
                ? "https://www.youtube.com/embed/" . $v['key']
                : null
        ];
    }, $data['videos']['results'] ?? [])));

    // =========================
    // CAST (Top 10)
    // =========================
    $cast = array_slice(array_map(function ($c) {
        return [
            'id' => $c['id'] ?? null,
            'name' => $c['name'] ?? null,
            'character' => $c['character'] ?? null,
            'profile' => !empty($c['profile_path'])
                ? "https://image.tmdb.org/t/p/w185" . $c['profile_path']
                : null
        ];
    }, $data['credits']['cast'] ?? []), 0, 10);

    // =========================
    // CREW (Optional but useful)
    // =========================
    $crew = [
        'director' => null,
        'writers' => []
    ];

    foreach ($data['credits']['crew'] ?? [] as $member) {
        if (($member['job'] ?? '') === 'Director') {
            $crew['director'] = [
                'id' => $member['id'] ?? null,
                'name' => $member['name'] ?? null
            ];
        }

        if (in_array($member['job'] ?? '', ['Writer', 'Screenplay', 'Story'])) {
            $crew['writers'][] = [
                'id' => $member['id'] ?? null,
                'name' => $member['name'] ?? null
            ];
        }
    }

    // =========================
    // REVIEWS
    // =========================
    $reviews = array_slice(array_map(function ($item) {

        // Handle avatar edge case
        $avatarPath = $item['author_details']['avatar_path'] ?? null;

        if ($avatarPath) {
            $avatar = str_starts_with($avatarPath, '/http')
                ? substr($avatarPath, 1)
                : "https://image.tmdb.org/t/p/w185" . $avatarPath;
        } else {
            $avatar = null;
        }

        // Safe content trimming
        $content = $item['content'] ?? null;
        $shortContent = $content
            ? (strlen($content) > 300 ? substr($content, 0, 300) . '...' : $content)
            : null;

        return [
            'film_id'  => $item['id'] ?? null,
            'username' => $item['author_details']['username'] ?? null,
            'avatar'   => $avatar,
            'rating'   => $item['author_details']['rating'] ?? null,
            'content'  => $shortContent,
            'createdAt'=> isset($item['created_at'])
                ? date("Y-m-d", strtotime($item['created_at']))
                : null,
        ];

    }, $data['reviews']['results'] ?? []), 0, 5); // limit to 5

    // =========================
    // FINAL RESPONSE
    // =========================
    respond(true, [
        'movie'   => $movie,
        'videos'  => $videos,
        'cast'    => $cast,
        'crew'    => $crew,
        'reviews' => $reviews
    ]);
}


function getUpcomingMovies($params, $endpoint) {

    $endpoint = injectPathParam($endpoint, $params);

    $url = buildTmdbUrl($endpoint, $params);

    $data = tmdbRequest($url);

    if (!$data) {
        respond(false, null, "Failed to fetch upcoming movies");
        return;
    }

    $results = array_map(function ($item) {
        return [
            'id'           => $item['id'] ?? null,
            'title'        => $item['title'] ?? ($item['name'] ?? null),
            'release_date' => $item['release_date'] ?? 'TBA',
            'poster'       => !empty($item['poster_path'])
                ? "https://image.tmdb.org/t/p/w500" . $item['poster_path']
                : null,
        ];
    }, $data['results'] ?? []);

    respond(true, $results);
}
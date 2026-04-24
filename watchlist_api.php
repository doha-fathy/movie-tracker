<?php
require_once "DB_Ops.php";

header('Content-Type: application/json');
session_start();


//------------------------ Unified JSON response helper ---------------------------
function respond($success, $message, $data = null, $status = 200)
{
    http_response_code($status);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ]);
    exit;
}

//------------------------ Auth check ---------------------------------------------


if (!isset($_SESSION['user_id'])) {
    respond(false, "Unauthorized", null, 401);
}

//------------------------ Check if user is verified -----------------------------
$userOps = new UserOps();
$userResponse = $userOps->getUserById($_SESSION['user_id']);

if (!$userResponse['success'] || empty($userResponse['data']['is_verified'])) {
    respond(false, "Please verify your email first", null, 403);
}

$watchlist = new WatchlistOps();

try {

    //----------------------- GET → Fetch user watchlist ---------------------------
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {


        $result = $watchlist->getUserMovies($_SESSION['user_id']);

        respond(
            $result['success'],
            $result['message'] ?? "Watchlist fetched successfully",
            $result['data']
        );
    }

    //------------------------ POST → Add / Delete --------------------------------
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {



        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);

        // JSON validation
        if (!$data || json_last_error() !== JSON_ERROR_NONE) {
            respond(false, "Invalid JSON format", null, 400);
        }

        $action = $data['action'] ?? null;

        // Validate action
        $allowedActions = ['add', 'delete'];
        if (!in_array($action, $allowedActions)) {
            respond(false, "Invalid action. Allowed: add, delete", null, 400);
        }

        //------------------------ ADD ------------------------
        if ($action === 'add') {

            $movieId = $data['tmdb_id'] ?? null;
            $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

            if (!$movieId) {
                respond(false, "Invalid tmdb_id", null, 400);
            }

            $movieData = [
                'tmdb_id' => $movieId,
                'title' => $data['title'] ?? '',
                'poster_path' => $data['poster_path'] ?? '',
                'release_date' => $data['release_date'] ?? '',
                'description' => $data['description'] ?? ''
            ];

            $result = $watchlist->addToWatchlist($_SESSION['user_id'], $movieData);

            if (!$result['success']) {
                respond(false, $result['message'], null, 400);
            }

            respond(true, $result['message'], null);
        }

        //------------------------ DELETE ------------------------
        if ($action === 'delete') {

            $movieId = $data['movie_id'] ?? null;
            $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

            if (!$movieId) {
                respond(false, "Invalid movie_id", null, 400);
            }

            $result = $watchlist->removeFromWatchlist($_SESSION['user_id'], $movieId);

            if (!$result['success']) {
                respond(false, $result['message'], null, 400);
            }

            respond(true, $result['message'], null);
        }
    }
    
    //------------------------ Method not allowed ---------------------------------
    respond(false, "Method not allowed", null, 405);
} catch (Throwable $e) {
    respond(false, "Internal server error", null, 500);
}

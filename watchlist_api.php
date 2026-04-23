<?php
require_once "DB_Ops.php";

header('Content-Type: application/json');
session_start();

//------------------------Unified JSON response helper---------------------------
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

//------------------------Auth check-----------------------------------
if (!isset($_SESSION['user_id'])) {
    respond(false, "Unauthorized", null, 401);
}

$watchlist = new WatchlistOps();

try {

    //----------------------- GET → Fetch user watchlist ------------------
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {

        $movies = $watchlist->getUserMovies($_SESSION['user_id']);

        respond(true, "Watchlist fetched successfully", $movies);
    }

    //------------------------ POST → Add / Delete----------------------

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {

        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);

        // JSON validation
        if (!$data || json_last_error() !== JSON_ERROR_NONE) {
            respond(false, "Invalid JSON format", null, 400);
        }

        $action  = $data['action']   ?? null;
        $movieId = $data['movie_id'] ?? null;

        // Validate action
        $allowedActions = ['add', 'delete'];
        if (!in_array($action, $allowedActions)) {
            respond(false, "Invalid action. Allowed: add, delete", null, 400);
        }

        // Validate movie_id
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);
        if (!$movieId) {
            respond(false, "Invalid movie_id (must be integer)", null, 400);
        }

        // ADD Movie to watchlist
        if ($action === 'add') {

            $result = $watchlist->addToWatchlist($_SESSION['user_id'], $movieId);

            if (isset($result['error'])) {
                respond(false, $result['error'], null, 400);
            }

            respond(true, "Movie added to watchlist", $result);
        }

        //DELETE Movie from watchlist
        if ($action === 'delete') {

            $result = $watchlist->removeFromWatchlist($_SESSION['user_id'], $movieId);

            if (isset($result['error'])) {
                respond(false, $result['error'], null, 400);
            }

            respond(true, "Movie removed from watchlist", $result);
        }
    }

    // Method not allowed
    respond(false, "Method not allowed", null, 405);
} catch (Throwable $e) {


    respond(false, "Internal server error", null, 500);
}

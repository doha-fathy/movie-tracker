<?php
require_once "DB_Ops.php";
header('Content-Type: application/json');
session_start();

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$watchlist = new WatchlistOps();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $response = $watchlist->getUserMovies($_SESSION['user_id']);
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents("php://input"), true);

    $action  = $data['action']   ?? null;
    $movieId = $data['movie_id'] ?? null;

    if (!$action) {
        echo json_encode(["error" => "No action"]);
        exit;
    }

    if ($action === 'add') {

        if (!$movieId) {
            echo json_encode(["error" => "No movie_id"]);
            exit;
        }

        $response = $watchlist->addToWatchlist($_SESSION['user_id'], $movieId);
        echo json_encode($response);
        exit;
    }
    
    if ($action === 'delete') {

        if (!$movieId) {
            echo json_encode(["error" => "No movie_id"]);
            exit;
        }

        $response = $watchlist->removeFromWatchlist($_SESSION['user_id'], $movieId);
        echo json_encode($response);
        exit;
    }

    echo json_encode(["error" => "Invalid action"]);
    exit;
}

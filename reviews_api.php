<?php
require_once "DB_Ops.php";

header('Content-Type: application/json');
session_start();

$reviewOps = new ReviewsOps();
$userId = $_SESSION['user_id'] ?? null;

function respond($data)
{
    echo json_encode($data);
    exit;
}


//------------------------ Check if user is verified -----------------------------

function requireVerification(){
    global $userOps;
    global $userId;    

    $userResponse = $userOps->getUserById($userId);

    if (!$userResponse['success'] || empty($userResponse['data']['is_verified'])) {
        respond(["success" => false, "message" => "Please, verify your email first"]);
    }
}


// ---------------- GET ----------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if (!isset($_GET['movie_id'])) {
        respond(["success" => false, "message" => "movie_id required"]);
    }

    $tmdbId = $_GET['movie_id'];

    $db = new Database();
    $conn = $db->getConnection();
    $stmt = $conn->prepare("SELECT id FROM movies WHERE tmdb_id = :tmdb_id");
    $stmt->execute(["tmdb_id" => $tmdbId]);
    $movie = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$movie) {
        respond(["success" => true, "data" => ["reviews" => []]]);
    }

    $movieId = $movie['id'];

    $allReviewsRes = $reviewOps->getMovieReviews($movieId);

    if (!$allReviewsRes['success']) {
        respond($allReviewsRes);
    }

    respond([
        "success" => true,
        "data" => [
            "reviews" => $allReviewsRes['data']
        ]
    ]);
}

// ---------------- POST ----------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!$userId) {
        respond(["success" => false, "message" => "Login required"]);
    }

    requireVerification();

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        respond(["success" => false, "message" => "Invalid data"]);
    }

    $movieData = $data['movie'] ?? null;
    $rating    = $data['rating'] ?? 6;
    $comment   = $data['comment'] ?? '';

    $response = $reviewOps->addOrUpdateReview($userId, $movieData, $rating, $comment);

    respond($response);
}


// ---------------- DELETE ----------------
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {

    if (!$userId) {
        respond(["success" => false, "message" => "Login required"]);
    }

    requireVerification();

    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['movie_id'])) {
        respond(["success" => false, "message" => "movie_id required"]);
    }

    $response = $reviewOps->deleteReview($userId, $data['movie_id']);

    respond($response);
}


// ---------------- DEFAULT ----------------
respond([
    "success" => false,
    "message" => "Invalid request"
]);

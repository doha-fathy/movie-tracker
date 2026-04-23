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

// ---------------- GET ----------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if (!isset($_GET['movie_id'])) {
        respond(["success" => false, "message" => "movie_id required"]);
    }

    $movieId = $_GET['movie_id'];

    $allReviewsRes = $reviewOps->getMovieReviews($movieId);

    if (!$allReviewsRes['success']) {
        respond($allReviewsRes);
    }

    $reviews = $allReviewsRes['data'];
    $myReview = null;

    if ($userId) {
        $myReviewRes = $reviewOps->getUserReview($userId, $movieId);

        if ($myReviewRes['success'] && $myReviewRes['data']) {
            $myReview = $myReviewRes['data'];

            $reviews = array_values(array_filter($reviews, function ($r) use ($userId) {
                return $r['user_id'] != $userId;
            }));
        }
    }

    respond([
        "success" => true,
        "data" => [
            "my_review" => $myReview,
            "reviews" => $reviews
        ]
    ]);
}


// ---------------- POST ----------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!$userId) {
        respond(["success" => false, "message" => "Login required"]);
    }

    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        respond(["success" => false, "message" => "Invalid data"]);
    }

    $movieData = $data['movie'] ?? null;
    $rating    = $data['rating'] ?? null;
    $comment   = $data['comment'] ?? '';

    $response = $reviewOps->addOrUpdateReview($userId, $movieData, $rating, $comment);

    respond($response);
}


// ---------------- DELETE ----------------
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {

    if (!$userId) {
        respond(["success" => false, "message" => "Login required"]);
    }

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

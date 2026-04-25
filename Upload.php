<?php

ob_start();

require_once "DB_Ops.php";
// require_once 'vendor/autoload.php';

ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Strict');

////////// ONLY FOR TESTING \\\\\\\\\\\\\\\
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);
///////////////////////////////////////////

session_start();

header("Content-Type: application/json");


function requireAuth()
{
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        ob_end_clean();
        echo json_encode(["success" => false, "message" => "Unauthorized"]);
        exit;
    }
    return $_SESSION['user_id'];
}

function respond($success, $data = null, $message = null)
{
    ob_end_clean();
    echo json_encode([
        "success" => $success,
        "data"    => $data,
        "message" => $message
    ]);
    exit;
}

function uploadPhoto()
{
    $userOps = new UserOps();
    $id      = requireAuth();

    if (!isset($_FILES['photo'])) respond(false, null, "No file uploaded");

    $file         = $_FILES['photo'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

    if (!in_array($file['type'], $allowedTypes)) respond(false, null, "Only JPEG, PNG, and GIF are allowed");
    if ($file['size'] > 5 * 1024 * 1024)         respond(false, null, "File size must be less than 5MB");
    if ($file['error'] !== UPLOAD_ERR_OK)         respond(false, null, "File upload failed");

    try {
        if (!is_dir('Uploads')) mkdir('Uploads', 0755, true);

        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) respond(false, null, "Invalid image file");

        $fileExt  = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'photo_' . $id . '_' . time() . '.' . $fileExt;
        $filePath = 'Uploads/' . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) respond(false, null, "Failed to save image");

        $response = $userOps->getUserById($id);
        if (!$response['success']) { unlink($filePath); respond(false, null, "User not found"); }

        $cu     = $response['data'];
        $result = $userOps->updateUser($id, $cu['first_name'], $cu['last_name'], $cu['username'], $cu['email'], $filePath);

        if (!$result['success']) { unlink($filePath); respond(false, null, "Failed to update profile"); }

        respond(true, ["photo" => $filePath], "Photo uploaded successfully");

    } catch (Exception $e) {
        respond(false, null, "An error occurred: " . $e->getMessage());
    }
}


// ===== ROUTING — must be after all function definitions =====

$routes = [
    'upload_photo' => 'uploadPhoto'
];

$action = trim($_GET['action'] ?? '');

if (!array_key_exists($action, $routes)) {
    respond(false, null, "Invalid upload action");
}

$handler = $routes[$action];
$handler();

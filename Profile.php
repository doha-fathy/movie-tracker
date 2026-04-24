<?php

require_once "DB_Ops.php";
require_once 'vendor/autoload.php';

$env = parse_ini_file(__DIR__ . '/.env');

ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Strict');

////////// ONLY FOR TESTING \\\\\\\\\\\\\\\
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
///////////////////////////////////////////

session_start();

header("Content-Type: application/json");



function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized"
        ]);
        exit;
    }

    return $_SESSION['user_id']; 
}



$userOps = new UserOps();



$routes = [
    'get_profile' => 'getProfile',
    'update_profile' => 'updateProfile',
    'change_password' => 'changePassword',
    'upload_photo' => 'uploadPhoto'
];


$action = $_GET['action'] ?? '';

if (!array_key_exists($action, $routes)) {
    respond(false, null, "Invalid profile action");
}

$handler = $routes[$action];
$handler();




function respond($success, $data = null, $message = null) {
    echo json_encode([
        "success" => $success,
        "data" => $data,
        "message" => $message
    ]);
    exit;
}

function isValidPassword($password) {
    return (strlen($password) >= 6 && strlen($password) <= 30);
}

function isValidUsername($username) {
    return preg_match('/^(?=.{4,30}$)(?!.*\.\.)(?=.*[a-zA-Z])[a-zA-Z0-9._]+$/', $username) === 1;
}

function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}




function getProfile() {
    global $userOps;

    $id = requireAuth();

    $response = $userOps->getUserById($id);
    
    if (!$response['success']) {
        respond(false, null, "User not found");
    }

    $user = $response['data'];

    unset($user['password_hash']);
    unset($user['updated_at']);
    unset($user['created_at']);

    respond(true, $user);
}




function updateProfile() {
    global $userOps;

    $id = requireAuth();

    $response = $userOps->getUserById($id);
    if (!$response['success']) {
        respond(false, null, "User not found");
    }
    $currentUser = $response['data'];

    $first    = !empty(trim($_POST['first_name'] ?? '')) ? trim($_POST['first_name']) : $currentUser['first_name'];
    $last     = !empty(trim($_POST['last_name'] ?? ''))  ? trim($_POST['last_name'])  : $currentUser['last_name'];
    $username = !empty(trim($_POST['username'] ?? ''))   ? trim($_POST['username'])   : $currentUser['username'];
    $email    = !empty(trim($_POST['email'] ?? ''))      ? trim($_POST['email'])      : $currentUser['email'];
    $photo    = !empty(trim($_POST['photo'] ?? ''))      ? trim($_POST['photo'])      : $currentUser['photo'];

    if (!$first) respond(false, null, "First name required");
    if (!$username) respond(false, null, "Username required");
    if (!$email) respond(false, null, "Email required");
    if (!isValidUsername($username)) respond(false, null, "Invalid username");
    if (!isValidEmail($email)) respond(false, null, "Invalid email");

    $result = $userOps->updateUser($id, $first, $last, $username, $email, $photo);

    if (!$result['success']) {
        respond(false, null, $result['message']);
    }

    respond(true, null, "Profile updated successfully");
}




function changePassword() {
    global $userOps;

    $id = requireAuth();

    $oldPassword = trim($_POST['old_password'] ?? '');
    $newPassword = trim($_POST['new_password'] ?? '');

    if (!$oldPassword) respond(false, null, "Old password required");
    if (!$newPassword) respond(false, null, "New password required");
    if (!isValidPassword($newPassword)) respond(false, null, "Password length must be between 6 and 30");

    $response = $userOps->getUserById($_SESSION['user_id']);
    
    if (!$response['success']) {
        respond(false, null, "Invalid credentials");
    }

    $user = $response['data'];

    if (!password_verify($oldPassword, $user['password_hash'])) {
        respond(false, null, "Old password incorrect");
    }

    if (password_verify($newPassword, $user['password_hash'])) {
        respond(false, null, "New password must be different");
    }

    $result = $userOps->changePassword($id, $oldPassword, $newPassword);

    if (!$result['success']) {
        respond(false, null, $result['message']);
    }

    respond(true, null, $result['message']);
}




function uploadPhoto() {
    global $userOps;

    $id = requireAuth();

    if (!isset($_FILES['photo'])) {
        respond(false, null, "No file uploaded");
    }

    $file = $_FILES['photo'];

    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        respond(false, null, "Only JPEG, PNG, and GIF are allowed");
    }

    // Validate file size (5MB max)
    $maxSize = 5 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        respond(false, null, "File size must be less than 5MB");
    }

    // Validate file upload error
    if ($file['error'] !== UPLOAD_ERR_OK) {
        respond(false, null, "File upload failed");
    }

    try {
        // Create uploads directory if it doesn't exist
        if (!is_dir('Uploads')) {
            mkdir('Uploads', 0755, true);
        }

        // Generate unique filename
        $fileExt = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'photo_' . $id . '_' . time() . '.' . $fileExt;
        $filePath = 'Uploads/' . $fileName;

        // Validate image
        $imageInfo = getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            respond(false, null, "Invalid image file");
        }

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            respond(false, null, "Failed to save image");
        }

        // Update user photo in database
        $response = $userOps->getUserById($id);
        if (!$response['success']) {
            respond(false, null, "User not found");
        }

        $currentUser = $response['data'];
        $result = $userOps->updateUser($id, $currentUser['first_name'], $currentUser['last_name'], $currentUser['username'], $currentUser['email'], $filePath);

        if (!$result['success']) {
            // Delete uploaded file if database update fails
            unlink($filePath);
            respond(false, null, "Failed to update profile");
        }

        respond(true, ["photo" => $filePath], "Photo uploaded successfully");

    } catch (Exception $e) {
        respond(false, null, "An error occurred: " . $e->getMessage());
    }
}
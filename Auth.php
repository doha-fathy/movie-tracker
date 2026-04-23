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
$tokenOps = new TokenOps();



$routes = [
    'register' => 'register',
    'login' => 'login',
    'logout' => 'logout',
    'check' => 'check',
    'get_profile' => 'getProfile',
    'change_password' => 'changePass',
    'update_profile' => 'updateProfile',
    'verify_email' => 'verifyEmail',
    'forgot_password' => 'forgotPassword',
    'reset_password' => 'resetPassword'
];


$action = $_GET['action'] ?? '';

if (!array_key_exists($action, $routes)) {
    respond(false, null, "Invalid auth action");
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


function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function isValidPassword($password) {
    return (strlen($password) >= 6 && strlen($password) <= 30);
}

function isValidUsername($username) {
    return preg_match('/^(?=.{4,30}$)(?!.*\.\.)(?=.*[a-zA-Z])[a-zA-Z0-9._]+$/', $username) === 1;
}


function register(){

    global $userOps;
    global $env;
    global $tokenOps;

    $first_name = trim($_POST['first_name'] ?? '');
    $last_name = trim($_POST['last_name'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!$first_name) respond(false, null, "First name required");
    if (!$username) respond(false, null, "Username required");
    if (!$email) respond(false, null, "Email required");
    if (!$password) respond(false, null, "Password required");
    if (!isValidUsername($username)) respond(false, null, "Invalid username");
    if (!isValidEmail($email)) respond(false, null, "Invalid email");
    if (!isValidPassword($password)) respond(false, null, "Password length must be between 6 and 30");


    $response = $userOps->createUser($first_name, $last_name, $username, $email, $password);
    if (!$response['success']) {
        respond(false, null, $response['message'] ?? "Registration failed");
    }

    $id = $response['data']['lastinsertid'] ?? null;

    $tokenRes = $tokenOps->createToken($id, 'verify_email');

    if (!$tokenRes['success']) {
        respond(false, null, "Failed to generate verification token");
    }

    $token = $tokenRes['token'];

    $baseUrl = $env['APP_URL'];
    $verifyLink = $baseUrl . "/auth.php?action=verify_email&token=$token";

    $body = "
    <h2>Verify your email</h2>
    <p>Click the link below:</p>
    <a href='$verifyLink'>Verify Email</a>
    ";

    sendEmail($email, "Verify your account", $body);

    session_regenerate_id(true);
    $_SESSION['user_id'] = $id;

    respond(true, [
        "user_id" => $id,
        "username" => $username
    ], "Registered");
}


function login(){

    global $userOps;

    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');


    if (!$email) respond(false, null, "Email required");
    if (!$password) respond(false, null, "Password required");
    if (!isValidEmail($email)) respond(false, null, "Invalid email");

    $response = $userOps->getUserByEmail($email);
    
    if (!$response['success']) {
        respond(false, null, "Invalid credentials");
    }

    $user = $response['data'];
    if (!password_verify($password, $user['password_hash'])) {
        respond(false, null, "Invalid credentials");
    }

    if (!$user['is_verified']) {
        respond(false, null, "Please verify your email first");
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];

    respond(true, [
        "user_id" => $user['id'],
        "username" => $user['username'],
        "photo" => $user['photo']
    ], "Login successful");
}


function logout(){

    session_unset();
    session_destroy();

    respond(true, null, "Logged out");
}


function check(){

    if (!isset($_SESSION['user_id'])) {
        respond(true, ["authenticated" => false]);
    }

    respond(true, [
        "authenticated" => true,
    ]);
}

function getProfile(){
    global $userOps;

    if (!isset($_SESSION['user_id'])) {
        respond(true, ["authenticated" => false]);
    }

    $response = $userOps->getUserById($_SESSION['user_id']);
    
    if (!$response['success']) {
        respond(false, null, "Invalid credentials");
    }

    $user = $response['data'];

    unset($user['password_hash']);
    unset($user['updated_at']);
    unset($user['created_at']);

    respond(true, [
        "authenticated" => true,
        "user" => $user
    ]);
}


function changePass(){

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

    if (isset($result["error"])) {
        respond(false, null, $result["error"]);
    }

    respond(true, null, $result["message"]);
}


function updateProfile() {
    global $userOps, $tokenOps, $env;

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

    $isEmailChanged = ($email !== $currentUser['email']);

    $result = $userOps->updateUser($id, $first, $last, $username, $email, $photo);

    if (!$result['success']) {
        respond(false, null, $result['message']);
    }

    if ($isEmailChanged) {
        $userOps->setVerifiedStatus($id, 0);

        $tokenRes = $tokenOps->createToken($id, 'verify_email');
        if (!$tokenRes['success']) {
            respond(false, null, "Failed to generate verification token");
        }

        $token = $tokenRes['token'];
        $baseUrl = $env['APP_URL'];
        
        $verifyLink = $baseUrl . "/auth.php?action=verify_email&token=$token";

        $body = "<h2>Verify your new email</h2><p>Click below:</p><a href='$verifyLink'>Verify Email</a>";
        sendEmail($email, "Verify your new email", $body);
    }

    respond(true, null, $result['message']);
}


function resetPassword() {

    global $tokenOps, $userOps;

    $token = $_POST['token'] ?? '';
    $newPassword = $_POST['new_password'] ?? '';

    if (!$token || !$newPassword) {
        respond(false, null, "Invalid request");
    }

    if (!isValidPassword($newPassword)) {
        respond(false, null, "Password length must be between 6 and 30");
    }

    $result = $tokenOps->validateToken($token, 'reset_password');

    if (!$result['success']) {
        respond(false, null, $result['message']);
    }

    $data = $result['data'];

    $userOps->setNewPassword($data['user_id'], $newPassword);

    $tokenOps->markTokenUsed($data['id']);

    respond(true, null, "Password reset successful");
}


function forgotPassword() {

    global $userOps, $tokenOps, $env;

    $email = trim($_POST['email'] ?? '');

    if (!$email) respond(false, null, "Email required");

    $response = $userOps->getUserByEmail($email);
    
    if (!$response['success']) {
        respond(false, null, "Invalid credentials");
    }

    $user = $response['data'];

    if ($user) {
        $tokenRes = $tokenOps->createToken($user['id'], 'reset_password');

        if (!$tokenRes['success']) {
            respond(false, null, "Failed to generate verification token");
        }

        $token = $tokenRes['token'];

        $baseUrl = $env['APP_URL'];
        $link = $baseUrl . "/reset_password.php?token=$token";

        $body = "
        <h2>Reset your password</h2>
        <p>Click below:</p>
        <a href='$link'>Reset Password</a>
        ";

        sendEmail($email, "Password Reset", $body);
    }

    respond(true, null, "If email exists, reset link sent");
}


function verifyEmail() {

    global $tokenOps, $userOps;

    $token = $_GET['token'] ?? '';

    if (!$token) respond(false, null, "Invalid token");

    $result = $tokenOps->validateToken($token, 'verify_email');

    if (!$result['success']) {
        respond(false, null, $result['message']);
    }

    $data = $result['data'];

    $userOps->setVerifiedStatus($data['user_id'], 1);

    $tokenOps->markTokenUsed($data['id']);

    respond(true, null, "Email verified");
}



use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;



function sendEmail($to, $subject, $body)
{
    global $env;

    $mail = new PHPMailer(true);

    try {
        // Server Settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = $env['SMTP_USER']; 
        $mail->Password   = $env['SMTP_PASS']; 
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';

        // Recipients
        $mail->setFrom($env['SMTP_USER'], 'Movie Tracker');
        $mail->addAddress($to);

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        // AltBody is good for users with HTML emails turned off
        $mail->AltBody = strip_tags($body); 

        return $mail->send();

    } catch (Exception $e) {
        error_log("Mailer Error: {$mail->ErrorInfo}");
        return false;
    }
}
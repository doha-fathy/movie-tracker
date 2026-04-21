<?php

$env = parse_ini_file(__DIR__ . '/.env');
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





$host = $env['DB_HOST'];
$db   = $env['DB_NAME'];
$user = $env['DB_USER'];
$pass = $env['DB_PASS'];

$pdo = new PDO(
    "mysql:host=$host;dbname=$db;charset=utf8",
    $user,
    $pass,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]
);



$routes = [
    'register' => 'register',
    'login' => 'login',
    'logout' => 'logout',
    'me' => 'getMe',
    'change_password' => 'changePass'
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
    return (strlen($password) >= 8 && strlen($password) <= 30);
}

function isValidUsername($username) {
    return preg_match('/^(?=.{4,30}$)(?!.*\.\.)(?=.*[a-zA-Z])[a-zA-Z0-9._]+$/', $username) === 1;
}


function register(){

    global $pdo;

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
    if (!isValidPassword($password)) respond(false, null, "Password length must be between 8 and 30");

    $hash = password_hash($password, PASSWORD_BCRYPT);

    try {
        $stmt = $pdo->prepare("
            INSERT INTO users (first_name, last_name, username, email, password_hash)
            VALUES (?, ?, ?, ?, ?)
        ");

        $stmt->execute([$first_name, $last_name, $username, $email, $hash]);

        $id = $pdo->lastInsertId();

        session_regenerate_id(true);
        $_SESSION['user_id'] = $id;

        respond(true, [
            "user_id" => $id,
            "username" => $username
        ], "Registered");

    } catch (PDOException $e) {
        respond(false, null, "Email or username already exists");
    }
}


function login(){

    global $pdo;

    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');


    if (!$email) respond(false, null, "Email required");
    if (!$password) respond(false, null, "Password required");
    if (!isValidEmail($email)) respond(false, null, "Invalid email");

    $stmt = $pdo->prepare("
        SELECT id, username, password_hash, photo
        FROM users
        WHERE email = ?
    ");

    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        respond(false, null, "Invalid credentials");
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


function getMe(){

    global $pdo;

    if (!isset($_SESSION['user_id'])) {
        respond(true, ["authenticated" => false]);
    }

    $stmt = $pdo->prepare("
        SELECT id, first_name, last_name, username, email, photo
        FROM users
        WHERE id = ?
    ");

    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();

    respond(true, [
        "authenticated" => true,
        "user" => $user
    ]);
}


function changePass(){

    global $pdo;

    $id = requireAuth();

    $oldPassword = trim($_POST['old_password'] ?? '');
    $newPassword = trim($_POST['new_password'] ?? '');

    if (!$oldPassword) respond(false, null, "Old password required");
    if (!$newPassword) respond(false, null, "New password required");
    if (!isValidPassword($newPassword)) respond(false, null, "Password length must be between 8 and 30");

    $stmt = $pdo->prepare("
        SELECT password_hash
        FROM users
        WHERE id = ?
    ");

    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!password_verify($oldPassword, $user['password_hash'])) {
        respond(false, null, "Old password incorrect");
    }

    if (password_verify($newPassword, $user['password_hash'])) {
        respond(false, null, "New password must be different");
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare("
        UPDATE users
        SET password_hash = ?
        WHERE id = ?
    ");

    $stmt->execute([$newHash, $id]);

    respond(true, null, "Password updated");
}
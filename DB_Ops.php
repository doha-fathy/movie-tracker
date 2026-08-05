<?php

date_default_timezone_set('UTC');

class Database
{
    private $connection;

    public function __construct()
    {
        try {
            $env = parse_ini_file(__DIR__ . '/.env');

            $this->connection = new PDO(
                "mysql:host={$env['DB_HOST']};dbname={$env['DB_NAME']};charset=utf8mb4",
                $env['DB_USER'],
                $env['DB_PASS'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]
            );

            // This forces the MySQL session to UTC to match your PHP settings
            $this->connection->exec("SET time_zone = '+00:00'");

        } catch (PDOException $e) {
            // die("Database connection failed");

            echo json_encode([
                "success" => false,
                "error" => "Database connection failed"
            ]);
            exit;
        }
    }

    public function getConnection()
    {
        return $this->connection;
    }
}

//======================================================================

class WatchlistOps
{
    private $connection;

    public function __construct()
    {
        $database = new Database();
        $this->connection = $database->getConnection();
    }



    // -------------------- HELPERS --------------------

    private function success($data = null, $message = null)
    {
        return [
            "success" => true,
            "data" => $data,
            "message" => $message
        ];
    }

    private function error($message)
    {
        return [
            "success" => false,
            "message" => $message
        ];
    }

    private function sanitizeArray($array)
    {
        return array_map(function ($item) {
            return array_map('htmlspecialchars', $item);
        }, $array);
    }

    // -------------------- READ --------------------
    public function getUserMovies($userId)
    {

        $userId = filter_var($userId, FILTER_VALIDATE_INT);

        if (!$userId) {
            return $this->error("Invalid user. Please log in again.");
        }

        try {

            $query = " SELECT movies.* FROM watchlist JOIN movies ON watchlist.movie_id = movies.id
                       WHERE watchlist.user_id = :user_id ";

            $statement = $this->connection->prepare($query);

            $statement->execute(["user_id" => $userId]);

            $movies = $statement->fetchAll(PDO::FETCH_ASSOC);

            $movies = $this->sanitizeArray($movies);

            if (empty($movies)) {
                return $this->success([], "Your watchlist is empty.");
            }

            return $this->success($movies);
        } catch (PDOException $e) {
            return $this->error("Something went wrong while fetching your watchlist. Please try again.");
        }
    }


    public function removeFromWatchlist($userId, $movieId)
    {

        $userId = filter_var($userId, FILTER_VALIDATE_INT);
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

        if (!$userId || !$movieId) {
            return $this->error("Invalid request. Please try again.");
        }

        try {

            $query = " DELETE FROM watchlist WHERE user_id = :user_id AND movie_id = :movie_id ";
            $statement = $this->connection->prepare($query);

            $statement->execute(["user_id" => $userId, "movie_id" => $movieId]);

            if ($statement->rowCount() > 0) {
                return $this->success(null, "Movie removed from your watchlist.");
            } else {
                return $this->success(null, "Nothing to remove. Movie was not in your watchlist.");
            }
        } catch (PDOException $e) {
            return $this->error("Unable to process your request right now.");
        }
    }

    //-----------------------------------------------------------------------------------------------
    public function addToWatchlist($userId, $movieData)
    {
        $userId = filter_var($userId, FILTER_VALIDATE_INT);

        $tmdb_id = $movieData['tmdb_id'] ?? null;

        if (!$userId || !$tmdb_id) {
            return $this->error("Invalid request. Please try again.");
        }

        if (empty($movieData['title'])) {
            return $this->error("Missing required movie information.");
        }

        try {
            // 1. check if movie exists
            $stmt = $this->connection->prepare(
                "SELECT id FROM movies WHERE tmdb_id = :tmdb_id"
            );

            $stmt->execute(["tmdb_id" => $tmdb_id]);

            $movie = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($movie) {
                $movieId = $movie['id'];
            } else {
                // 2. insert movie
                $stmt = $this->connection->prepare(
                    "INSERT INTO movies (tmdb_id, title, poster_path, release_date, description)
                 VALUES (:tmdb_id, :title, :poster, :date, :desc)"
                );

                $stmt->execute([
                    "tmdb_id" => $tmdb_id,
                    "title" => $movieData['title'],
                    "poster" => $movieData['poster_path'],
                    "date" => $movieData['release_date'],
                    "desc" => $movieData['description']
                ]);

                $movieId = $this->connection->lastInsertId();
            }

            // 3. insert into watchlist
            $stmt = $this->connection->prepare(
                "INSERT INTO watchlist (user_id, movie_id) VALUES (:user_id, :movie_id)"
            );

            $stmt->execute([
                "user_id" => $userId,
                "movie_id" => $movieId
            ]);

            return $this->success(null, "Movie added to your watchlist.");
        } catch (PDOException $e) {

            if ($e->getCode() == 23000) {
                return $this->error("This movie is already in your watchlist.");
            }

            return $this->error("Unable to process your request right now.");
        }
    }
}

//======================================================================

class UserOps
{
    private $connection;

    public function __construct()
    {
        $database = new Database();
        $this->connection = $database->getConnection();
    }

    // -------------------- HELPERS --------------------

    private function success($data = null, $message = null)
    {
        return [
            "success" => true,
            "data" => $data,
            "message" => $message
        ];
    }

    private function error($message)
    {
        return [
            "success" => false,
            "message" => $message
        ];
    }

    private function sanitize($data)
    {
        return htmlspecialchars($data);
    }

    public function createUser($first, $last, $username, $email, $password, $photo = "Uploads/default.png")
    {
        if (empty($username) || empty($email) || empty($password)) {
            return $this->error("All required fields must be filled.");
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->error("Please enter a valid email address.");
        }

        /*  if (strlen($password) < 6) {
            return $this->error("Password must be at least 6 characters.");
        }*/

        try {
            // Username check
            $stmt = $this->connection->prepare("SELECT id FROM users WHERE username = :username");
            $stmt->execute(["username" => $username]);

            if ($stmt->fetch()) {
                return $this->error("This username is already taken.");
            }


            // Email check
            $stmt = $this->connection->prepare("SELECT id FROM users WHERE email = :email");
            $stmt->execute(["email" => $email]);

            if ($stmt->fetch()) {
                return $this->error("This email is already registered.");
            }


            // Insert
            $stmt = $this->connection->prepare(
                "INSERT INTO users (first_name, last_name, username, email, password_hash, photo)
             VALUES (:first, :last, :username, :email, :password, :photo)"
            );

            $stmt->execute([
                "first" => $this->sanitize($first),
                "last" => $this->sanitize($last),
                "username" => $this->sanitize($username),
                "email" => $email,
                "password" => password_hash($password, PASSWORD_DEFAULT),
                "photo" => $photo
            ]);

            $userId = $this->connection->lastInsertId();

            return $this->success(
                ["lastinsertid" => $userId],
                "Account created successfully."
            );
        } catch (PDOException $e) {
            return $this->error("Unable to create account. Please try again later.");
        }
    }


    //-----------------------------------------------------------------------------------------------
    public function updateUser($id, $first, $last, $username, $email, $photo)
    {
        $id = filter_var($id, FILTER_VALIDATE_INT);

        if (!$id) {
            return $this->error("Invalid user. Please try again.");
        }

        if (empty($username) || empty($email)) {
            return $this->error("Username and email are required.");
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->error("Please enter a valid email address.");
        }

        try {
            // Check if user exists
            $check = $this->connection->prepare("SELECT id FROM users WHERE id = :id");
            $check->execute(["id" => $id]);

            if (!$check->fetch()) {
                return $this->error("User not found.");
            }

            // Check username
            $stmt = $this->connection->prepare(
                "SELECT id FROM users WHERE username = :username AND id != :id"
            );
            $stmt->execute([
                "username" => $username,
                "id" => $id
            ]);

            if ($stmt->fetch()) {
                return $this->error("This username is already in use.");
            }

            // Check email
            $stmt = $this->connection->prepare(
                "SELECT id FROM users WHERE email = :email AND id != :id"
            );
            $stmt->execute([
                "email" => $email,
                "id" => $id
            ]);

            if ($stmt->fetch()) {
                return $this->error("This email is already registered.");
            }

            // Update
            $stmt = $this->connection->prepare(
                "UPDATE users SET first_name = :first,
                              last_name  = :last,
                              username   = :username,
                              email      = :email,
                              photo      = :photo
             WHERE id = :id"
            );

            $stmt->execute([
                "id" => $id,
                "first" => htmlspecialchars($first),
                "last" => htmlspecialchars($last),
                "username" => htmlspecialchars($username),
                "email" => $email,
                "photo" => $photo
            ]);

            if ($stmt->rowCount() === 0) {
                return $this->error("No changes were made.");
            }

            return $this->success(null, "Profile updated successfully.");
        } catch (PDOException $e) {
            return $this->error("Unable to update profile. Please try again later.");
        }
    }
    //-----------------------------------------------------------------------------------------------

    public function getUserById($id)
    {
        $id = filter_var($id, FILTER_VALIDATE_INT);

        if (!$id) {
            return $this->error("Invalid user ID.");
        }

        try {
            $stmt = $this->connection->prepare("SELECT * FROM users WHERE id = :id");
            $stmt->execute(["id" => $id]);

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                return $this->error("User not found.");
            }

            // XSS protection
            $user = array_map('htmlspecialchars', $user);

            return $this->success($user, "User data retrieved successfully.");
        } catch (PDOException $e) {
            return $this->error("Unable to fetch user data. Please try again later.");
        }
    }

    //-----------------------------------------------------------------------------------------------
    public function getUserByEmail($email)
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->error("Invalid email format.");
        }

        try {
            $stmt = $this->connection->prepare(
                "SELECT * FROM users WHERE email = :email"
            );
            $stmt->execute(["email" => $email]);

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                return $this->error("No account found with this email.");
            }

            // XSS protection
            $user = array_map('htmlspecialchars', $user);

            return $this->success($user, "User data retrieved successfully.");
        } catch (PDOException $e) {
            return $this->error("Unable to fetch user data. Please try again later.");
        }
    }

    //-----------------------------------------------------------------------------------------------

    public function getUserByUsername($username)
    {
        if (empty($username)) {
            return $this->error("Username is required.");
        }

        try {
            $stmt = $this->connection->prepare("SELECT * FROM users WHERE username = :username");
            $stmt->execute(["username" => $username]);

            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                return $this->error("No account found with this username.");
            }

            // XSS protection
            $user = array_map('htmlspecialchars', $user);

            return $this->success($user, "User data retrieved successfully.");
        } catch (PDOException $e) {
            return $this->error("Unable to fetch user data. Please try again later.");
        }
    }

    //-----------------------------------------------------------------------------------------------

  public function changePassword($id, $newPassword)
{
    $id = filter_var($id, FILTER_VALIDATE_INT);

    if (!$id) {
        return $this->error("Invalid user.");
    }

    try {
        $stmt = $this->connection->prepare(
            "UPDATE users SET password_hash = :password WHERE id = :id"
        );

        $stmt->execute([
            "id" => $id,
            "password" => password_hash($newPassword, PASSWORD_DEFAULT)
        ]);

        return $this->success(null, "Password updated successfully.");

    } catch (PDOException $e) {
        return $this->error("Unable to update password.");
    }
}

    //-----------------------------------------------------------------------------------------------

    public function setVerifiedStatus($id, $status)
    {
        $stmt = $this->connection->prepare(
            "UPDATE users SET is_verified = :status WHERE id = :id"
        );

        $stmt->execute([
            "status" => $status,
            "id" => $id
        ]);

        return $this->success(null, null);
    }

    //-----------------------------------------------------------------------------------------------

    public function setNewPassword($id, $newPassword)
    {
        $id = filter_var($id, FILTER_VALIDATE_INT);
        if ($id === false) {
            return $this->error('Invalid user ID.');
        }

        try {
            $stmt = $this->connection->prepare(
                "UPDATE users SET password_hash = :password WHERE id = :id"
            );

            $stmt->execute([
                "id" => $id,
                "password" => password_hash($newPassword, PASSWORD_DEFAULT)
            ]);

            return $this->success(null, "Password updated successfully.");
        } catch (PDOException $e) {
            return $this->error("Database error.");
        }
    }
}

//======================================================================


class ReviewsOps
{
    private $connection;

    public function __construct()
    {
        $database = new Database();
        $this->connection = $database->getConnection();
    }
    private function success($data = null, $message = null)
    {
        return [
            "success" => true,
            "data" => $data,
            "message" => $message
        ];
    }

    private function error($message)
    {
        return [
            "success" => false,
            "message" => $message
        ];
    }

    private function sanitizeArray($array)
    {
        return array_map(function ($item) {
            return array_map('htmlspecialchars', $item);
        }, $array);
    }
    // -------------------------------------------------------------------------
    public function addOrUpdateReview($userId, $movieData, $rating, $comment)
    {
        $userId = filter_var($userId, FILTER_VALIDATE_INT);
        $rating = filter_var($rating, FILTER_VALIDATE_INT);

        if (!$userId) {
            return $this->error("Invalid user. Please log in again.");
        }

        if ($rating === false || $rating < 0 || $rating > 10) {
            return $this->error("Rating must be between 0 and 10.");
        }

        if (empty($movieData['tmdb_id'])) {
            return $this->error("Movie information is missing.");
        }

        //// begin a trans bc there are so many write queries in this function and we want atomicity
        $this->connection->beginTransaction();

        try {
            // check movie
            $stmt = $this->connection->prepare("SELECT id FROM movies WHERE tmdb_id = :tmdb_id");
            $stmt->execute(["tmdb_id" => $movieData['tmdb_id']]);
            $movie = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($movie) {
                $movieId = $movie['id'];

                // update the tmdb measure belmarra
                $tmdb_rate = $movieData['tmdb_rate'];
                $tmdb_count = $movieData['tmdb_count'];

                $stmt = $this->connection->prepare(
                    "UPDATE movies
                    SET curr_tmdb_rating = :new_rate,
                    curr_tmdb_vote_count = :new_count
                    WHERE id = :movie_id");

                $stmt->execute([
                    'new_rate' => $tmdb_rate,
                    'new_count' => $tmdb_count,
                    'movie_id' => $movieId
                ]);


                // read old rating from the user (if he is just modifying his current one), we will use it further
                $stmt = $this->connection->prepare(
                "SELECT rating
                FROM reviews
                WHERE user_id = :user_id
                AND movie_id = :movie_id");

                $stmt->execute([
                    'user_id' => $userId,
                    "movie_id" => $movieId
                ]);

                $old_rate = $stmt->fetchColumn();

                // local measure if the movie exists, if not exists, the coming 'else' will initialize them with 0
                $local_count = $movie['local_rating_count'];
                $local_rate = $movie['local_rating_avg'];
                
            } else {
                $stmt = $this->connection->prepare(
                    "INSERT INTO movies (tmdb_id, title, poster_path, release_date, description)
                 VALUES (:tmdb_id, :title, :poster, :date, :desc)"
                );

                $stmt->execute([
                    "tmdb_id" => $movieData['tmdb_id'],
                    "title" => $movieData['title'] ?? '',
                    "poster" => $movieData['poster_path'] ?? '',
                    "date" => $movieData['release_date'] ?? null,
                    "desc" => $movieData['description'] ?? ''
                ]);

                $movieId = $this->connection->lastInsertId();

                $local_count = 0;
                $local_rate = 0.0;
                $old_rate = false;
            }

            // insert or update review
            if($action === "rate"){
            $stmt = $this->connection->prepare(
                "INSERT INTO reviews (user_id, movie_id, rating, comment)
             VALUES (:user_id, :movie_id, :rating, :comment)
             ON DUPLICATE KEY UPDATE
                    rating = :rating"
                );
                $stmt->execute([
                    "user_id" => $userId,
                    "movie_id" => $movieId,
                    "rating" => $rating ?? null,
                ]);
            } else {
                $stmt = $this->connection->prepare(
                    "INSERT INTO reviews (user_id, movie_id, comment)
                    VALUES (:user_id, :movie_id, :comment)
                    ON DUPLICATE KEY UPDATE
                    comment = :comment,
                    updated_at = CURRENT_TIMESTAMP"
            );

            $stmt->execute([
                "user_id" => $userId,
                "movie_id" => $movieId,
                "rating" => $rating,
                "comment" => $comment ?? ''
            ]);
            }

            //-------------------------------------------------
            // now let's modify local measures
            if($action === "rate"){
                if($old_rate === false || $old_rate === null){
                    $old_sum = $local_count * $local_rate;
                    $local_count++;
                    $local_rate = ($old_sum + $rating) / $local_count;
                } else {
                    $old_sum = $local_count * $local_rate;
                    $new_sum = $old_sum - $old_rate + $rating;
                    $local_rate = $new_sum / $local_count;
                }

                $stmt = $this->connection->prepare(
                    "UPDATE movies
                    SET local_rating_avg = :rate,
                    local_rating_count = :count
                    WHERE id = :id" 
                );
                $stmt->execute([
                    'rate' => $local_rate,
                    'count' => $local_count,
                    'id' => $movieId
                ]);
            }

            //// commit the trans
            $this->connection->commit();

            return $this->success(null, "Your review has been saved successfully.");
        } catch (PDOException $e) {
            //// rollback if error happens
            $this->connection->rollBack();
            return $this->error("Unable to save your review. Please try again later. comment = $comment, rate = $rating");
        }
    }
    // -------------------------------------------------------------------------
    public function getUserReview($userId, $movieId)
    {
        $userId = filter_var($userId, FILTER_VALIDATE_INT);
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

        if (!$userId || !$movieId) {
            return $this->error("Invalid request. Please try again.");
        }

        try {
            $stmt = $this->connection->prepare("SELECT * FROM reviews WHERE user_id = :user_id AND movie_id = :movie_id");

            $stmt->execute([
                "user_id" => $userId,
                "movie_id" => $movieId
            ]);

            $review = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$review) {
                return $this->success(null, "You haven't added a review for this movie yet.");
            }

            // XSS protection
            $review = array_map('htmlspecialchars', $review);

            return $this->success($review, "Your review has been retrieved successfully.");
        } catch (PDOException $e) {
            return $this->error("Unable to load your review. Please try again later.");
        }
    }

    // -------------------------------------------------------------------------
    public function deleteReview($userId, $movieId)
    {
        $userId = filter_var($userId, FILTER_VALIDATE_INT);
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

        if ($userId === false || $movieId === false) {
            return $this->error("Invalid request. Please try again.");
        }

        try {
            $stmt = $this->connection->prepare("DELETE FROM reviews  WHERE user_id = :user_id AND movie_id = :movie_id");

            $stmt->execute([
                "user_id" => $userId,
                "movie_id" => $movieId
            ]);

            if ($stmt->rowCount() > 0) {
                return $this->success(null, "Your review has been deleted successfully.");
            }

            return $this->success(null, "No review found to delete.");
        } catch (PDOException $e) {
            return $this->error("Unable to delete your review. Please try again later.");
        }
    }
    // -------------------------------------------------------------------------
    public function getMovieReviews($movieId)
    {
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

        if ($movieId === false) {
            return $this->error("Invalid movie. Please try again.");
        }

        try {
            $stmt = $this->connection->prepare(
                "SELECT reviews.*, users.username, users.photo
             FROM reviews JOIN users ON reviews.user_id = users.id
             WHERE reviews.movie_id = :movie_id  ORDER BY reviews.created_at DESC"
            );

            $stmt->execute(["movie_id" => $movieId]);

            $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // XSS protection
            $reviews = $this->sanitizeArray($reviews);

            if (empty($reviews)) {
                return $this->success([], "No reviews available for this movie yet.");
            }

            return $this->success($reviews, "Reviews loaded successfully.");
        } catch (PDOException $e) {
            return $this->error("Unable to load reviews. Please try again later.");
        }
    }

    // -------------------------------------------------------------------------
    public function getLocal($movieId){
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

        if ($movieId === false) {
            return $this->error("Invalid movie. Please try again.");
        }

        try {
            $stmt = $this->connection->prepare(
                "SELECT local_rating_count, local_rating_avg
                FROM movies
                WHERE id = :movie_id"
            );

            $stmt->execute(["movie_id" => $movieId]);

            $locals = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($locals === false) {
                return $this->success([], "Movie not found.");
            }

            return $this->success($locals, "Reviews loaded successfully.");
        } catch (PDOException $e) {
            return $this->error("Unable to load reviews. Please try again later.");
        }
    }
}


class TokenOps
{
    private $connection;

    public function __construct()
    {
        $database = new Database();
        $this->connection = $database->getConnection();
    }

    public function createToken($userId, $type)
    {
        $userId = filter_var($userId, FILTER_VALIDATE_INT);

        if (!$userId || !$type) {
            return ["success" => false, "message" => "Invalid data"];
        }

        try {
            // OPTIONAL: invalidate old tokens of same type
            $stmt = $this->connection->prepare(
                "UPDATE user_tokens 
                 SET used = 1 
                 WHERE user_id = :user_id AND type = :type AND used = 0"
            );

            $stmt->execute([
                "user_id" => $userId,
                "type" => $type
            ]);

            // create new token
            $token = bin2hex(random_bytes(32));
            // $expires = gmdate("Y-m-d H:i:s", time() + 3600);

            $stmt = $this->connection->prepare(
                "INSERT INTO user_tokens (user_id, token, type, expires_at)
                 VALUES (:user_id, :token, :type, UTC_TIMESTAMP() + INTERVAL 1 HOUR)"
            );

            $stmt->execute([
                "user_id" => $userId,
                "token" => $token,
                "type" => $type
            ]);

            return [
                "success" => true,
                "token" => $token
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }

    public function validateToken($token, $type)
    {
        try {
            $stmt = $this->connection->prepare(
                "SELECT * FROM user_tokens
                 WHERE token = :token 
                 AND type = :type 
                 AND used = 0
                 AND expires_at > UTC_TIMESTAMP()"
            );

            $stmt->execute([
                "token" => $token,
                "type" => $type
            ]);

            $record = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$record) {
                return ["success" => false, "message" => "Invalid token"];
            }

            // $currentTime = time();
            // $expirationTime = strtotime($record['expires_at'] . ' UTC'); // Force interpretation as UTC

            // if ($expirationTime < $currentTime) {
            //     return [
            //         "success" => false, 
            //         "message" => "Token expired. System UTC: " . gmdate("H:i", $currentTime) . " Token Exp: " . gmdate("H:i", $expirationTime)
            //     ];
            // }

            return [
                "success" => true,
                "data" => $record
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }

    public function markTokenUsed($tokenId)
    {
        try {
            $stmt = $this->connection->prepare(
                "UPDATE user_tokens SET used = 1 WHERE id = :id"
            );

            $stmt->execute(["id" => $tokenId]);

            return ["success" => true];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }

    public function deleteExpiredTokens()
    {
        $stmt = $this->connection->prepare(
            "DELETE FROM user_tokens WHERE expires_at < NOW()"
        );

        $stmt->execute();
    }
}

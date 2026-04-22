<?php
require_once "Database.php";

class WatchlistOps
{
    private $connection;

    public function __construct()
    {
        $database = new Database();
        $this->connection = $database->getConnection();
    }

    public function getUserMovies($userId)
    {

        $userId = filter_var($userId, FILTER_VALIDATE_INT);

        if (!$userId) {
            return [
                "success" => false,
                "message" => "Invalid user id "
            ];
        }

        try {

            $query = " SELECT movies.* FROM watchlist JOIN movies ON watchlist.movie_id = movies.id
                       WHERE watchlist.user_id = :user_id ";

            $statement = $this->connection->prepare($query);

            $statement->execute(["user_id" => $userId]);

            $movies = $statement->fetchAll(PDO::FETCH_ASSOC);
            return [
                "success" => true,
                "movies" => $movies
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }


    public function removeFromWatchlist($userId, $movieId)
    {

        $userId = filter_var($userId, FILTER_VALIDATE_INT);
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

        if (!$userId || !$movieId) {
            return [
                "success" => false,
                "message" => "Invalid data"
            ];
        }

        try {

            $query = " DELETE FROM watchlist WHERE user_id = :user_id AND movie_id = :movie_id ";
            $statement = $this->connection->prepare($query);

            $statement->execute(["user_id" => $userId, "movie_id" => $movieId]);

            if ($statement->rowCount() > 0) {
                return [
                    "success" => true,
                    "message" => "Movie removed successfully"
                ];
            } else {
                return [
                    "success" => false,
                    "message" => "Movie not found in watchlist"
                ];
            }
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }

    //-----------------------------------------------------------------------------------------------
    public function addToWatchlist($userId, $movieData)
    {
        $userId = filter_var($userId, FILTER_VALIDATE_INT);

        // data-id → tmdb_id
        $tmdb_id = $movieData['data-id'] ?? null;

        if (!$userId || !$tmdb_id) {
            return [
                "success" => false,
                "message" => "Invalid data"
            ];
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

            return [
                "success" => true,
                "message" => "Movie added to watchlist"
            ];
        } catch (PDOException $e) {

            if ($e->getCode() == 23000) {
                return [
                    "success" => false,
                    "message" => "Movie already in watchlist"
                ];
            }

            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }
}


class UserOps
{
    private $connection;

    public function __construct()
    {
        $database = new Database();
        $this->connection = $database->getConnection();
    }

    public function createUser($first, $last, $username, $email, $password, $photo = "uploads/default.png")
    {

        try {
            // Check username
            $stmt = $this->connection->prepare("SELECT id FROM users WHERE username = :username");
            $stmt->execute(["username" => $username]);

            if ($stmt->fetch()) {
                return [
                    "success" => false,
                    "message" => "Username already exists"
                ];
            }

            // Check email
            $stmt = $this->connection->prepare("SELECT id FROM users WHERE email = :email");
            $stmt->execute(["email" => $email]);

            if ($stmt->fetch()) {
                return [
                    "success" => false,
                    "message" => "Email already exists"
                ];
            }

            // Insert
            $stmt = $this->connection->prepare(
                "INSERT INTO users (first_name, last_name, username, email, password_hash, photo)
             VALUES (:first, :last, :username, :email, :password, :photo)"
            );

            $stmt->execute([
                "first" => $first,
                "last" => $last,
                "username" => $username,
                "email" => $email,
                "password" => password_hash($password, PASSWORD_DEFAULT),
                "photo" => $photo
            ]);

            $userId = $this->connection->lastInsertId();

            return [
                "success" => true,
                "message" => "Account created successfully",
                "data" => [
                    "lastinsertid" => $userId
                ]
            ];
        } catch (PDOException $e) {

            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }


    //-----------------------------------------------------------------------------------------------

    public function updateUser($id, $first, $last, $username, $email, $photo)
    {
        $id = filter_var($id, FILTER_VALIDATE_INT);
        if ($id === false) {
            return [
                "success" => false,
                "message" => "Invalid user ID"
            ];
        }

        try {
            // Check username
            $stmt = $this->connection->prepare(
                "SELECT id FROM users WHERE username = :username AND id != :id"
            );
            $stmt->execute([
                "username" => $username,
                "id" => $id
            ]);

            if ($stmt->fetch()) {
                return [
                    "success" => false,
                    "message" => "Username already taken"
                ];
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
                return [
                    "success" => false,
                    "message" => "Email already in use"
                ];
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
                "first" => $first,
                "last" => $last,
                "username" => $username,
                "email" => $email,
                "photo" => $photo
            ]);

            return [
                "success" => true,
                "message" => "Profile updated successfully"
            ];
        } catch (PDOException $e) {

            return [
                "success" => false,
                "message" => "Unable to update profile. Please try again"
            ];
        }
    }
    //-----------------------------------------------------------------------------------------------

    public function getUserById($id)
    {
        $id = filter_var($id, FILTER_VALIDATE_INT);
        if (!$id) return false;

        $query = "SELECT * FROM users WHERE id = :id";
        $stmt = $this->connection->prepare($query);
        $stmt->execute(["id" => $id]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    //-----------------------------------------------------------------------------------------------

    public function getUserByEmail($email)
    {
        $query = "SELECT * FROM users WHERE email = :email";
        $stmt = $this->connection->prepare($query);
        $stmt->execute(["email" => $email]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    //-----------------------------------------------------------------------------------------------

    public function getUserByUsername($username)
    {
        $query = "SELECT * FROM users WHERE username = :username";
        $stmt = $this->connection->prepare($query);
        $stmt->execute(["username" => $username]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    //-----------------------------------------------------------------------------------------------

    public function changePassword($id, $oldPassword, $newPassword)
    {
        $id = filter_var($id, FILTER_VALIDATE_INT);
        if ($id === false) {
            return [
                "success" => false,
                "message" => "Invalid user ID."
            ];
        }

        if (empty($oldPassword) || empty($newPassword)) {
            return
                [
                    "success" => false,
                    "message" => "Password fields cannot be empty."
                ];
        }


        // Get user from DB
        $user = $this->getUserById($id);
        if (!$user) {
            return ["error" => "User not found."];
        }

        // Verify old password -
        if (!password_verify($oldPassword, $user['password_hash'])) {
            return [
                "success" => false,
                "message" => "Current password is incorrect."
            ];
        }

        try {
            //Update password in DB
            $stmt = $this->connection->prepare(
                "UPDATE users SET password_hash = :password WHERE id = :id"
            );

            $stmt->execute([
                "id" => $id,
                "password" => password_hash($newPassword, PASSWORD_DEFAULT)
            ]);

            // Check if update actually happened
            if ($stmt->rowCount() === 0) {

                return [
                    "success" => false,
                    "message" => "Password was not updated."
                ];
            }

            return [
                "success" => true,
                "message" => "Password updated successfully."
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error. Please try again."
            ];
        }
    }
}


class ReviewsOps
{
    private $connection;

    public function __construct()
    {
        $database = new Database();
        $this->connection = $database->getConnection();
    }

    // -------------------------------------------------------------------------
    public function addOrUpdateReview($userId, $movieData, $rating, $comment)
    {
        $userId = filter_var($userId, FILTER_VALIDATE_INT);
        $rating = filter_var($rating, FILTER_VALIDATE_INT);

        if (!$userId || !$rating || $rating < 1 || $rating > 10) {
            return [
                "success" => false,
                "message" => "Invalid data"
            ];
        }

        try {
            // 1. check movie
            $stmt = $this->connection->prepare(
                "SELECT id FROM movies WHERE tmdb_id = :tmdb_id"
            );
            $stmt->execute(["tmdb_id" => $movieData['tmdb_id']]);
            $movie = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($movie) {
                $movieId = $movie['id'];
            } else {
                // insert movie
                $stmt = $this->connection->prepare(
                    "INSERT INTO movies (tmdb_id, title, poster_path, release_date, description)
                     VALUES (:tmdb_id, :title, :poster, :date, :desc)"
                );

                $stmt->execute([
                    "tmdb_id" => $movieData['tmdb_id'],
                    "title" => $movieData['title'],
                    "poster" => $movieData['poster_path'],
                    "date" => $movieData['release_date'],
                    "desc" => $movieData['description']
                ]);

                $movieId = $this->connection->lastInsertId();
            }

            // 2. insert or update review
            $stmt = $this->connection->prepare(
                "INSERT INTO reviews (user_id, movie_id, rating, comment)
                 VALUES (:user_id, :movie_id, :rating, :comment)
                 ON DUPLICATE KEY UPDATE
                 rating = :rating,
                 comment = :comment"
            );

            $stmt->execute([
                "user_id" => $userId,
                "movie_id" => $movieId,
                "rating" => $rating,
                "comment" => $comment
            ]);

            return [
                "success" => true,
                "message" => "Review saved successfully"
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }

    // -------------------------------------------------------------------------
    public function getUserReview($userId, $movieId)
    {
        $userId = filter_var($userId, FILTER_VALIDATE_INT);
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

        if (!$userId || !$movieId) return false;

        $stmt = $this->connection->prepare(
            "SELECT * FROM reviews WHERE user_id = :user_id AND movie_id = :movie_id"
        );

        $stmt->execute([
            "user_id" => $userId,
            "movie_id" => $movieId
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // -------------------------------------------------------------------------
    public function deleteReview($userId, $movieId)
    {
        $userId = filter_var($userId, FILTER_VALIDATE_INT);
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

        if (!$userId || !$movieId) {
            return [
                "success" => false,
                "message" => "Invalid data"
            ];
        }

        try {
            $stmt = $this->connection->prepare(
                "DELETE FROM reviews WHERE user_id = :user_id AND movie_id = :movie_id"
            );

            $stmt->execute([
                "user_id" => $userId,
                "movie_id" => $movieId
            ]);

            if ($stmt->rowCount() > 0) {
                return [
                    "success" => true,
                    "message" => "Review deleted"
                ];
            }

            return [
                "success" => false,
                "message" => "Review not found"
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }

    // -------------------------------------------------------------------------
    public function getMovieReviews($movieId)
    {
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

        if (!$movieId) {
            return [
                "success" => false,
                "message" => "Invalid movie id"
            ];
        }

        try {
            $stmt = $this->connection->prepare(
                "SELECT reviews.*, users.username, users.photo
                 FROM reviews
                 JOIN users ON reviews.user_id = users.id
                 WHERE reviews.movie_id = :movie_id
                 ORDER BY reviews.created_at DESC"
            );

            $stmt->execute(["movie_id" => $movieId]);

            return [
                "success" => true,
                "reviews" => $stmt->fetchAll(PDO::FETCH_ASSOC)
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => "Database error"
            ];
        }
    }
}

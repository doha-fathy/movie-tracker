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
            return ["error" => "Invalid user"];
        }

        try {

            $query = " SELECT movies.* FROM watchlist JOIN movies ON watchlist.movie_id = movies.id
                       WHERE watchlist.user_id = :user_id ";

            $statement = $this->connection->prepare($query);

            $statement->execute(["user_id" => $userId]);

            $movies = $statement->fetchAll(PDO::FETCH_ASSOC);
            return ["success" => true,  "movies" => $movies];
        } catch (PDOException $e) {
            return ["error" => "Database error"];
        }
    }


    public function removeFromWatchlist($userId, $movieId)
    {

        $userId = filter_var($userId, FILTER_VALIDATE_INT);
        $movieId = filter_var($movieId, FILTER_VALIDATE_INT);

        if (!$userId || !$movieId) {
            return ["error" => "Invalid data"];
            return ["error" => "Invalid data"];
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
                return ["error" => "Movie not found in watchlist"];
            }
        } catch (PDOException $e) {
            return ["error" => "Database error"];
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
                    "lastInsertId" => $userId
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

        // Verify old password (CRITICAL for security)
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

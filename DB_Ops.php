<?php
require_once "Database.php";

class WatchlistOps
{
    private $conn;

    public function __construct()
    {
        $db = new Database();
        $this->conn = $db->getConnection();
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

            $statement = $this->conn->prepare($query);
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
        }

        try {

            $query = " DELETE FROM watchlist WHERE user_id = :user_id AND movie_id = :movie_id ";
            $statement = $this->conn->prepare($query);

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

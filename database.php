
<?php

class Database
{
    private $conn;

    public function __construct()
    {
        try {
            $env = parse_ini_file(__DIR__ . '/.env');

            $this->conn = new PDO(
                "mysql:host={$env['DB_HOST']};dbname={$env['DB_NAME']};charset=utf8mb4",
                $env['DB_USER'],
                $env['DB_PASS'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]
            );
        } catch (PDOException $e) {
            die("Database connection failed");
        }
    }

    public function getConnection()
    {
        return $this->conn;
    }
}

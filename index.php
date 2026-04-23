<?php
require_once 'header.php';  
?>
<!DOCTYPE html>
<html lang="en" class="bg-[linear-gradient(to_right,#0f050b,#1a0813,#2a0d1f,#3a1028)]">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Movie Tracker</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
        integrity="sha512-2SwdPD6INVrV/lHTZbO2nodKhrnDdJK9/kg2XD1r9uGqPo1cUbujc+IYdlYdEErWNu69gVcYgdxlmVmzTWnetw=="
        crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="Styles/Movies.css">
    <link rel="stylesheet" href="Styles/Style.css">
</head>

<body>
    <div id="navbar"></div>

    <main id="app"></main>

    <footer></footer>

    <script src="Scripts/API_Ops.js"></script>
    <script src="Scripts/Auth.js"></script>
    <script src="Scripts/Movies.js"></script>
    <script src="Scripts/Details.js"></script>
    <script src="Scripts/Upcoming.js"></script>
    <script src="Scripts/WatchingList.js"></script>
    <script src="Scripts/Profile.js"></script>
    <script src="Scripts/App.js"></script>
</body>

</html>
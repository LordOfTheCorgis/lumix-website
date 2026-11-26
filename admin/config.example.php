<?php
// Fill in the three marked lines and upload this as config.php into a folder named
// lumix-admin that sits NEXT TO public_html (not inside it, anything inside is on the
// internet). Home folder > lumix-admin > config.php. Never commit the real one.
return [
    // 1. who can log in: 'username' => 'password'. plain text is fine here, this file
    //    isn't served. add a line per person
    'users' => [
        'evan' => 'CHANGE-ME-to-a-long-password',
    ],

    // 2. fine-grained GitHub token, THIS repo only: Contents read+write, Actions read.
    //    GitHub > Settings > Developer settings > Fine-grained tokens
    'github_token' => '',

    'repo' => 'LordOfTheCorgis/lumix-website',

    // saves land on edit_branch, "Save and go live" also writes live_branch
    'edit_branch' => 'dev',
    'live_branch' => 'main',

    // the admin 404s on any other hostname, so dev.lumixsolutions.org (same
    // account, same config) doesn't grow a second login page
    'allowed_hosts' => ['lumixsolutions.org', 'www.lumixsolutions.org'],
];

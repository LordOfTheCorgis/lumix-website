<?php
// copy this to /home/<cpanel user>/lumix-admin/config.php, i.e. a folder NEXT TO
// public_html, never inside it (anything inside is on the internet). never commit
// the real one. File Manager can make the folder and upload the file.
return [
    // make each hash with: node scripts/admin-hash.mjs <name>   (on your own machine)
    'users' => [
        // 'evan' => 'pbkdf2$600000$...$...',
    ],

    // fine-grained token, THIS repo only: Contents read+write, Actions read.
    // it can push to main and a push to main deploys, so it lives only here
    'github_token' => '',
    'repo' => 'LordOfTheCorgis/lumix-website',

    // saves land on edit_branch, "Save and go live" also writes live_branch
    'edit_branch' => 'dev',
    'live_branch' => 'main',

    // the admin 404s on any other hostname, so dev.lumixsolutions.org (same
    // account, same config) doesn't grow a second login page
    'allowed_hosts' => ['lumixsolutions.org', 'www.lumixsolutions.org'],
];

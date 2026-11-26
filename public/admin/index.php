<?php
// lumixsolutions.org/admin. the whole backend in one file: login, a few forms
// over src/data/*.json, and every save is a git commit made through the GitHub
// API, so the deploy that already exists builds and ships it. no database.
//
// config (users, github token) lives OUTSIDE public_html, see
// admin/config.example.php. kept to php 7.4 syntax because cpanel's default
// php is whatever the host picked and nobody has checked
declare(strict_types=1);

const SESSION_TTL = 43200;     // 12h
const LOCK_AFTER = 5;          // wrong passwords for one username
const LOCK_SECONDS = 300;

// ---------- plumbing ----------

function send_headers(string $type): void {
    header("Content-Type: $type");
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    // same-origin, NOT no-referrer: no-referrer makes browsers send "Origin: null"
    // on form posts and the origin check below eats every login
    header('Referrer-Policy: same-origin');
    header('X-Robots-Tag: noindex, nofollow');
    header("Content-Security-Policy: default-src 'self'; frame-ancestors 'none'; form-action 'self'");
}
function out_json(int $code, $body): void {
    http_response_code($code);
    send_headers('application/json');
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
function out_html(int $code, string $html): void {
    http_response_code($code);
    send_headers('text/html; charset=utf-8');
    echo $html;
    exit;
}
function redirect(string $to): void {
    http_response_code(303);
    send_headers('text/plain');
    header("Location: $to");
    exit;
}
function base(): string { return rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); }
function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES); }

function cfg(): array {
    static $c = null;
    if ($c !== null) return $c;
    // "where is home" depends on how the host runs php (HOME env, a passwd entry, or
    // neither), so try every way of finding the folder next to public_html
    $home = getenv('HOME');
    if (!$home && function_exists('posix_getpwuid')) $home = (posix_getpwuid(posix_geteuid())['dir'] ?? '');
    $cands = [];
    if (getenv('LUMIX_ADMIN_CONFIG')) $cands['env'] = getenv('LUMIX_ADMIN_CONFIG');
    if ($home) $cands['home'] = rtrim($home, '/') . '/lumix-admin/config.php';
    if (!empty($_SERVER['DOCUMENT_ROOT'])) $cands['docroot'] = dirname($_SERVER['DOCUMENT_ROOT']) . '/lumix-admin/config.php';
    $cands['script'] = dirname(__DIR__, 3) . '/lumix-admin/config.php';
    foreach ($cands as $p) {
        if (is_file($p)) { $GLOBALS['lumix_cfg_path'] = $p; $c = require $p; return $c; }
    }
    // say which lookups failed without printing paths (this page is public)
    $yn = function ($b) { return $b ? 'yes' : 'no'; };
    $rows = '';
    foreach ($cands as $label => $p) $rows .= "$label: folder " . $yn(is_dir(dirname($p))) . ", config.php " . $yn(is_file($p)) . "\n";
    $rows .= 'HOME set: ' . $yn((bool)getenv('HOME')) . ", open_basedir: " . $yn((bool)ini_get('open_basedir')) . "\n";
    out_html(503, '<p>Admin is not set up yet: no lumix-admin/config.php next to public_html.</p><pre>' . h($rows) . '</pre>');
}

function state_dir(): string {
    $c = cfg();
    $d = $c['state_dir'] ?? dirname($GLOBALS['lumix_cfg_path']) . '/state';
    if (!is_dir($d)) @mkdir($d, 0700, true);
    return $d;
}

// ---------- passwords + lockout ----------

// the config can hold the password as plain text (the file sits above public_html,
// same trust level as the github token next to it), or a hash if you'd rather:
// pbkdf2$<iterations>$<salt hex>$<hash hex> from scripts/admin-hash.mjs, or php's
// password_hash() output
function pw_ok(string $pw, string $stored): bool {
    if (strpos($stored, '$') !== 0 && strpos($stored, 'pbkdf2$') !== 0) return hash_equals($stored, $pw);
    if (strpos($stored, 'pbkdf2$') === 0) {
        $p = explode('$', $stored);
        if (count($p) !== 4) return false;
        $salt = @hex2bin($p[2]);
        if ($salt === false || (int)$p[1] < 1) return false;
        return hash_equals($p[3], hash_pbkdf2('sha256', $pw, $salt, (int)$p[1], strlen($p[3]), false));
    }
    return password_verify($pw, $stored);
}

// one json file of {username-hash: [fails, locked-until]}. per username, not per
// ip: behind cloudflare every visitor can look like one ip, and a header you
// can fake is no basis for a lockout.
// shortcut: anyone can lock "evan" out for 5 minutes by guessing wrong, which
// beats letting them guess fast. upgrade if that ever actually happens
function with_attempts(callable $fn) {
    $f = fopen(state_dir() . '/attempts.json', 'c+');
    flock($f, LOCK_EX);
    $d = json_decode((string)stream_get_contents($f), true) ?: [];
    $r = $fn($d);
    ftruncate($f, 0); rewind($f);
    fwrite($f, json_encode($d));
    flock($f, LOCK_UN); fclose($f);
    return $r;
}
function locked(string $user): bool {
    $k = sha1(strtolower($user));
    return with_attempts(function (&$d) use ($k) { return isset($d[$k]) && $d[$k][1] > time(); });
}
function note_fail(string $user): void {
    $k = sha1(strtolower($user));
    with_attempts(function (&$d) use ($k) {
        $e = $d[$k] ?? [0, 0];
        if ($e[1] && $e[1] <= time()) $e = [0, 0];
        $e[0]++;
        if ($e[0] >= LOCK_AFTER) $e[1] = time() + LOCK_SECONDS;
        $d[$k] = $e;
    });
}
function note_ok(string $user): void {
    $k = sha1(strtolower($user));
    with_attempts(function (&$d) use ($k) { unset($d[$k]); });
}

function start_session(): void {
    $https = !empty($_SERVER['HTTPS']) || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        || strpos($_SERVER['HTTP_CF_VISITOR'] ?? '', 'https') !== false;
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', (string)SESSION_TTL);
    session_name('lxadmin');
    session_set_cookie_params(['lifetime' => 0, 'path' => base() . '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
    if (isset($_SESSION['at']) && time() - $_SESSION['at'] > SESSION_TTL) { session_destroy(); session_start(); }
}

// ---------- github ----------

class Conflict extends Exception {}

function gh(string $method, string $path, ?array $body = null): array {
    $c = cfg();
    if (!function_exists('curl_init')) throw new RuntimeException('php curl is not enabled on this host');
    $url = rtrim($c['github_api'] ?? 'https://api.github.com', '/') . '/repos/' . $c['repo'] . '/' . $path;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $c['github_token'],
            'Accept: application/vnd.github+json',
            'X-GitHub-Api-Version: 2022-11-28',
            'User-Agent: lumix-admin',
            'Content-Type: application/json',
        ],
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    $res = curl_exec($ch);
    if ($res === false) { $e = curl_error($ch); curl_close($ch); throw new RuntimeException("couldn't reach github: $e"); }
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, json_decode($res, true)];
}
function enc_path(string $p): string { return implode('/', array_map('rawurlencode', explode('/', $p))); }

function gh_read(string $branch, string $path): ?array {
    [$code, $j] = gh('GET', 'contents/' . enc_path($path) . '?ref=' . rawurlencode($branch));
    if ($code === 404) return null;
    if ($code !== 200) throw new RuntimeException("github said $code reading $path on $branch" . (isset($j['message']) ? ": {$j['message']}" : ''));
    if (!isset($j['content'])) return null;
    return ['content' => base64_decode(str_replace("\n", '', $j['content'])), 'sha' => $j['sha']];
}
function gh_write(string $branch, string $path, string $content, string $sha, string $msg): string {
    [$code, $j] = gh('PUT', 'contents/' . enc_path($path), ['message' => $msg, 'branch' => $branch, 'content' => base64_encode($content), 'sha' => $sha]);
    if ($code === 409 || $code === 422) throw new Conflict('the file changed on github while you were saving');
    if ($code !== 200 && $code !== 201) throw new RuntimeException("github said $code writing $path on $branch" . (isset($j['message']) ? ": {$j['message']}" : ''));
    return $j['content']['sha'];
}
function gh_list(string $branch, string $dir): array {
    [$code, $j] = gh('GET', 'contents/' . enc_path($dir) . '?ref=' . rawurlencode($branch));
    if ($code !== 200 || !is_array($j)) return [];
    $names = [];
    foreach ($j as $f) if (($f['type'] ?? '') === 'file') $names[] = $f['name'];
    return $names;
}
function gh_run(string $branch): ?array {
    try {
        [$code, $j] = gh('GET', 'actions/runs?per_page=1&branch=' . rawurlencode($branch));
    } catch (Exception $e) { return null; }
    $r = $j['workflow_runs'][0] ?? null;
    return $r ? ['status' => $r['status'], 'conclusion' => $r['conclusion'], 'url' => $r['html_url'], 'at' => $r['created_at']] : null;
}

// ---------- the data files ----------

// same rules as src/lib/schemas.mjs (what the site build parses with). if you
// change one, change the other. the build is the backstop: a save this lets
// through that zod rejects fails the deploy BEFORE upload, the live site stays up
function S_str(int $min = 0, ?int $max = null): array { return ['str', $min, $max]; }
function S_obj(array $f): array { return ['obj', $f]; }
function S_arr(array $n): array { return ['arr', $n]; }

function check(array $n, $v, string $path, array &$errs): void {
    switch ($n[0]) {
        case 'str':
            if (!is_string($v)) { $errs[] = [$path, 'Expected text']; return; }
            $len = mb_strlen($v);
            if ($len < $n[1]) $errs[] = [$path, $n[1] === 1 ? 'Required' : "At least {$n[1]} characters"];
            if ($n[2] !== null && $len > $n[2]) $errs[] = [$path, "At most {$n[2]} characters"];
            return;
        case 'url':
            $ok = is_string($v) && filter_var($v, FILTER_VALIDATE_URL) && in_array(parse_url($v, PHP_URL_SCHEME), ['http', 'https'], true);
            if (!$ok) $errs[] = [$path, 'Invalid URL (needs http:// or https://)'];
            return;
        case 're':
            if (!is_string($v) || !preg_match($n[1], $v)) $errs[] = [$path, $n[2]];
            return;
        case 'num':
            if (!is_int($v) && !is_float($v)) { $errs[] = [$path, 'Expected a number']; return; }
            if ($v < $n[1] || $v > $n[2]) $errs[] = [$path, "Must be between {$n[1]} and {$n[2]}"];
            return;
        case 'int':
            if (!is_int($v)) { $errs[] = [$path, 'Expected a whole number']; return; }
            if ($v < $n[1] || $v > $n[2]) $errs[] = [$path, "Must be between {$n[1]} and {$n[2]}"];
            return;
        case 'bool':
            if (!is_bool($v)) $errs[] = [$path, 'Expected true or false'];
            return;
        case 'blank':
            if ($v !== '') $errs[] = [$path, 'VM ips stay blank, the repo is public'];
            return;
        case 'nullable':
            if ($v !== null) check($n[1], $v, $path, $errs);
            return;
        case 'arr':
            if (!is_array($v) || ($v && array_keys($v) !== range(0, count($v) - 1))) { $errs[] = [$path, 'Expected a list']; return; }
            foreach ($v as $i => $item) check($n[1], $item, $path === '' ? (string)$i : "$path.$i", $errs);
            return;
        case 'obj':
            if (!is_array($v) || ($v && array_keys($v) === range(0, count($v) - 1))) { $errs[] = [$path, 'Expected an object']; return; }
            foreach ($v as $k => $_) if (!isset($n[1][$k])) $errs[] = [$path === '' ? (string)$k : "$path.$k", 'Unrecognized field'];
            foreach ($n[1] as $k => [$sub, $required]) {
                $p = $path === '' ? $k : "$path.$k";
                if (!array_key_exists($k, $v)) { if ($required) $errs[] = [$p, 'Required']; continue; }
                check($sub, $v[$k], $p, $errs);
            }
            return;
    }
}

function datasets(): array {
    $url = ['url'];
    return [
        'locations' => [
            'file' => 'src/data/locations.json',
            'schema' => S_arr(S_obj([
                'city' => [S_str(1), true], 'region' => [S_str(1), true],
                'lat' => [['num', -90, 90], true], 'lng' => [['num', -180, 180], true],
                'slug' => [['re', '/^[a-z0-9-]+$/', 'Lowercase letters, numbers and dashes only'], false],
                'serves' => [S_str(), false], 'pingUrl' => [$url, false],
                'vms' => [S_arr(S_obj(['name' => [S_str(1), true], 'ip' => [['blank'], true]])), false],
                'soldOut' => [['bool'], false], 'whmcsId' => [['int', 1, PHP_INT_MAX], false],
            ])),
        ],
        'partners' => [
            'file' => 'src/data/partners.json', 'assets' => 'src/assets/partners', 'assetKey' => 'logo',
            'schema' => S_arr(S_obj([
                'name' => [S_str(1), true], 'mark' => [S_str(1, 4), true], 'logo' => [S_str(1), false],
                'founder' => [S_str(1), true], 'description' => [S_str(1), true],
                'services' => [S_arr(S_str(1)), true], 'note' => [S_str(), false],
                'offer' => [S_obj(['code' => [S_str(1), true], 'text' => [S_str(1), true]]), false],
                'url' => [$url, false], 'gallery' => [$url, false], 'discord' => [$url, true],
            ])),
        ],
        'staff' => [
            'file' => 'src/data/staff.json', 'assets' => 'src/assets/staff', 'assetKey' => 'image',
            'schema' => S_arr(S_obj([
                'name' => [S_str(1), true], 'mark' => [S_str(1, 4), true], 'title' => [S_str(1), true],
                'bio' => [S_str(1), true], 'image' => [S_str(1), false],
                'links' => [S_arr(S_obj(['label' => [S_str(1), true], 'href' => [$url, true]])), true],
            ])),
        ],
        'settings' => [
            'file' => 'src/data/settings.json',
            'schema' => S_obj([
                'promo' => [S_obj(['code' => [S_str(1), true], 'percent' => [['int', 1, 100], true], 'live' => [['bool'], true]]), true],
                'trust' => [S_obj([
                    'score' => [['nullable', ['num', 0, 5]], true], 'reviews' => [['nullable', ['int', 0, PHP_INT_MAX]], true],
                    'updated' => [['re', '/^\d{4}-\d{2}-\d{2}$/', 'Use YYYY-MM-DD'], true], 'url' => [$url, true],
                ]), true],
            ]),
        ],
    ];
}

// 2-space json like node writes it, or the first save rewrites every line of the file
function pretty($data): string {
    $j = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
    $j = preg_replace_callback('/^( {4})+/m', function ($m) { return str_repeat('  ', intdiv(strlen($m[0]), 4)); }, $j);
    return $j . "\n";
}

function summarize(string $name, $before, $after): string {
    if ($name === 'locations') {
        $was = [];
        foreach ($before as $r) $was[$r['city']] = !empty($r['soldOut']);
        $bits = [];
        foreach ($after as $r) {
            if (!array_key_exists($r['city'], $was)) $bits[] = "added {$r['city']}";
            elseif ($was[$r['city']] !== !empty($r['soldOut'])) $bits[] = $r['city'] . (!empty($r['soldOut']) ? ' sold out' : ' open again');
        }
        if ($bits) return implode(', ', $bits);
    }
    return "edited $name";
}

// ---------- pages ----------

function v(string $f): string { return (string)@filemtime(__DIR__ . "/$f"); }
function shell(string $title, string $body, string $extraHead = ''): string {
    $b = base();
    return "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
        . "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        . "<meta name=\"robots\" content=\"noindex, nofollow\"><title>" . h($title) . "</title>"
        . "<link rel=\"stylesheet\" href=\"$b/app.css?v=" . v('app.css') . "\">$extraHead</head><body>$body</body></html>";
}
function login_page(string $msg): string {
    $b = base();
    return shell('Lumix admin', '<main class="login"><h1>Lumix<span class="dotred">.</span> admin</h1>'
        . '<p>Sign in to edit regions, partners and staff.</p>'
        . "<form method=\"post\" action=\"$b/index.php?x=login\">"
        . '<label class="f">Username<input type="text" name="user" autocomplete="username" autofocus required></label>'
        . '<label class="f">Password<input type="password" name="password" autocomplete="current-password" required></label>'
        . '<p class="err" role="alert">' . h($msg) . '</p><button class="primary" type="submit">Sign in</button></form></main>');
}
function app_page(): string {
    $b = base();
    return shell('Lumix admin', '<header class="top"><div class="shell"><div class="brand">Lumix<span>.</span> admin</div><div class="grow"></div>'
        . '<span class="who" id="who"></span>'
        . "<form method=\"post\" action=\"$b/index.php?x=logout\"><button class=\"small ghost\" type=\"submit\">Log out</button></form></div></header>"
        . '<main class="shell"><nav class="tabs" id="tabs" role="tablist"></nav><div class="status" id="status" aria-live="polite"></div>'
        . '<div id="banner" aria-live="polite"></div><div id="list"></div><div class="bar" id="bar"></div></main>'
        . "<script src=\"$b/app.js?v=" . v('app.js') . "\" data-api=\"$b/index.php\"></script>");
}

// ---------- routes ----------

$c = cfg();
if (!empty($c['allowed_hosts']) && !in_array(strtolower($_SERVER['HTTP_HOST'] ?? ''), $c['allowed_hosts'], true)) {
    out_html(404, 'Not found');
}
start_session();

$x = $_GET['x'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// SameSite=Strict does most of the csrf work, this catches the rest
if ($method === 'POST' && isset($_SERVER['HTTP_ORIGIN'])) {
    $oh = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
    $op = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_PORT);
    $origin = $oh . ($op ? ":$op" : '');
    if (strcasecmp($origin, $_SERVER['HTTP_HOST'] ?? '') !== 0) out_json(403, ['error' => 'bad origin']);
}

if ($x === 'login' && $method === 'POST') {
    $u = (string)($_POST['user'] ?? '');
    $pw = (string)($_POST['password'] ?? '');
    if (locked($u)) redirect(base() . '/?e=locked');
    $users = $c['users'] ?? [];
    $stored = is_string($users[$u] ?? null) ? $users[$u] : 'pbkdf2$1000$00$00'; // unknown name still burns a hash
    $ok = pw_ok($pw, $stored) && isset($users[$u]);
    if (!$ok) { note_fail($u); redirect(base() . '/?e=1'); }
    note_ok($u);
    session_regenerate_id(true);
    $_SESSION = ['user' => $u, 'at' => time()];
    redirect(base() . '/');
}
if ($x === 'logout' && $method === 'POST') {
    session_destroy();
    redirect(base() . '/');
}

if (empty($_SESSION['user'])) {
    if ($x !== '') out_json(401, ['error' => 'log in again']);
    out_html(200, login_page(['1' => 'Wrong username or password.', 'locked' => 'Too many tries. Wait five minutes.'][$_GET['e'] ?? ''] ?? ''));
}
$user = $_SESSION['user'];

if ($x === '') out_html(200, app_page());

$edit = $c['edit_branch'] ?? 'dev';
$live = $c['live_branch'] ?? 'main';

try {
    if ($x === 'me') out_json(200, ['user' => $user, 'editBranch' => $edit, 'liveBranch' => $live]);
    if ($x === 'deploys') out_json(200, [$edit => gh_run($edit), $live => gh_run($live)]);
    if ($x !== 'data') out_json(404, ['error' => 'not found']);

    $all = datasets();
    $name = (string)($_GET['name'] ?? '');
    if (!isset($all[$name])) out_json(404, ['error' => 'not found']);
    $ds = $all[$name];

    if ($method === 'GET') {
        $dev = gh_read($edit, $ds['file']);
        if (!$dev) out_json(404, ['error' => "{$ds['file']} is not on $edit"]);
        $main = gh_read($live, $ds['file']);
        out_json(200, [
            'data' => json_decode($dev['content'], true),
            'sha' => $dev['sha'],
            'live' => !$main ? 'missing' : ($main['content'] === $dev['content'] ? 'same' : 'behind'),
            'assets' => isset($ds['assets']) ? gh_list($edit, $ds['assets']) : null,
        ]);
    }

    if ($method !== 'POST') out_json(405, ['error' => 'method not allowed']);
    if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) out_json(415, ['error' => 'json only']);
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body) || !array_key_exists('data', $body)) out_json(400, ['error' => 'bad json']);
    $data = $body['data'];

    $errs = [];
    check($ds['schema'], $data, '', $errs);
    if ($name === 'locations' && !$errs) {
        $seen = [];
        foreach ($data as $i => $r) {
            if (!isset($r['whmcsId'])) continue;
            if (isset($seen[$r['whmcsId']])) $errs[] = ["$i.whmcsId", "whmcsId {$r['whmcsId']} is on two regions"];
            $seen[$r['whmcsId']] = true;
        }
    }
    // a filename with no file behind it fails the site build
    if (isset($ds['assets']) && !$errs) {
        $files = gh_list($edit, $ds['assets']);
        foreach ($data as $i => $r) {
            if (isset($r[$ds['assetKey']]) && !in_array($r[$ds['assetKey']], $files, true)) $errs[] = ["$i.{$ds['assetKey']}", "No such file in {$ds['assets']}"];
        }
    }
    if ($errs) out_json(422, ['errors' => array_map(function ($e) { return ['path' => $e[0], 'message' => $e[1]]; }, $errs)]);

    $dev = gh_read($edit, $ds['file']);
    if (!$dev) out_json(404, ['error' => "{$ds['file']} is not on $edit"]);
    if (($body['sha'] ?? null) !== $dev['sha']) out_json(409, ['error' => 'someone saved this since you opened it. reload, then redo your edit']);

    $before = json_decode($dev['content'], true);
    if ($name === 'settings' && ($before['trust']['score'] !== $data['trust']['score'] || $before['trust']['reviews'] !== $data['trust']['reviews'])) {
        $data['trust']['updated'] = (new DateTime('now', new DateTimeZone('America/Chicago')))->format('Y-m-d'); // the file's own comment says to, nobody remembers
    }
    $content = pretty($data);
    $msg = summarize($name, $before, $data) . " (admin, $user)";

    $goLive = !empty($body['live']);
    $liveFile = null;
    if ($goLive) {
        $liveFile = gh_read($live, $ds['file']);
        // main without the json refactor reads nothing from this file, writing it there is litter
        if (!$liveFile) out_json(409, ['error' => "$live has no {$ds['file']} yet. ship the data refactor there first"]);
    }

    $sha = $dev['sha'];
    try {
        if ($content !== $dev['content']) $sha = gh_write($edit, $ds['file'], $content, $dev['sha'], $msg);
        if ($liveFile && $content !== $liveFile['content']) gh_write($live, $ds['file'], $content, $liveFile['sha'], $msg);
    } catch (Conflict $e) {
        out_json(409, ['error' => $e->getMessage(), 'devSaved' => $sha !== $dev['sha'], 'sha' => $sha]);
    } catch (Exception $e) {
        out_json(502, ['error' => $e->getMessage(), 'devSaved' => $sha !== $dev['sha'], 'sha' => $sha]);
    }
    out_json(200, ['ok' => true, 'sha' => $sha, 'live' => $goLive, 'data' => $data, 'unchanged' => $content === $dev['content']]);
} catch (Exception $e) {
    out_json(502, ['error' => $e->getMessage()]);
}

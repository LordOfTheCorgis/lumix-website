<?php
// lumixsolutions.org/admin. the whole backend: login, forms over the site's data
// files, image uploads. every save is a git commit made through the GitHub API, so
// the deploy that already exists builds and ships it. no database.
// what can be edited and how it's checked: datasets.php
//
// config (users, github token) lives OUTSIDE public_html, see
// admin/config.example.php. kept to php 7.4 syntax because cpanel's default
// php is whatever the host picked and nobody has checked
declare(strict_types=1);

require __DIR__ . '/datasets.php';

const SESSION_TTL = 43200;     // 12h
const LOCK_AFTER = 5;          // wrong passwords for one username
const LOCK_SECONDS = 300;
const MAX_UPLOAD = 1000000;    // github's contents api only hands back files up to 1MB

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
        CURLOPT_TIMEOUT => 25,
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
function gh_fail(int $code, $j, string $what): RuntimeException {
    return new RuntimeException("github said $code $what" . (isset($j['message']) ? ": {$j['message']}" : ''));
}

function gh_read(string $branch, string $path): ?array {
    [$code, $j] = gh('GET', 'contents/' . enc_path($path) . '?ref=' . rawurlencode($branch));
    if ($code === 404) return null;
    if ($code !== 200) throw gh_fail($code, $j, "reading $path on $branch");
    if (!isset($j['content'])) return null;
    return ['content' => base64_decode(str_replace("\n", '', $j['content'])), 'sha' => $j['sha']];
}
// $sha null = create a new file
function gh_write(string $branch, string $path, string $content, ?string $sha, string $msg): string {
    $body = ['message' => $msg, 'branch' => $branch, 'content' => base64_encode($content)];
    if ($sha !== null) $body['sha'] = $sha;
    [$code, $j] = gh('PUT', 'contents/' . enc_path($path), $body);
    if ($code === 409 || $code === 422) throw new Conflict('the file changed on github while you were saving');
    if ($code !== 200 && $code !== 201) throw gh_fail($code, $j, "writing $path on $branch");
    return $j['content']['sha'];
}
function gh_delete(string $branch, string $path, string $sha, string $msg): void {
    [$code, $j] = gh('DELETE', 'contents/' . enc_path($path), ['message' => $msg, 'branch' => $branch, 'sha' => $sha]);
    if ($code === 409 || $code === 422) throw new Conflict('the file changed on github while you were deleting it');
    if ($code !== 200) throw gh_fail($code, $j, "deleting $path on $branch");
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

// ---------- helpers for saving ----------

function summarize(string $name, string $item, $before, $after): string {
    if ($name === 'locations' && is_array($before)) {
        $was = [];
        foreach ($before as $r) $was[$r['city']] = !empty($r['soldOut']);
        $bits = [];
        foreach ($after as $r) {
            if (!array_key_exists($r['city'], $was)) $bits[] = "added {$r['city']}";
            elseif ($was[$r['city']] !== !empty($r['soldOut'])) $bits[] = $r['city'] . (!empty($r['soldOut']) ? ' sold out' : ' open again');
        }
        if ($bits) return implode(', ', $bits);
    }
    if ($before === null) return "added $name $item";
    return $item !== '' ? "edited $name $item" : "edited $name";
}

function chicago(string $fmt): string { return (new DateTime('now', new DateTimeZone('America/Chicago')))->format($fmt); }

function asset_listing(string $branch, string $dirKey): array {
    static $cache = [];
    $k = "$branch/$dirKey";
    if (!isset($cache[$k])) $cache[$k] = gh_list($branch, ASSET_DIRS[$dirKey]);
    return $cache[$k];
}
function assets_for(array $ds, string $branch): array {
    $out = [];
    foreach ($ds['assetDirs'] ?? [] as $k) $out[$k] = asset_listing($branch, $k);
    return $out;
}

// going live with a new logo: main needs the file too, or the build there throws
function copy_missing_assets(array $refs, string $edit, string $live, string $msg): void {
    foreach ($refs as [, $dirKey, $file]) {
        if (in_array($file, gh_list($live, ASSET_DIRS[$dirKey]), true)) continue;
        $src = gh_read($edit, ASSET_DIRS[$dirKey] . '/' . $file);
        if ($src) gh_write($live, ASSET_DIRS[$dirKey] . '/' . $file, $src['content'], null, $msg);
    }
}

function image_type(string $bytes, string $dirKey): ?string {
    if (strncmp($bytes, "\x89PNG\r\n\x1a\n", 8) === 0) return 'png';
    if (strncmp($bytes, "\xFF\xD8\xFF", 3) === 0) return 'jpg';
    if (strncmp($bytes, 'RIFF', 4) === 0 && substr($bytes, 8, 4) === 'WEBP') return 'webp';
    // svg only for game logos (that's the only place there are any), and nothing that can run script
    if ($dirKey === 'logos' && preg_match('/<svg[\s>]/i', substr($bytes, 0, 2000)) && !preg_match('/<script|\son\w+\s*=|javascript:/i', $bytes)) return 'svg';
    return null;
}

// ---------- pages ----------

function v(string $f): string { return (string)@filemtime(__DIR__ . "/$f"); }
function shell(string $title, string $body): string {
    $b = base();
    return "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">"
        . "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        . "<meta name=\"robots\" content=\"noindex, nofollow\"><title>" . h($title) . "</title>"
        . "<link rel=\"stylesheet\" href=\"$b/app.css?v=" . v('app.css') . "\"></head><body>$body</body></html>";
}
function login_page(string $msg): string {
    $b = base();
    return shell('Lumix admin', '<main class="login"><h1>Lumix<span class="dotred">.</span> admin</h1>'
        . '<p>Sign in to edit the site.</p>'
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
        . '<div id="banner" aria-live="polite"></div><div id="picker"></div><div id="list"></div><div class="bar" id="bar"></div></main>'
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

    // ---- images: straight into the edit branch, copied to main only when a saved page needs them
    if ($x === 'upload') {
        if ($method !== 'POST') out_json(405, ['error' => 'method not allowed']);
        $dirKey = (string)($_GET['dir'] ?? '');
        if (!isset(ASSET_DIRS[$dirKey])) out_json(404, ['error' => 'not found']);
        $f = $_FILES['file'] ?? null;
        if (!$f || $f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) out_json(400, ['error' => 'no file came through (is it over the host\'s upload limit?)']);
        if ($f['size'] > MAX_UPLOAD) out_json(413, ['error' => 'Keep images under 1 MB. Shrink it first.']);
        $bytes = (string)file_get_contents($f['tmp_name']);
        $type = image_type($bytes, $dirKey);
        if (!$type) out_json(415, ['error' => $dirKey === 'logos' ? 'Use a webp, png, jpg or svg.' : 'Use a webp, png or jpg.']);
        $stem = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(pathinfo((string)$f['name'], PATHINFO_FILENAME))), '-');
        if ($stem === '') out_json(400, ['error' => 'Give the file a name with letters or numbers in it.']);
        $name = "$stem.$type";
        $path = ASSET_DIRS[$dirKey] . '/' . $name;
        $existing = gh_read($edit, $path);
        if ($existing && empty($_POST['overwrite'])) out_json(409, ['error' => "$name already exists", 'exists' => true, 'name' => $name]);
        gh_write($edit, $path, $bytes, $existing ? $existing['sha'] : null, ($existing ? 'replaced' : 'added') . " $dirKey image $name (admin, $user)");
        out_json(200, ['ok' => true, 'name' => $name]);
    }

    if ($x !== 'data' && $x !== 'delete') out_json(404, ['error' => 'not found']);

    $all = datasets();
    $name = (string)($_GET['name'] ?? '');
    if (!isset($all[$name])) out_json(404, ['error' => 'not found']);
    $ds = $all[$name];
    $isDir = isset($ds['dir']);
    $item = (string)($_GET['item'] ?? '');

    // the list of files in a folder dataset (games, legal pages)
    if ($x === 'data' && $method === 'GET' && $isDir && $item === '') {
        $items = [];
        $ext = '.' . $ds['ext'];
        foreach (gh_list($edit, $ds['dir']) as $fn) {
            if (substr($fn, -strlen($ext)) === $ext) $items[] = substr($fn, 0, -strlen($ext));
        }
        sort($items);
        out_json(200, ['items' => $items, 'create' => !empty($ds['create']), 'delete' => !empty($ds['delete']), 'assets' => assets_for($ds, $edit)]);
    }

    $path = ds_path($ds, $item);
    if ($path === null) out_json(404, ['error' => 'not found']);

    if ($x === 'data' && $method === 'GET') {
        $dev = gh_read($edit, $path);
        if (!$dev) out_json(404, ['error' => "$path is not on $edit"]);
        $main = gh_read($live, $path);
        $data = ds_decode($ds, $dev['content']);
        if ($data === null) out_json(500, ['error' => "couldn't read $path, it isn't shaped the way the admin expects"]);
        out_json(200, [
            'data' => $data,
            'sha' => $dev['sha'],
            'live' => !$main ? 'missing' : ($main['content'] === $dev['content'] ? 'same' : 'behind'),
            'assets' => assets_for($ds, $edit),
        ]);
    }

    if ($method !== 'POST') out_json(405, ['error' => 'method not allowed']);
    if (strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) out_json(415, ['error' => 'json only']);
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) out_json(400, ['error' => 'bad json']);
    $goLive = !empty($body['live']);

    // ---- delete a file (games)
    if ($x === 'delete') {
        if (empty($ds['delete'])) out_json(405, ['error' => 'this can not be deleted']);
        $dev = gh_read($edit, $path);
        if (!$dev) out_json(404, ['error' => "$path is not on $edit"]);
        if (($body['sha'] ?? null) !== $dev['sha']) out_json(409, ['error' => 'someone saved this since you opened it. reload first']);
        $msg = "removed $name $item (admin, $user)";
        try {
            gh_delete($edit, $path, $dev['sha'], $msg);
            if ($goLive && ($mainFile = gh_read($live, $path))) gh_delete($live, $path, $mainFile['sha'], $msg);
        } catch (Exception $e) {
            out_json($e instanceof Conflict ? 409 : 502, ['error' => $e->getMessage()]);
        }
        out_json(200, ['ok' => true]);
    }

    // ---- save
    if (!array_key_exists('data', $body)) out_json(400, ['error' => 'bad json']);
    $data = $body['data'];
    $create = !empty($body['create']);

    $errs = [];
    check($ds['schema'], $data, '', $errs);
    if (!$errs && isset($ds['post'])) $ds['post']($data, $errs);
    if (!$errs && isset($ds['item'])) $ds['item']($data, $item, $errs);
    // a filename with no file behind it fails the site build
    $refs = !$errs && isset($ds['refs']) ? $ds['refs']($data) : [];
    foreach ($refs as [$p, $dirKey, $file]) {
        if (!in_array($file, asset_listing($edit, $dirKey), true)) $errs[] = [$p, 'No such file in ' . ASSET_DIRS[$dirKey]];
    }
    if ($errs) out_json(422, ['errors' => array_map(function ($e) { return ['path' => $e[0], 'message' => $e[1]]; }, $errs)]);

    $dev = gh_read($edit, $path);
    if ($create) {
        if ($dev) out_json(409, ['error' => "$item already exists"]);
        $before = null;
    } else {
        if (!$dev) out_json(404, ['error' => "$path is not on $edit"]);
        if (($body['sha'] ?? null) !== $dev['sha']) out_json(409, ['error' => 'someone saved this since you opened it. reload, then redo your edit']);
        $before = ds_decode($ds, $dev['content']);
    }

    if ($name === 'settings' && $before && ($before['trust']['score'] !== $data['trust']['score'] || $before['trust']['reviews'] !== $data['trust']['reviews'])) {
        $data['trust']['updated'] = chicago('Y-m-d'); // the file's own comment says to, nobody remembers
    }
    if ($name === 'legal' && $before && $before['body'] !== $data['body'] && $before['lastUpdated'] === $data['lastUpdated']) {
        $data['lastUpdated'] = chicago('F j, Y'); // changed the text but not the date: the date is a legal claim
    }
    $content = ds_encode($ds, $data);
    $msg = summarize($name, $item, $before, $data) . " (admin, $user)";

    $liveFile = $goLive ? gh_read($live, $path) : null;
    // main without the data files can't read them, writing there is litter. a brand new item is the exception
    if ($goLive && !$liveFile && !$create) out_json(409, ['error' => "$live has no $path yet. ship the data refactor there first"]);

    $sha = $dev ? $dev['sha'] : '';
    $devSaved = false;
    try {
        if (!$dev || $content !== $dev['content']) { $sha = gh_write($edit, $path, $content, $dev ? $dev['sha'] : null, $msg); $devSaved = true; }
        if ($goLive) {
            copy_missing_assets($refs, $edit, $live, $msg);
            if (!$liveFile || $content !== $liveFile['content']) gh_write($live, $path, $content, $liveFile ? $liveFile['sha'] : null, $msg);
        }
    } catch (Conflict $e) {
        out_json(409, ['error' => $e->getMessage(), 'devSaved' => $devSaved, 'sha' => $sha]);
    } catch (Exception $e) {
        out_json(502, ['error' => $e->getMessage(), 'devSaved' => $devSaved, 'sha' => $sha]);
    }
    out_json(200, ['ok' => true, 'sha' => $sha, 'live' => $goLive, 'data' => $data, 'unchanged' => $dev && $content === $dev['content']]);
} catch (Exception $e) {
    out_json(502, ['error' => $e->getMessage()]);
}

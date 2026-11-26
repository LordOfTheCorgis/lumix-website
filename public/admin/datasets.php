<?php
// what the admin can edit and what a valid save looks like. plain functions, no
// output, so loading this file directly in a browser shows nothing.
//
// the rules are a COPY of src/lib/schemas.mjs (site data) and src/content.config.ts
// (games), which the site build parses with. change one, change the other. the
// build is the backstop: a save this lets through that zod rejects fails the deploy
// BEFORE upload, so the live site stays up. tests/admin.test.mjs saves every real
// file unchanged through this, so the two can't quietly drift apart on today's data
declare(strict_types=1);

const ASSET_DIRS = [
    'partners' => 'src/assets/partners',
    'staff' => 'src/assets/staff',
    'games' => 'src/assets/games',
    'logos' => 'src/assets/logos',
];

// ---------- a tiny schema language ----------
function S_str(int $min = 0, ?int $max = null): array { return ['str', $min, $max]; }
function S_obj(array $f): array { return ['obj', $f]; }
function S_arr(array $n): array { return ['arr', $n]; }
function S_re(string $re, string $msg): array { return ['re', $re, $msg]; }

function check(array $n, $v, string $path, array &$errs): void {
    $join = function ($k) use ($path) { return $path === '' ? (string)$k : "$path.$k"; };
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
        case 'enum':
            if (!in_array($v, $n[1], true)) $errs[] = [$path, 'Must be one of: ' . implode(', ', $n[1])];
            return;
        case 'num':
            if (!is_int($v) && !is_float($v)) { $errs[] = [$path, 'Expected a number']; return; }
            if ($v < $n[1] || $v > $n[2]) $errs[] = [$path, "Must be between {$n[1]} and {$n[2]}"];
            return;
        case 'numstr': // the game files keep these as strings ("2.5"), zod coerces them
            if ((!is_string($v) && !is_int($v) && !is_float($v)) || !is_numeric($v)) $errs[] = [$path, 'Expected a number'];
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
            foreach ($v as $i => $item) check($n[1], $item, $join($i), $errs);
            return;
        case 'map': // {anyKey: number}, with some keys required
            if (!is_array($v) || ($v && array_keys($v) === range(0, count($v) - 1))) { $errs[] = [$path, 'Expected an object']; return; }
            foreach ($n[2] as $k) if (!array_key_exists($k, $v)) $errs[] = [$join($k), 'Required'];
            foreach ($v as $k => $item) {
                check($n[1], $item, $join($k), $errs);
                if ($k === 'monthly' && (is_int($item) || is_float($item)) && $item <= 0) $errs[] = [$join($k), 'Must be more than 0'];
            }
            return;
        case 'obj':
            if (!is_array($v) || ($v && array_keys($v) === range(0, count($v) - 1))) { $errs[] = [$path, 'Expected an object']; return; }
            foreach ($v as $k => $_) if (!isset($n[1][$k])) $errs[] = [$join($k), 'Unrecognized field'];
            foreach ($n[1] as $k => [$sub, $required]) {
                if (!array_key_exists($k, $v)) { if ($required) $errs[] = [$join($k), 'Required']; continue; }
                check($sub, $v[$k], $join($k), $errs);
            }
            return;
    }
}

// ---------- formats ----------

// 2-space json like node writes it, or the first save rewrites every line of the file
function pretty($data): string {
    $j = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $j = preg_replace_callback('/^( {4})+/m', function ($m) { return str_repeat('  ', intdiv(strlen($m[0]), 4)); }, $j);
    return $j . "\n";
}

// legal pages: three front matter lines then markdown. the admin sees {title,
// description, lastUpdated, body}. values are written plain unless that would
// confuse yaml, same as the files look today
function md_decode(string $raw): ?array {
    if (!preg_match('/\A---\n(.*?)\n---\n\n?(.*)\z/s', $raw, $m)) return null;
    $d = [];
    foreach (explode("\n", $m[1]) as $line) {
        if (!preg_match('/^(\w+):\s*(.*)$/', $line, $kv)) continue;
        $v = $kv[2];
        if (strlen($v) >= 2 && $v[0] === '"' && substr($v, -1) === '"') $v = (string)json_decode($v);
        $d[$kv[1]] = $v;
    }
    $d['body'] = $m[2];
    return $d;
}
function md_encode(array $d): string {
    $q = function ($v) {
        $plain = $v !== '' && !preg_match('/^[\s\'"\[\]{}>|*&!%@`#,-]|:\s|\s#|:$|\s$/u', $v);
        return $plain ? $v : json_encode($v, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    };
    return "---\ntitle: " . $q($d['title']) . "\ndescription: " . $q($d['description']) . "\nlastUpdated: " . $q($d['lastUpdated']) . "\n---\n\n" . $d['body'];
}

function ds_decode(array $ds, string $raw) {
    return ($ds['format'] ?? 'json') === 'md' ? md_decode($raw) : json_decode($raw, true);
}
function ds_encode(array $ds, $data): string {
    return ($ds['format'] ?? 'json') === 'md' ? md_encode($data) : pretty($data);
}

// repo path of one dataset (or one item of a folder-of-files dataset), or null if the item name is junk
function ds_path(array $ds, string $item): ?string {
    if (isset($ds['file'])) return $ds['file'];
    if (!preg_match('/^[a-z0-9][a-z0-9-]*$/', $item)) return null;
    return $ds['dir'] . '/' . $item . '.' . $ds['ext'];
}

// ---------- the datasets ----------

function datasets(): array {
    $url = ['url'];
    $label = S_str(1);
    $href = S_re('/^(\/|https?:\/\/|mailto:|@[a-z]+$)/', 'Use a path like /games/, a full https:// link, or @name of a link in Site');
    $navItem = S_obj(['label' => [$label, true], 'href' => [$href, true]]);

    return [
        'locations' => [
            'file' => 'src/data/locations.json',
            'schema' => S_arr(S_obj([
                'city' => [$label, true], 'region' => [$label, true],
                'lat' => [['num', -90, 90], true], 'lng' => [['num', -180, 180], true],
                'slug' => [S_re('/^[a-z0-9-]+$/', 'Lowercase letters, numbers and dashes only'), false],
                'serves' => [S_str(), false], 'pingUrl' => [$url, false],
                'vms' => [S_arr(S_obj(['name' => [$label, true], 'ip' => [['blank'], true]])), false],
                'soldOut' => [['bool'], false], 'whmcsId' => [['int', 1, PHP_INT_MAX], false],
            ])),
            'post' => function ($data, &$errs) {
                $seen = [];
                foreach ($data as $i => $r) {
                    if (!isset($r['whmcsId'])) continue;
                    if (isset($seen[$r['whmcsId']])) $errs[] = ["$i.whmcsId", "whmcsId {$r['whmcsId']} is on two regions"];
                    $seen[$r['whmcsId']] = true;
                }
            },
        ],
        'partners' => [
            'file' => 'src/data/partners.json', 'assetDirs' => ['partners'],
            'schema' => S_arr(S_obj([
                'name' => [$label, true], 'mark' => [S_str(1, 4), true], 'logo' => [S_str(1), false],
                'founder' => [$label, true], 'description' => [$label, true],
                'services' => [S_arr($label), true], 'note' => [S_str(), false],
                'offer' => [S_obj(['code' => [$label, true], 'text' => [$label, true]]), false],
                'url' => [$url, false], 'gallery' => [$url, false], 'discord' => [$url, true],
            ])),
            'refs' => function ($data) {
                $r = [];
                foreach ($data as $i => $p) if (isset($p['logo'])) $r[] = ["$i.logo", 'partners', $p['logo']];
                return $r;
            },
        ],
        'staff' => [
            'file' => 'src/data/staff.json', 'assetDirs' => ['staff'],
            'schema' => S_arr(S_obj([
                'name' => [$label, true], 'mark' => [S_str(1, 4), true], 'title' => [$label, true],
                'bio' => [$label, true], 'image' => [S_str(1), false],
                'links' => [S_arr(S_obj(['label' => [$label, true], 'href' => [$url, true]])), true],
            ])),
            'refs' => function ($data) {
                $r = [];
                foreach ($data as $i => $p) if (isset($p['image'])) $r[] = ["$i.image", 'staff', $p['image']];
                return $r;
            },
        ],
        'settings' => [
            'file' => 'src/data/settings.json',
            'schema' => S_obj([
                'promo' => [S_obj(['code' => [$label, true], 'percent' => [['int', 1, 100], true], 'live' => [['bool'], true]]), true],
                'trust' => [S_obj([
                    'score' => [['nullable', ['num', 0, 5]], true], 'reviews' => [['nullable', ['int', 0, PHP_INT_MAX]], true],
                    'updated' => [S_re('/^\d{4}-\d{2}-\d{2}$/', 'Use YYYY-MM-DD'), true], 'url' => [$url, true],
                ]), true],
            ]),
        ],
        'site' => [
            'file' => 'src/data/site.json',
            'schema' => S_obj([
                'site' => [S_obj(['name' => [$label, true], 'legalName' => [$label, true], 'domain' => [$label, true], 'description' => [$label, true], 'tagline' => [$label, true]]), true],
                'links' => [S_obj([
                    'billing' => [$url, true], 'ticket' => [$url, true], 'email' => [$label, true], 'panel' => [$url, true], 'docs' => [$url, true],
                    'careers' => [$url, true], 'discord' => [$url, true], 'x' => [$url, true], 'instagram' => [$url, true], 'tiktok' => [$url, true], 'github' => [$url, true],
                ]), true],
                'botHosting' => [S_obj(['monthly' => [['num', 0.01, 1000000], true], 'pid' => [['int', 1, PHP_INT_MAX], true], 'runtimes' => [S_arr($label), true]]), true],
                'demoPanel' => [S_obj(['url' => [['nullable', $url], true], 'user' => [S_str(), true], 'password' => [S_str(), true]]), true],
            ]),
        ],
        'navigation' => [
            'file' => 'src/data/navigation.json',
            'schema' => S_obj([
                'nav' => [S_arr($navItem), true],
                'moreNav' => [S_arr(S_obj(['label' => [$label, true], 'href' => [$href, true], 'note' => [$label, true]])), true],
                'footerNav' => [S_arr(S_obj(['heading' => [$label, true], 'items' => [S_arr($navItem), true]])), true],
                'social' => [S_arr($navItem), true],
            ]),
            // "@discord" has to name a real link or the build throws
            'post' => function ($data, &$errs) {
                $site = gh_read(cfg()['edit_branch'] ?? 'dev', 'src/data/site.json');
                $links = $site ? (json_decode($site['content'], true)['links'] ?? []) : [];
                $walk = function ($rows, $path) use (&$walk, $links, &$errs) {
                    foreach ($rows as $i => $r) {
                        if (isset($r['href']) && is_string($r['href']) && $r['href'][0] === '@' && !isset($links[substr($r['href'], 1)])) $errs[] = ["$path.$i.href", substr($r['href'], 1) . ' is not a link in Site'];
                        if (isset($r['items'])) $walk($r['items'], "$path.$i.items");
                    }
                };
                foreach (['nav', 'moreNav', 'footerNav', 'social'] as $k) $walk($data[$k], $k);
            },
        ],
        'faq' => [
            'file' => 'src/data/faq.json',
            'schema' => S_arr(S_obj(['q' => [$label, true], 'a' => [$label, true], 'aOff' => [$label, false]])),
        ],
        'games' => [
            'dir' => 'src/content/games', 'ext' => 'json', 'create' => true, 'delete' => true, 'assetDirs' => ['games', 'logos'],
            'schema' => S_obj([
                'slug' => [S_re('/^[a-z0-9][a-z0-9-]*$/', 'Lowercase letters, numbers and dashes'), true],
                'label' => [$label, true], 'shortLabel' => [$label, true],
                'status' => [['enum', ['live', 'beta', 'planned']], true],
                'tagline' => [$label, true], 'description' => [$label, true],
                'logo' => [S_re('#^\.\./\.\./assets/logos/[^/]+$#', 'Pick a file from the list'), true],
                'image' => [S_re('#^\.\./\.\./assets/games/[^/]+$#', 'Pick a file from the list'), true],
                'accent' => [S_re('/^#[0-9a-fA-F]{6}$/', 'Six-digit hex like #60a5fa'), true],
                'mark' => [S_str(2, 4), true],
                'locations' => [['bool'], false],
                'highlights' => [S_arr($label), false],
                'plans' => [S_arr(S_obj([
                    'key' => [$label, true], 'name' => [$label, true],
                    'pid' => [['int', 1, PHP_INT_MAX], true], 'popular' => [['bool'], false],
                    'specs' => [S_obj([
                        'vcores' => [$label, true], 'ramGb' => [['numstr'], true], 'storageGb' => [['numstr'], true],
                        'slots' => [$label, true], 'databases' => [['numstr'], true], 'backups' => [['numstr'], true],
                    ]), true],
                    'pricing' => [['map', ['num', 0, 1000000], ['monthly']], true],
                ])), false],
            ]),
            'post' => function ($g, &$errs) {
                // same rule as content.config.ts: live with no plans fails the build
                if (($g['status'] ?? '') === 'live' && empty($g['plans'])) $errs[] = ['plans', 'A live game needs at least one plan. Add one or set status to planned.'];
            },
            'item' => function ($g, $item, &$errs) { if (($g['slug'] ?? null) !== $item) $errs[] = ['slug', 'Has to match the file name']; },
            'refs' => function ($g) {
                $r = [];
                foreach (['image' => 'games', 'logo' => 'logos'] as $k => $dir) {
                    if (isset($g[$k]) && is_string($g[$k]) && preg_match('#^\.\./\.\./assets/[a-z]+/([^/]+)$#', $g[$k], $m)) $r[] = [$k, $dir, $m[1]];
                }
                return $r;
            },
        ],
        'legal' => [
            'dir' => 'src/content/legal', 'ext' => 'md', 'format' => 'md',
            'schema' => S_obj(['title' => [$label, true], 'description' => [$label, true], 'lastUpdated' => [$label, true], 'body' => [$label, true]]),
        ],
    ];
}

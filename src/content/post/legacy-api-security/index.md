---
title: "Securing a legacy API you can't break or rewrite"
description: 'Auditing an old PHP and CodeIgniter 3 backend behind a mobile app that cannot be forced to update, and fixing it without breaking its API.'
publishDate: '29 May 2026'
coverImage:
  src: './cover.webp'
  alt: 'Diagram: an installed app talks to a frozen API contract with the same keys, types and status codes, and behind it the server gets session login, upload checks, SMTP mail and CodeIgniter 3.1.13.'
tags: ['PHP', 'Security', 'CodeIgniter', 'Incident Response', 'Legacy Code']
---

A client asked me to look at the PHP backend behind their mobile app and make it safe. The catch was the app itself. Copies already installed on people's phones can't be forced to update, so whatever the API returns today, it has to keep returning.

That changes the job. I wasn't securing a system I could reshape. I was securing a contract I wasn't allowed to renegotiate.

> **Key Takeaways**
>
> - When old app versions can't be forced to update, the API's response shape is a frozen contract. Fix what happens behind it, add fields if you must, and never rename or remove any.
> - Start with the fixes no app ever sees: the admin login, file uploads, outgoing mail and the framework itself. They close real holes with no risk to the contract.
> - md5 passwords don't need a mass reset. Check the old hash once, replace it with `password_hash()` on the next successful login, and let `password_needs_rehash()` handle later changes.

## What the backend looked like

Two systems sat side by side. A CodeIgniter 3.1.11 application served the mobile API. Next to it sat an admin panel made of plain PHP scripts that talked to MySQL directly.

Passwords were stored as plain md5. Password reset emails went out through PHP's `mail()`. The database credentials were written into the config files of both systems.

## What I found

Most of the problems came from one habit: the server trusted whoever was on the other end.

- **A login checked in the browser.** The admin panel's login page checked the password with JavaScript. The server-side admin scripts behind it didn't check anything, so the gate only stopped people who used the page as intended.
- **API calls nobody had to authenticate.** Some endpoints that write or delete data didn't check who was calling. One check had been commented out, and another accepted a hardcoded value as a valid token.
- **The app's word on payment.** The server took the app's claim about whether a user had paid instead of checking for itself.
- **SQL built from strings.** The admin scripts glued request input straight into queries.
- **Weak password storage, and a reset that leaked.** Passwords were plain md5. The reset flow generated a new password, stored its md5, emailed the password in plain text, and also returned it in the API response.
- **Uploads taken on trust.** Nothing made sure an uploaded file was really an image before it landed on disk.
- **Secrets in the source.** Database credentials sat in config files inside the code.
- **An old framework.** 3.1.11 dates from September 2019, and later 3.1.x releases include a security fix (more on that below).

None of these needs an exotic fix. The hard part is applying them without breaking an app you can't update.

## Fix the behaviour, keep the shape

An installed app is a parser with fixed expectations. It expects certain keys, certain types and certain status codes, and it can't learn new ones.

So the rule is simple. Keep every key, type and status code the app already reads, and change only what the server does to produce them. When a new check rejects a request, it returns the same error JSON the app already handles from other endpoints.

New features follow the same rule. In the first round I added two content fields to one API response, plus the database columns behind them, and left everything else in that response untouched. Then I checked that older clients still worked with the extra keys.

That check matters more than it sounds. Many JSON decoders skip keys they don't know, but not all of them: Kotlin's kotlinx.serialization throws on an unknown key unless `ignoreUnknownKeys` is turned on, and it's off by default ([Kotlin docs](https://kotlinlang.org/api/kotlinx.serialization/kotlinx-serialization-json/kotlinx.serialization.json/-json-builder/ignore-unknown-keys.html)). Test against a real old build, not against the spec.

## Flaw, fix and why that order

Severity alone doesn't set the order. I weighed how much damage each flaw could do against how likely its fix was to break the installed app.

| Order | Flaw | Fix | Why this slot |
| --- | --- | --- | --- |
| 1 | Admin login checked only in the browser | Server-side session check in one gatekeeper that runs before any admin page | Anyone could reach the admin scripts. The app never touches the admin panel, so the contract can't break. |
| 2 | Uploads not checked | Image formats only, MIME and image-structure checks, random file names, no script execution in the upload folder | A file that runs as code hands over the server. The app only sends images, so it doesn't notice. |
| 3 | SQL built from strings in the admin scripts | Bound parameters through CodeIgniter's Query Builder | Admin-only code, so no contract risk. |
| 4 | Framework 3.1.11 | CodeIgniter 3.1.13, custom application layer kept | Picks up a session security fix and PHP 8 support. The API's output doesn't change. |
| 5 | Reset mail through `mail()` | Authenticated SMTP with a proper HTML email | Reset mail has to reach the inbox before the reset flow can change. |
| 6 | Unauthenticated write and delete calls, hardcoded token | Real token checks that fail with the error JSON the app already handles | First fix the app can feel, so it waits until the server-only work is done. |
| 7 | Reset password returned in the response | A one-time link by email, nothing secret in the response | The key stays if the old app reads it. Only its contents change. |
| 8 | md5 passwords | bcrypt, rehashed on the next login | No forced reset, no change to the login request or response. |
| 9 | Payment status trusted from the app | The server checks its own payment record | The old app keeps sending its flag. The server stops believing it. |
| 10 | Credentials in the source | Moved to the environment, then rotated | Rotate last, once deploys and rollbacks are routine. |

The first round of work covered the admin login, uploads, the framework and mail, plus the new response fields. The rest of the table touches requests the app makes, so each one gets the keep-the-shape treatment.

## The first round

### The admin login moved to the server

The JavaScript check went, and the server took over. One small gatekeeper file is included at the top of every admin script, before any page logic runs, and it stops the request unless there's a logged-in admin in the session.

The pattern looks like this (simplified, not the client's code):

```php
<?php
// Included first by every admin script.
session_set_cookie_params([
    'httponly' => true,
    'secure'   => true,
    'samesite' => 'Lax',
]);
session_start();

if (empty($_SESSION['admin_id'])) {
    redirect_to_login();
    exit;
}
```

After a successful login the session ID is replaced, so an ID planted before login is worthless afterwards:

```php
<?php
if (check_admin_credentials($username, $password)) {
    session_regenerate_id(true);
    $_SESSION['admin_id'] = $admin_id;
}
```

The admin pages look and behave the same as before. The difference is that the server now enforces the gate.

### Uploads became images or nothing

The upload check now asks the file what it is instead of trusting its name. It allows only approved image formats, checks the MIME type and that the file parses as an image, and stores it under a random name so nobody can guess a path or overwrite another file.

```php
<?php
function check_image(string $tmp): ?string
{
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png'];

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);
    if (!isset($allowed[$mime]) || getimagesize($tmp) === false) {
        return null;
    }
    return bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
}
```

I ran this on my machine against a real PNG and against a PHP file renamed to `.png`. The PNG got a random name; the renamed script got `null`. On top of the check, the web server is told not to run scripts from the upload folder at all, so even a file that slips through can't execute.

### CodeIgniter 3.1.11 to 3.1.13

CodeIgniter 3 is in maintenance, but the last releases still matter. The 3.1.12 changelog lists one security fix: "a possible session fixation vulnerability where `session.use_strict_mode` wasn't enforced on PHP 7+". The same release added SameSite cookie options and "a lot of code for PHP 8.0 and 8.1 compatibility". Version 3.1.13 came out the same day, 3 March 2022, to fix a session bug on PHP 5 ([CodeIgniter 3 changelog](https://codeigniter.com/userguide3/changelog.html)).

The upgrade itself is a swap of the framework's `system` folder. The work is in what sits around it: I kept the custom application layer and the front controller's overrides, checked the custom controllers, helpers and paths for conflicts, and confirmed the session configuration still worked on the server's PHP version.

### Mail through SMTP

Password reset emails used PHP's `mail()`, which hands the message to whatever the server has locally and hopes. I replaced it with authenticated SMTP and a structured HTML reset email that fits the app's existing reset workflow.

That's partly about deliverability. It's also groundwork: a safer reset flow sends a link, and a link is only useful if the email reliably arrives.

## Moving md5 passwords to bcrypt

You can't convert an md5 hash into a bcrypt hash, because you don't have the password. You do have it for a moment every time someone logs in. That's when the swap happens.

![Flow diagram: a login request from the app goes down one of two paths. If the stored value is md5, the server checks it with hash_equals against md5 of the password and, on a match, replaces it with password_hash. If the stored value is bcrypt, it checks with password_verify and rehashes when password_needs_rehash says so. Every later login takes the bcrypt path. Both paths end in the same response the app reads today, and a failed match returns the same error as today.](./rehash-on-login.webp)

In CodeIgniter 3 the check fits in one model method:

```php
<?php
public function check_password(object $user, string $password): bool
{
    $stored = $user->password;

    // Old rows: a 32-character md5 hex digest.
    if (strlen($stored) === 32 && ctype_xdigit($stored)) {
        if (!hash_equals($stored, md5($password))) {
            return false;
        }
        $this->save_hash($user->id, password_hash($password, PASSWORD_DEFAULT));
        return true;
    }

    if (!password_verify($password, $stored)) {
        return false;
    }
    if (password_needs_rehash($stored, PASSWORD_DEFAULT)) {
        $this->save_hash($user->id, password_hash($password, PASSWORD_DEFAULT));
    }
    return true;
}

private function save_hash(int $id, string $hash): void
{
    $this->db->where('id', $id)->update('users', ['password' => $hash]);
}
```

The login request and response don't change, so the installed app never knows. I tested the same logic with PHP 8.5 on my machine against a one-row stand-in for the users table: a wrong password, then the right one, then the right one again.

```text
before: 3cb4e732631f47e6eb961f34554b7cde
bool(false)
after wrong: 3cb4e732631f47e6eb961f34554b7cde
bool(true)
after login: $2y$12$... (60 chars)
bool(true)
bool(false)
```

The wrong password left the md5 row alone. The right one replaced it with bcrypt, and the third login went through `password_verify()` with nothing left to rehash.

A few details decide whether this works in production:

- **Widen the column first.** An md5 column is often exactly 32 characters. PHP's manual says `PASSWORD_DEFAULT` "is designed to change over time" and recommends a column that can hold 255 characters ([password_hash](https://www.php.net/manual/en/function.password-hash.php)).
- **Let `password_needs_rehash()` do the upkeep.** PHP 8.4 raised bcrypt's default cost from 10 to 12, which is why my test printed `$2y$12$`. Hashes made on an older PHP get upgraded on their owner's next login with no extra code.
- **Know what's left behind.** Accounts that never log in again keep their md5 hash. OWASP describes a second method for that: use the existing hashes as input to the new algorithm, then replace them with direct hashes at the next login. It also warns that layered hashes can be easier to crack, so treat that as a stopgap ([OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)).
- **Mind the 72-byte limit.** bcrypt only uses the first 72 bytes of a password, so very long passphrases are cut short (same OWASP page).

## The reset response and the payment flag

The same rule covers the last two items. The reset response keeps its shape but stops carrying a password: a one-time link goes out by email instead, and whatever the old app shows from that response becomes a message, not a secret.

The payment check works the same way. The old app keeps sending its claim about whether the user paid, because it can't stop. The server checks its own payment record and quietly ignores the claim.

## What I'd tell the next person

Don't rewrite it. A clean rebuild is the fastest way to break the installed app and lock out the users you were hired to protect.

Do the server-only fixes first, because they're free. Then take the contract-facing ones one at a time, keep every key the app reads, and test each change against a real old build.

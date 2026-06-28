---
title: "Securing a Legacy API You Can't Break or Rewrite"
description: 'A security audit of a legacy PHP and CodeIgniter mobile backend: nine real flaws, a frozen API contract, and how to patch it without locking out old apps.'
publishDate: '29 May 2026'
coverImage:
  src: './cover.webp'
  alt: 'A tilted API window card showing a JSON response with a padlock badge, representing a frozen API contract secured server-side.'
tags: ['PHP', 'Security', 'CodeIgniter', 'Incident Response', 'Legacy Code']
---

I inherited a PHP backend that served a mobile app. The brief sounded simple. Lock it down. The catch was the part nobody says out loud until you are already in it: the old apps in the wild cannot be updated. Whatever the API does today, it has to keep doing forever, bugs included.

That single constraint changes everything. You are not securing a system. You are securing a contract you are not allowed to renegotiate.

> **Key Takeaways**
>
> - When client apps cannot be updated, the API response shape becomes a frozen contract. Security fixes have to preserve every key, type, and status code the old clients expect.
> - The cheapest, most dangerous flaws are usually trust ones: the server believing whatever the client says about payment, auth, or identity.
> - Shadow mode and feature flags let you enforce new checks gradually. You log what a fix _would_ have blocked before you let it block anything for real.

## What I was handed

Two systems wearing one trench coat. A CodeIgniter 3 app exposed the mobile API through a single fat controller. Next to it sat an "admin panel" that was really a pile of plain PHP scripts talking straight to MySQL. Authentication was a non-expiring code stored in the database. Password resets went out through bare `mail()`. Uploads landed directly on the filesystem.

It worked. It also felt like an MVP that sprinted past the prototype stage and never looked back.

## The flaws, worst first

I found nine issues. The pattern underneath most of them is the same: the server trusts the client.

The payment check was the clearest example. The API let the app _tell it_ whether the user had paid. Flip a boolean on the device and you unlock everything for free. The server never verified anything.

Auth was no better. One endpoint accepted the literal string `1234` as a valid token and waved the request through. The admin login only checked the password in client-side JavaScript, so the actual server endpoints sat wide open behind a cosmetic gate. Several route-management endpoints checked for no token at all, which meant anyone could delete data.

Then the one that made me wince. The forgot-password endpoint generated a new plaintext password, stored its MD5 hash, emailed the plaintext to the user, and also returned that plaintext straight back in the JSON response. Trigger a reset for any account and the new password lands in your hands. Account takeover by design.

Rounding out the list: an unauthenticated file upload that happily accepted PHP, database credentials hardcoded in the source, MD5 password hashing, and an admin panel that built SQL by gluing raw strings together.

## Why the frozen contract is the real enemy

Any one of these has a textbook fix. The textbook does not account for thousands of installed apps that will never see an update.

Remove the leaked password field from the reset response and old apps that read that field to show the user their new password will break. Expire tokens and clients that assume tokens live forever get stuck in a logout loop with no idea how to refresh. Tighten upload validation and avatars silently stop saving. Change a 200 to a 201 on success and a legacy parser might treat it as failure.

So the rule wrote itself. Keep every key, every type, every status code. Fix the behavior behind them, never the shape in front of them. When I had to kill the leaked password, I kept the JSON key and filled it with harmless placeholder text so old parsers stayed happy.

## Patching without pulling the pin

The technique that made this survivable was shadow mode.

When I added a real server-side payment check, it did not block anyone at first. It ran, compared its verdict against what the system did today, and logged the difference. Only once the logs showed it matching legitimate users did I let it start enforcing. Same idea for any new validation: watch it be right before you let it be in charge.

Passwords migrated by dual-writing. The login path accepts both old MD5 hashes and new bcrypt ones, and quietly rehashes to bcrypt on a successful MD5 match. No mass reset, no lockout, just a slow drift to the better scheme as people log in.

Every new rule sat behind a feature flag, a plain toggle I could flip back to `false` the instant something started crashing. That turned a scary deploy into a reversible one. No full rollback, no redeploy, just an off switch.

## The order that kept the bleeding stopped

Sequencing mattered as much as the fixes:

1. **Logging first.** I wanted to see who was still sending `1234` before I touched a line of logic.
2. **Lock the open upload.** A public endpoint accepting PHP is an active takeover risk, so extensions and size limits went on immediately.
3. **Fix admin auth.** The mobile apps never touch the admin panel, which made a real PHP session check a safe, backend-only change.
4. **Add an auth compatibility layer.** Unauthenticated endpoints started checking tokens but returned the exact same error JSON the other endpoints already used.
5. **Rate limits** on login and reset to blunt brute force and spam.
6. **Payment verification in shadow mode**, then enforced.
7. **Gradual hash migration** through dual-writes.
8. **Rotate the hardcoded secrets last**, once deploys and rollbacks were boring.

Notice that payment verification, the headline flaw, comes sixth. The open upload could hand someone the whole server in an afternoon. Severity is about blast radius, not how embarrassing the bug reads.

## What I would tell the next person who inherits this

Do not rewrite it. A clean rebuild is exactly how you break the legacy clients and lock out the users you were hired to protect. The API contract is frozen, so treat it like load-bearing concrete. Stop the bleeding, secure the behavior behind the responses, and let shadow mode and feature flags carry the risk while old apps keep talking to you in the only dialect they know.

You cannot fix a system like this by being bold. You fix it by being quiet.

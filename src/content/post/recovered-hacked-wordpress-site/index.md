---
title: 'How I Recovered a Hacked WordPress Site'
description: 'This blog post details how I successfully recovered a hacked WordPress site, restoring it to full functionality'
publishDate: '02 December 2024'
updatedDate: '02 December 2024'
coverImage:
  src: './cover.jpg'
  alt: 'Recovered WordPress Site'
tags: ['WordPress', 'Website Security', 'Website Recovery', 'Project']
homePageIdx: 8
---

## When a client's site gets hacked

Few things rattle a small business like waking up to a hacked website. A client came to me exactly there: their WordPress site was down, some pages were redirecting to shady destinations, and others showed garbled content or errors. Customers couldn't reach the services they needed, and every hour offline was costing the business. Here's how I got it back, and made sure it stayed up.

> **Key Takeaways**
>
> - The site was compromised through malicious code injected into theme and plugin files, a common WordPress attack path.
> - Recovery was methodical: identify, clean, restore from backup, patch, then harden.
> - The follow-up matters most: 2FA, a firewall, rotated passwords, and scheduled backups are what stop it happening again.

## Step 1: Find the root cause

You can't fix what you haven't diagnosed. I ran the site through several security tools to scan for malware, backdoors, and signs of unauthorized access. The culprit turned out to be malicious code injected into a handful of files, including the theme and some plugins. That gave the attackers a foothold to redirect visitors to harmful external sites.

## Step 2: Clean up and restore

With the cause pinned down, I worked through the cleanup in order:

- **Removed malware**: deleted the infected files and scrubbed every trace of the injected code.
- **Restored from backups**: the client had regular backups, which let me roll the site back to a clean, known-good version.
- **Updated WordPress**: brought core up to the latest release so the vulnerabilities in the old version were patched.
- **Checked plugins and themes**: deactivated the vulnerable ones and reinstalled secure, current versions.

## Step 3: Harden against the next attack

Restoring the site is only half the job. Keeping it safe is the other half. I put several measures in place:

- **Rotated every password**: admin, FTP, and database.
- **Added a firewall**: a security plugin with a firewall to block malicious traffic before it reaches the site.
- **Enabled two-factor authentication**: 2FA on all admin logins, so a stolen password isn't enough on its own.
- **Renewed the SSL certificate**: a valid certificate encrypts traffic between the server and the visitor.
- **Scheduled automatic backups**: so if anything ever goes wrong again, recovery is quick.

## Step 4: Test and relaunch

Before going live, I tested the lot: forms, logins, and any e-commerce functionality. Once everything checked out, I relaunched and confirmed with the client that the site was back, and more secure than it had been before the hack.

## The outcome

The site came back to full functionality and ended up safer than it started. The client could get on with running their business without watching over their shoulder. The biggest lesson, as ever, is that website security is mostly prevention: regular updates, strong passwords, and trustworthy plugins head off most of these incidents before they start.

## Wrapping up

Recovering a hacked WordPress site takes technical know-how and a methodical approach so nothing gets missed. By cleaning the site, restoring from backups, and hardening it properly, I handed the client back control of their site and a setup they could trust going forward.

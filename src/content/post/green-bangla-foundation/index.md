---
title: 'A SEO Optimized Website for Green Bangla Foundation'
description: 'This blog post explores how I created and optimized a WordPress website for speed and mobile responsiveness, achieving top scores on Google Lighthouse.'
publishDate: '06 December 2024'
updatedDate: '06 December 2024'
coverImage:
  src: './cover.jpg'
  alt: 'Green Bangla Foundation Website'
tags: ['Web Development', 'WordPress', 'Page Speed Optimization', 'Project']
homePageIdx: 4
---

## A speed-first WordPress build

The Green Bangla Foundation needed a new site fast, on a tight budget, after their old one was hacked. I built it on WordPress using Gutenberg Full Site Editing (FSE) and almost no plugins, then tuned it by hand. The result: 100 for speed, accessibility, and best practices on Google Lighthouse. 83 for SEO.

> **Key Takeaways**
>
> A lean WordPress build with Gutenberg FSE got a perfect Lighthouse score for speed and accessibility. Most of that came from cutting plugins and optimizing images, not bolting on a caching layer. Google indexes mobile first, so that's where I focused.

![Homepage](./homepage.png)

## Why so few plugins?

Every plugin is code the browser has to download, parse, and run. The old site had been hacked. A bloated plugin stack is the kind of attack surface that invites trouble. So I kept the dependency list short. Gutenberg FSE handled layout. CSS handled the rest. Fewer moving parts meant a lighter page, a smaller attack surface, and a site the client could actually manage themselves without help.

## How I hit a perfect speed score

Page speed is one of the few ranking factors Google has confirmed outright. It was the first thing I optimized for. The desktop build came back at a perfect 100.

### Desktop PageSpeed Insights

I measured both versions with Google PageSpeed Insights. Here's the desktop result:

![Page Speed Insight for Desktop](./page-speed-desktop.png)

A score of 100 means the page loads with almost no wasted work. No render-blocking scripts. Properly sized images. Clean markup. For a visitor, it just feels instant.

### Mobile speed is the harder one

Desktop is easy. Mobile is where most sites fall apart, and it's where most of the traffic is. A slow mobile page bleeds visitors before they even see the content.

![Page Speed Insight for Phone](./page-speed-phone.png)

The mobile build held up well. I designed mobile-first and kept the same lean approach, so the experience stays quick whether someone arrives on a phone or a laptop.

## What it shipped with

Google indexes the mobile version of a site first. Get mobile wrong and you've sabotaged your rankings before you've written a word of content. The Green Bangla Foundation site pairs high performance with a content setup the client can run themselves through WordPress and Gutenberg FSE. It shipped on a tight budget and a tight timeline without cutting corners on speed or usability.

![Projects Page](./projects-page.png)

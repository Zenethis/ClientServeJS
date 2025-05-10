
**ClientServeJS** is a lightweight client-side file serving library designed to deliver complete web applications directly from the browser—no backend or hosting server required. It supports service workers, Blob URLs, and offers compatibility with ZIP and CSJ archive formats.

Ideal for distributing single-page apps, Unity WebGL builds, and offline-capable PWAs.

[**Live Demo**](https://client-serve-js.vercel.app/)

---

## Overview

ClientServeJS enables developers to serve static files such as HTML, JS, images, and entire web apps from the browser. It functions either as a standard JavaScript library or as a service worker, dynamically adapting to its environment.

### Key Features

- Service worker-based file delivery  
- Fallback Blob URL support  
- CSJ (ClientServeJS Archive) format support  
- Unity WebGL support  
- Offline mode with IndexedDB  
- PWA integration  
- Encrypted file distribution (optional)

---

## Installation

Include the library in your HTML:

```html
<script src="clientserve.js"></script>

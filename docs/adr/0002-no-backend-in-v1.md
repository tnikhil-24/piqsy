# 0002 — No backend in V1

Date: 2026-10-01 · Status: accepted

## Context

V1 has one user (the owner), loaded unpacked. The audit proposed API + database + Jev. Jev's CORS policy blocks normal web pages but not an extension service worker with host permission.

## Decision

The extension's background service worker calls Jev directly using the owner's key, entered on the options page and stored locally. Captions are cached per browser session; the run log lives in extension storage. No server, no database, no shared cache.

## Why

One fewer moving part; the key and all data stay on the owner's machine; nothing to deploy.

## Revisit when

Anyone else installs the extension. A shipped extension can't contain a Jev key (it can be extracted), so beta needs a server proxy. A shared cache built from client-supplied captions must then defend against poisoning (fake captions) and prompt injection in captions.

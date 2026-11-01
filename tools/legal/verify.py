#!/usr/bin/env python3
"""Offline v1 legal artifact verifier, vendored intact into independent consumers."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re


def sha(data):
    return hashlib.sha256(data).hexdigest()


def verify(root, release=False):
    lock = json.loads((root / 'legal-lock.json').read_text())
    errors = []
    if lock.get('contractVersion') != '1.0.0':
        errors.append('unsupported legal contract')
    if release and (lock['status'] != 'adopted' or not lock['effectiveFrom'] or not lock['approval']):
        errors.append('unadopted legal draft: publication is prohibited')
    if release and (lock.get('registrationRequired') or 'UNREGISTERED' in lock.get('assetIds', [])):
        errors.append('unregistered scaffold cannot launch')
    if release and lock.get('effectiveFrom'):
        try:
            effective = datetime.fromisoformat(lock['effectiveFrom'].replace('Z', '+00:00'))
            if effective.tzinfo is None or effective > datetime.now(timezone.utc):
                errors.append('legal release is not yet effective')
        except ValueError:
            errors.append('invalid legal effective timestamp')
    for item in lock['pages']:
        path = root / item['path']
        if not path.is_file():
            errors.append(f'missing legal route artifact: {item["path"]}')
            continue
        text = path.read_text()
        article = re.search(r'<article id="bmsg-legal-content">(.*?)</article>', text, re.S)
        if not article or sha(article[1].encode()) != lock['documents'][item['kind']]['sha256']:
            errors.append(f'independently edited policy: {item["path"]}')
        if sha(path.read_bytes()) != item['sha256']:
            errors.append(f'generated wrapper drift: {item["path"]}')
        canonical = lock['canonicalBase'] + '/' + item['kind'] + '.html'
        if f'<link rel="canonical" href="{canonical}">' not in text or f'href="{canonical}"' not in text:
            errors.append(f'missing canonical link: {item["path"]}')
        if f'name="bmsg-legal-release" content="{lock["release"]}"' not in text:
            errors.append(f'version mismatch: {item["path"]}')
    if lock.get('folded'):
        config = root / lock.get('redirectConfig', '')
        server = config.read_text() if lock.get('redirectConfig') and config.is_file() else ''
        if not server:
            errors.append('folded consumer: missing redirect config')
        for item in lock['folded']:
            canonical = lock['canonicalBase'] + '/' + item['kind'] + '.html'
            if item['target'] != canonical:
                errors.append(f'folded route must target the canonical page: {item["path"]}')
            if (root / item['path']).exists():
                errors.append(f'folded route still has a local copy: {item["path"]}')
            if f'location = /{item["path"]} {{ return 301 {canonical}; }}' not in server:
                errors.append(f'folded route has no 301 to the canonical page: {item["path"]}')
    elif release and not lock['pages']:
        errors.append('no legal routes: neither local pages nor folded redirects')
    for path in lock.get('linkSurfaces', []):
        text = (root / path).read_text() if (root / path).is_file() else ''
        for kind in ['privacy', 'terms']:
            if not re.search(r'href=["\']' + re.escape(lock['canonicalBase'] + '/' + kind + '.html') + r'["\']', text):
                errors.append(f'missing central {kind} link: {path}')
    # Every discovered active legal HTML page is registered. History is explicitly exempt.
    known = {p['path'] for p in lock['pages']}
    for kind in ['privacy', 'terms']:
        for path in root.rglob(kind + '.html'):
            rel = path.relative_to(root).as_posix()
            if any(part in {'.git', 'node_modules', 'target', 'history', 'policies', 'vendor', 'fixtures'} for part in path.parts):
                continue
            if rel not in known:
                errors.append(f'unregistered policy copy: {rel}')
    return errors


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path.cwd())
    parser.add_argument('--release', action='store_true')
    args = parser.parse_args()
    errors = verify(args.root, args.release)
    print('\n'.join(errors) if errors else 'LEGAL ARTIFACT PASS')
    raise SystemExit(bool(errors))

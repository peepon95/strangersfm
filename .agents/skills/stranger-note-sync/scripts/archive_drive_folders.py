#!/usr/bin/env python3
"""Move already-synced stranger subfolders into the "added into lovable" folder.

Run this after the notes are published, so the Drive root only ever shows
folders that still need work.

Usage:
    python3 archive_drive_folders.py --dry-run
    python3 archive_drive_folders.py                # move everything
    python3 archive_drive_folders.py <id> <id> ...  # move only these folders

Needs LOVABLE_API_KEY and GOOGLE_DRIVE_API_KEY in the environment (they are
already set in the Lovable sandbox).
"""

import os
import sys
import json
import urllib.parse
import urllib.request

ROOT_FOLDER_ID = "1wYoQH8ojQImRNnYd9Bm9aoN4yEi_avgR"
ARCHIVE_NAME = "added into lovable"
GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3"

HEADERS = {
    "Authorization": f"Bearer {os.environ['LOVABLE_API_KEY']}",
    "X-Connection-Api-Key": os.environ["GOOGLE_DRIVE_API_KEY"],
}


def call(method, path, params=None, body=None):
    url = f"{GATEWAY}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    for k, v in HEADERS.items():
        req.add_header(k, v)
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as res:
            text = res.read().decode()
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors="replace")
        raise RuntimeError(f"Drive API {method} {path} failed [{err.code}]: {detail}") from err
    return json.loads(text) if text else {}


def list_folders(parent):
    q = (
        f"'{parent}' in parents and mimeType = 'application/vnd.google-apps.folder' "
        "and trashed = false"
    )
    return call(
        "GET",
        "/files",
        {"q": q, "fields": "files(id,name)", "pageSize": 200, "orderBy": "name"},
    ).get("files", [])


def ensure_archive():
    for f in list_folders(ROOT_FOLDER_ID):
        if f["name"].strip().lower() == ARCHIVE_NAME:
            return f["id"]
    created = call(
        "POST",
        "/files",
        {"fields": "id,name"},
        {
            "name": ARCHIVE_NAME,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [ROOT_FOLDER_ID],
        },
    )
    return created["id"]


def main():
    args = [a for a in sys.argv[1:] if a != "--dry-run"]
    dry = "--dry-run" in sys.argv

    archive_id = ensure_archive()
    folders = [
        f
        for f in list_folders(ROOT_FOLDER_ID)
        if f["id"] != archive_id and f["name"].strip().lower() != ARCHIVE_NAME
    ]
    if args:
        folders = [f for f in folders if f["id"] in args]

    for f in folders:
        if dry:
            print(f"would move {f['name']} ({f['id']})")
            continue
        call(
            "PATCH",
            f"/files/{f['id']}",
            {"addParents": archive_id, "removeParents": ROOT_FOLDER_ID, "fields": "id"},
        )
        print(f"moved {f['name']}")

    print(f"{'dry run, ' if dry else ''}{len(folders)} folder(s), archive {archive_id}")


if __name__ == "__main__":
    main()

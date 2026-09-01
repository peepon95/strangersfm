#!/usr/bin/env python3
"""Fail a Stranger FM release when note assets are missing or unprocessed."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

try:
    from PIL import Image
except ImportError as error:  # pragma: no cover - startup guidance
    raise SystemExit(
        "Pillow is required. Run with: uv run --with pillow python "
        ".agents/skills/stranger-note-sync/scripts/validate_note_assets.py ..."
    ) from error


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate extracted handwriting and quote-only audio before deployment."
    )
    parser.add_argument("--project-root", type=Path, default=Path.cwd())
    parser.add_argument("--numbers", type=int, nargs="+", required=True)
    parser.add_argument(
        "--audio-optional",
        type=int,
        nargs="*",
        default=[],
        help="Notes intentionally collected without a recording",
    )
    parser.add_argument(
        "--max-audio-seconds",
        type=float,
        default=20.0,
        help="Reject clips longer than this review threshold",
    )
    parser.add_argument(
        "--site-url",
        help="Also require the built/deployed handwriting and audio URLs to return 200",
    )
    return parser.parse_args()


def validate_png(path: Path) -> str:
    if not path.exists():
        raise ValueError("missing extracted handwriting PNG")
    with Image.open(path) as image:
        if image.mode not in {"RGBA", "LA"}:
            raise ValueError(f"must contain alpha transparency, found {image.mode}")
        alpha = image.getchannel("A")
        histogram = alpha.histogram()
        total = image.width * image.height
        transparent = histogram[0] / total
        visible = sum(histogram[1:]) / total
        opaque = histogram[255] / total
        if transparent < 0.5 or opaque > 0.5:
            raise ValueError(
                "looks like an opaque rectangular photo "
                f"({transparent:.0%} transparent, {opaque:.0%} opaque)"
            )
        if visible < 0.001:
            raise ValueError("contains almost no visible handwriting")
        if min(image.size) < 80:
            raise ValueError(
                f"crop is unexpectedly small: {image.width}x{image.height}"
            )
        return f"{image.width}x{image.height}, {transparent:.0%} transparent"


def validate_audio(path: Path, maximum: float) -> str:
    if not path.exists():
        raise ValueError("missing cleaned audio clip")
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "stream=codec_type,codec_name:format=duration",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        text=True,
        capture_output=True,
    )
    metadata = json.loads(result.stdout)
    streams = metadata.get("streams", [])
    audio_streams = [
        stream for stream in streams if stream.get("codec_type") == "audio"
    ]
    video_streams = [
        stream for stream in streams if stream.get("codec_type") == "video"
    ]
    if not audio_streams:
        raise ValueError("contains no audio stream")
    if video_streams:
        raise ValueError("still contains a video stream")
    duration = float(metadata.get("format", {}).get("duration") or 0)
    if duration <= 0:
        raise ValueError("has no measurable duration")
    if duration > maximum:
        raise ValueError(
            f"is {duration:.2f}s long; expected a quote-only clip under {maximum:.2f}s"
        )
    return f"{duration:.2f}s {audio_streams[0].get('codec_name', 'audio-only')}"


def require_remote(url: str, expected_type: str) -> None:
    request = urllib.request.Request(
        url, headers={"User-Agent": "StrangerFM-Preflight/1.0"}
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            content_type = response.headers.get_content_type()
            if response.status != 200:
                raise ValueError(f"HTTP {response.status}")
            if not content_type.startswith(expected_type):
                raise ValueError(f"unexpected content type {content_type}")
    except urllib.error.HTTPError as error:
        raise ValueError(f"HTTP {error.code}") from error


def main() -> int:
    args = parse_args()
    root = args.project_root.expanduser().resolve()
    optional = set(args.audio_optional)
    base_url = args.site_url.rstrip("/") if args.site_url else None
    failures: list[str] = []

    for number in args.numbers:
        handwriting = root / "public" / "handwriting" / f"note-{number:03d}.png"
        audio = root / "public" / "audio" / f"note-{number:03d}.m4a"
        try:
            handwriting_summary = validate_png(handwriting)
            if base_url:
                require_remote(
                    f"{base_url}/handwriting/note-{number:03d}.png", "image/"
                )
        except (ValueError, OSError) as error:
            failures.append(f"note {number:03d} handwriting: {error}")
            handwriting_summary = "FAILED"

        if number in optional and not audio.exists():
            audio_summary = "intentionally missing"
        else:
            try:
                audio_summary = validate_audio(audio, args.max_audio_seconds)
                if base_url:
                    require_remote(f"{base_url}/audio/note-{number:03d}.m4a", "audio/")
            except (ValueError, OSError, subprocess.CalledProcessError) as error:
                failures.append(f"note {number:03d} audio: {error}")
                audio_summary = "FAILED"

        print(
            f"note {number:03d}: handwriting [{handwriting_summary}] "
            f"audio [{audio_summary}]"
        )

    if failures:
        print("\nPreflight failed:", file=sys.stderr)
        for failure in failures:
            print(f"- {failure}", file=sys.stderr)
        return 1
    print("\nAll requested note assets passed preflight.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

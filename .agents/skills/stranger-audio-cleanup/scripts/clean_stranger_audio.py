#!/usr/bin/env python3
"""Prepare conservative, reviewable cleanup of Stranger FM quote recordings."""

from __future__ import annotations

import argparse
import difflib
import getpass
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import tempfile
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any

DEFAULT_MODEL = "mlx-community/whisper-large-v3-turbo"
READY_THRESHOLD = 0.48
FILLERS = {
    "ah",
    "ahh",
    "eh",
    "er",
    "erm",
    "hmm",
    "like",
    "mm",
    "mmm",
    "oh",
    "okay",
    "ok",
    "so",
    "uh",
    "uhh",
    "uhm",
    "um",
    "umm",
}
TRAILING_PHRASES = (
    ("thank", "you"),
    ("thanks",),
    ("terima", "kasih"),
    ("okay", "thank", "you"),
    ("ok", "thank", "you"),
)
CLEAN_FILTER = (
    "highpass=f=75,lowpass=f=10500,"
    "afftdn=nr=12:nf=-35:tn=1,"
    "acompressor=threshold=-18dB:ratio=2.5:attack=20:release=250:makeup=3dB,"
    "loudnorm=I=-16:LRA=7:TP=-1.5"
)


@dataclass
class Word:
    text: str
    token: str
    start: float
    end: float
    probability: float


def log(message: str) -> None:
    print(message, flush=True)


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=True, text=True, capture_output=True)


def require_commands(names: list[str]) -> None:
    missing = [name for name in names if shutil.which(name) is None]
    if missing:
        raise SystemExit(f"Missing required command(s): {', '.join(missing)}")


def read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        values[key.strip()] = value
    return values


def env_value(env: dict[str, str], *keys: str) -> str | None:
    for key in keys:
        value = os.environ.get(key) or env.get(key)
        if value:
            return value.rstrip("/")
    return None


def json_request(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    body: Any | None = None,
) -> Any:
    data = None
    request_headers = dict(headers or {})
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/json")
    request = urllib.request.Request(
        url, data=data, headers=request_headers, method=method
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            payload = response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {error.code} from {url}: {detail}") from error
    return json.loads(payload) if payload else None


def download(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(
        url, headers={"User-Agent": "StrangerFM-Audio-Cleanup/1.0"}
    )
    try:
        with (
            urllib.request.urlopen(request, timeout=180) as response,
            destination.open("wb") as output,
        ):
            shutil.copyfileobj(response, output)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Could not download audio ({error.code}): {detail}"
        ) from error


def media_duration(path: Path) -> float:
    result = run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ]
    )
    return float(result.stdout.strip())


def tokenize(text: str) -> list[str]:
    normalized = unicodedata.normalize("NFKC", text).lower().replace("’", "'")
    return [
        token.strip("_'")
        for token in re.findall(r"[^\W_]+(?:'[^\W_]+)?", normalized, re.UNICODE)
    ]


def flatten_words(transcription: dict[str, Any]) -> list[Word]:
    words: list[Word] = []
    for segment in transcription.get("segments", []):
        for item in segment.get("words") or []:
            raw = str(item.get("word", "")).strip()
            tokens = tokenize(raw)
            if not tokens:
                continue
            # Whisper normally emits one token per word. If punctuation splitting yields
            # more, retain a single normalized form so timestamps remain meaningful.
            words.append(
                Word(
                    text=raw,
                    token="".join(tokens),
                    start=float(item.get("start", segment.get("start", 0.0))),
                    end=float(item.get("end", segment.get("end", 0.0))),
                    probability=float(item.get("probability", 0.0) or 0.0),
                )
            )
    return words


def make_analysis_wav(source: Path, destination: Path) -> None:
    run(
        [
            "ffmpeg",
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-i",
            str(source),
            "-af",
            "highpass=f=75,lowpass=f=7000,afftdn=nr=8:nf=-38:tn=1",
            "-ac",
            "1",
            "-ar",
            "16000",
            str(destination),
        ]
    )


def transcribe(source_wav: Path, output_dir: Path, model: str) -> dict[str, Any]:
    output_name = f"{source_wav.stem}-words"
    expected = output_dir / f"{output_name}.json"
    command = [
        "uvx",
        "--from",
        "mlx-whisper",
        "mlx_whisper",
        str(source_wav),
        "--model",
        model,
        "--output-dir",
        str(output_dir),
        "--output-name",
        output_name,
        "--output-format",
        "json",
        "--word-timestamps",
        "True",
    ]
    result = subprocess.run(command, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"Speech recognition failed:\n{result.stderr[-3000:]}")
    if not expected.exists():
        candidates = sorted(output_dir.glob(f"{output_name}*.json"))
        if not candidates:
            raise RuntimeError(
                "Speech recognition completed without producing timestamp JSON"
            )
        expected = candidates[-1]
    return json.loads(expected.read_text(encoding="utf-8"))


def best_quote_window(expected: list[str], words: list[Word]) -> tuple[int, int, float]:
    recognized = [word.token for word in words]
    if not expected or not recognized:
        return 0, max(0, len(words) - 1), 0.0
    target_length = len(expected)
    tolerance = max(4, target_length // 2)
    minimum = max(1, target_length - tolerance)
    maximum = min(len(recognized), target_length + tolerance)
    best = (0, len(recognized) - 1, -1.0)
    for length in range(minimum, maximum + 1):
        for start in range(len(recognized) - length + 1):
            end = start + length
            ratio = difflib.SequenceMatcher(
                None, expected, recognized[start:end], autojunk=False
            ).ratio()
            length_penalty = abs(length - target_length) / max(target_length, 1) * 0.08
            score = ratio - length_penalty
            if score > best[2]:
                best = (start, end - 1, score)
    return best


def tighten_nonquote_boundaries(
    expected: list[str], words: list[Word], first: int, last: int
) -> tuple[int, int]:
    """Drop filler and sign-offs only when the written quote excludes them."""
    while first < last and words[first].token in FILLERS:
        if expected and words[first].token == expected[0]:
            break
        first += 1
    changed = True
    while first < last and changed:
        changed = False
        visible = tuple(word.token for word in words[first : last + 1])
        for phrase in sorted(TRAILING_PHRASES, key=len, reverse=True):
            if len(visible) < len(phrase) or visible[-len(phrase) :] != phrase:
                continue
            if (
                len(expected) >= len(phrase)
                and tuple(expected[-len(phrase) :]) == phrase
            ):
                continue
            last -= len(phrase)
            changed = True
            break
    while first < last and words[last].token in FILLERS:
        if expected and words[last].token == expected[-1]:
            break
        last -= 1
    return first, last


def inserted_filler_ranges(
    expected: list[str], window: list[Word]
) -> list[tuple[float, float]]:
    recognized = [word.token for word in window]
    matcher = difflib.SequenceMatcher(None, expected, recognized, autojunk=False)
    ranges: list[tuple[float, float]] = []
    for operation, _i1, _i2, j1, j2 in matcher.get_opcodes():
        if operation != "insert" or j1 == j2:
            continue
        extras = recognized[j1:j2]
        if extras and all(token in FILLERS for token in extras):
            start = max(window[j1].start - 0.025, 0.0)
            end = window[j2 - 1].end + 0.025
            ranges.append((start, end))
    return ranges


def subtract_ranges(
    start: float, end: float, removals: list[tuple[float, float]]
) -> list[tuple[float, float]]:
    kept: list[tuple[float, float]] = []
    cursor = start
    for remove_start, remove_end in sorted(removals):
        remove_start = max(start, remove_start)
        remove_end = min(end, remove_end)
        if remove_end <= cursor:
            continue
        if remove_start - cursor >= 0.12:
            kept.append((cursor, remove_start))
        cursor = max(cursor, remove_end)
    if end - cursor >= 0.12:
        kept.append((cursor, end))
    return kept or [(start, end)]


def render_cleaned(
    source: Path, destination: Path, kept: list[tuple[float, float]]
) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    base = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(source)]
    if len(kept) == 1:
        start, end = kept[0]
        command = base + [
            "-af",
            f"atrim=start={start:.3f}:end={end:.3f},asetpts=PTS-STARTPTS,{CLEAN_FILTER}",
            "-ac",
            "1",
            "-ar",
            "48000",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            str(destination),
        ]
    else:
        pieces = []
        labels = []
        for index, (start, end) in enumerate(kept):
            label = f"p{index}"
            pieces.append(
                f"[0:a]atrim=start={start:.3f}:end={end:.3f},asetpts=PTS-STARTPTS[{label}]"
            )
            labels.append(f"[{label}]")
        pieces.append(
            f"{''.join(labels)}concat=n={len(kept)}:v=0:a=1,{CLEAN_FILTER}[clean]"
        )
        command = base + [
            "-filter_complex",
            ";".join(pieces),
            "-map",
            "[clean]",
            "-ac",
            "1",
            "-ar",
            "48000",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            str(destination),
        ]
    result = subprocess.run(command, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg cleanup failed:\n{result.stderr[-3000:]}")


def fetch_notes(supabase_url: str, api_key: str) -> list[dict[str, Any]]:
    select = "id,number,audio_url,transcript,clip_start,clip_end,published"
    query = urllib.parse.urlencode(
        {"select": select, "published": "eq.true", "order": "number.asc"}
    )
    rows = json_request(
        f"{supabase_url}/rest/v1/stranger_notes?{query}",
        headers={"apikey": api_key, "Authorization": f"Bearer {api_key}"},
    )
    return list(rows or [])


def audio_extension(url_or_path: str) -> str:
    suffix = Path(urllib.parse.urlparse(url_or_path).path).suffix.lower()
    return (
        suffix
        if suffix in {".m4a", ".mp3", ".wav", ".aac", ".ogg", ".webm", ".mp4"}
        else ".m4a"
    )


def report_html(entries: list[dict[str, Any]], output_dir: Path) -> None:
    cards = []
    for entry in entries:
        number = html.escape(str(entry["number"]))
        status = html.escape(entry["status"])
        expected = html.escape(
            entry.get("transcript") or "No written transcript supplied"
        )
        recognized = html.escape(entry.get("recognized") or "")
        original = html.escape(entry.get("original_relative") or "")
        cleaned = html.escape(entry.get("cleaned_relative") or "")
        confidence = float(entry.get("confidence", 0.0))
        trim = html.escape(entry.get("trim_summary") or "")
        error = html.escape(entry.get("error") or "")
        audio = (
            f'<div><strong>Original</strong><audio controls preload="metadata" src="{original}"></audio></div>'
            f'<div><strong>Cleaned</strong><audio controls preload="metadata" src="{cleaned}"></audio></div>'
            if cleaned
            else ""
        )
        cards.append(f"""
        <article class="card {status}">
          <header><h2>Note {number}</h2><span>{status}</span></header>
          <p class="quote">{expected}</p>
          <p><b>Match confidence:</b> {confidence:.0%} · <b>Edit:</b> {trim}</p>
          <details><summary>Recognized speech</summary><p>{recognized}</p></details>
          {audio}
          {f'<p class="error">{error}</p>' if error else ""}
        </article>""")
    document = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Stranger FM audio cleanup review</title>
<style>
:root{{--ink:#182c45;--paper:#f7f2e8;--blue:#eaf3f7;--line:#c9c2b5}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--blue);color:var(--ink);font:16px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}}
main{{width:min(940px,calc(100% - 32px));margin:48px auto}} h1{{font-family:Georgia,serif;font-weight:500;font-size:clamp(2rem,5vw,4rem);margin-bottom:.25rem}}
.intro{{max-width:760px;margin-bottom:32px}} .card{{background:var(--paper);border:1px solid var(--line);padding:24px;margin:20px 0;box-shadow:8px 10px 0 rgba(24,44,69,.08)}}
.card header{{display:flex;justify-content:space-between;gap:16px;align-items:center;text-transform:uppercase;letter-spacing:.12em}} .card header span{{font-size:.8rem;padding:4px 9px;border:1px solid}}
.card.ready header span{{color:#245b3d}} .card.review header span,.card.error header span{{color:#9a3d2d}} .quote{{font:1.45rem/1.45 Georgia,serif}}
audio{{display:block;width:100%;margin-top:8px}} .card>div{{margin:18px 0}} details p{{color:#526175}} .error{{color:#9a3d2d;white-space:pre-wrap}}
</style></head><body><main><p>STRANGER.FM / PRIVATE CORRESPONDENCE</p><h1>Audio cleanup review</h1>
<p class="intro">Listen to every original and cleaned pair. Confirm that the full written quote remains, non-quote remarks are gone, and the voice still sounds natural. Nothing in this report changes the live website.</p>
{"".join(cards) if cards else "<p>No recordings needed processing.</p>"}
</main></body></html>"""
    (output_dir / "report.html").write_text(document, encoding="utf-8")


def authenticate(supabase_url: str, api_key: str, email: str) -> str:
    password = getpass.getpass(f"Supabase password for {email}: ")
    response = json_request(
        f"{supabase_url}/auth/v1/token?grant_type=password",
        method="POST",
        headers={"apikey": api_key},
        body={"email": email, "password": password},
    )
    token = (response or {}).get("access_token")
    if not token:
        raise RuntimeError("Supabase login did not return an access token")
    return str(token)


def upload_and_update(
    entry: dict[str, Any],
    supabase_url: str,
    api_key: str,
    access_token: str,
) -> str:
    cleaned = Path(entry["cleaned_path"])
    digest = hashlib.sha256(cleaned.read_bytes()).hexdigest()[:12]
    storage_path = f"cleaned/note-{int(entry['number']):03d}-{digest}.m4a"
    upload_url = f"{supabase_url}/storage/v1/object/note-media/{storage_path}"
    request = urllib.request.Request(
        upload_url,
        data=cleaned.read_bytes(),
        method="POST",
        headers={
            "apikey": api_key,
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "audio/mp4",
            "x-upsert": "false",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            response.read()
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Audio upload failed ({error.code}): {detail}") from error

    signed_response = json_request(
        f"{supabase_url}/storage/v1/object/sign/note-media/{storage_path}",
        method="POST",
        headers={"apikey": api_key, "Authorization": f"Bearer {access_token}"},
        body={"expiresIn": 315360000},
    )
    signed = str(
        (signed_response or {}).get("signedURL")
        or (signed_response or {}).get("signedUrl")
        or ""
    )
    if not signed:
        raise RuntimeError(
            "Storage upload succeeded but signing the cleaned audio failed"
        )
    if signed.startswith("/object/"):
        signed = f"{supabase_url}/storage/v1{signed}"
    elif signed.startswith("/"):
        signed = f"{supabase_url}{signed}"

    note_id = urllib.parse.quote(str(entry["id"]), safe="")
    json_request(
        f"{supabase_url}/rest/v1/stranger_notes?id=eq.{note_id}",
        method="PATCH",
        headers={
            "apikey": api_key,
            "Authorization": f"Bearer {access_token}",
            "Prefer": "return=minimal",
        },
        body={"audio_url": signed, "clip_start": None, "clip_end": None},
    )
    return signed


def load_manifest(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"version": 1, "entries": []}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {"version": 1, "entries": []}
    except json.JSONDecodeError:
        return {"version": 1, "entries": []}


def write_manifest(path: Path, manifest: dict[str, Any]) -> None:
    path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def process_one(
    note: dict[str, Any],
    output_dir: Path,
    model: str,
    local_source: Path | None = None,
) -> dict[str, Any]:
    number = int(note.get("number") or 0)
    transcript = str(note.get("transcript") or "").strip()
    source_ref = str(local_source or note.get("audio_url") or "")
    entry: dict[str, Any] = {
        "id": note.get("id"),
        "number": number,
        "transcript": transcript,
        "original_url": note.get("audio_url"),
        "status": "review",
        "confidence": 0.0,
    }
    if not source_ref:
        entry.update(status="error", error="No audio URL is stored for this note.")
        return entry
    suffix = audio_extension(source_ref)
    original = output_dir / "originals" / f"note-{number:03d}{suffix}"
    cleaned = output_dir / "cleaned" / f"note-{number:03d}-cleaned.m4a"
    analysis = output_dir / "analysis" / f"note-{number:03d}.wav"
    analysis.parent.mkdir(parents=True, exist_ok=True)
    try:
        if local_source:
            original.parent.mkdir(parents=True, exist_ok=True)
            if local_source.resolve() != original.resolve():
                shutil.copy2(local_source, original)
        else:
            download(source_ref, original)
        duration = media_duration(original)
        make_analysis_wav(original, analysis)
        with tempfile.TemporaryDirectory(prefix="stranger-whisper-") as temporary:
            recognized_data = transcribe(analysis, Path(temporary), model)
        words = flatten_words(recognized_data)
        recognized_text = str(
            recognized_data.get("text") or " ".join(word.text for word in words)
        ).strip()
        expected = tokenize(transcript)
        if expected and words:
            first, last, raw_score = best_quote_window(expected, words)
            first, last = tighten_nonquote_boundaries(expected, words, first, last)
            window = words[first : last + 1]
            average_probability = sum(word.probability for word in window) / max(
                len(window), 1
            )
            confidence = max(0.0, min(1.0, raw_score * 0.8 + average_probability * 0.2))
            start = max(0.0, window[0].start - 0.12)
            end = min(duration, window[-1].end + 0.18)
            removals = inserted_filler_ranges(expected, window)
            kept = subtract_ranges(start, end, removals)
            status = "ready" if confidence >= READY_THRESHOLD else "review"
        else:
            confidence = 0.0
            start, end = 0.0, duration
            removals = []
            kept = [(start, end)]
            status = "review"
        render_cleaned(original, cleaned, kept)
        original_relative = original.relative_to(output_dir).as_posix()
        cleaned_relative = cleaned.relative_to(output_dir).as_posix()
        removed_duration = sum(end_ - start_ for start_, end_ in removals)
        summary = f"{start:.2f}s–{end:.2f}s"
        if removals:
            summary += (
                f"; removed {len(removals)} filler segment(s), {removed_duration:.2f}s"
            )
        entry.update(
            status=status,
            confidence=confidence,
            recognized=recognized_text,
            trim_start=round(start, 3),
            trim_end=round(end, 3),
            kept_ranges=kept,
            removed_fillers=removals,
            trim_summary=summary,
            original_path=str(original.resolve()),
            cleaned_path=str(cleaned.resolve()),
            original_relative=original_relative,
            cleaned_relative=cleaned_relative,
        )
    except Exception as error:  # noqa: BLE001 - keep the rest of a batch reviewable.
        entry.update(status="error", error=str(error))
    return entry


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Clean Stranger FM quote recordings and produce a listening report."
    )
    parser.add_argument("--project-root", type=Path, default=Path.cwd())
    parser.add_argument(
        "--numbers",
        type=int,
        nargs="+",
        help="Process only these Stranger FM note numbers",
    )
    parser.add_argument(
        "--all", action="store_true", help="Process every published remote note"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate notes already present in the manifest",
    )
    parser.add_argument(
        "--file",
        type=Path,
        help="Process one local audio file instead of Supabase notes",
    )
    parser.add_argument("--transcript", help="Authoritative quote for --file mode")
    parser.add_argument(
        "--number", type=int, default=0, help="Display number for --file mode"
    )
    parser.add_argument(
        "--model", default=os.environ.get("STRANGER_WHISPER_MODEL", DEFAULT_MODEL)
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Output directory (default: PROJECT/.audio-cleanup)",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Upload ready cleaned files and update Supabase",
    )
    parser.add_argument("--email", help="Supabase admin email required by --apply")
    parser.add_argument(
        "--allow-low-confidence",
        action="store_true",
        help="Apply review-status files (explicit approval required)",
    )
    args = parser.parse_args()
    if args.file and args.numbers:
        parser.error("--file and --numbers cannot be combined")
    if args.apply and args.file:
        parser.error("--apply is only supported for Supabase notes")
    if args.apply and not args.email:
        parser.error("--apply requires --email")
    return args


def main() -> int:
    args = parse_args()
    require_commands(["ffmpeg", "ffprobe", "uvx"])
    project_root = args.project_root.expanduser().resolve()
    output_dir = (
        (args.output_dir or project_root / ".audio-cleanup").expanduser().resolve()
    )
    output_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = output_dir / "manifest.json"
    manifest = load_manifest(manifest_path)
    previous_numbers = {
        int(item.get("number", -1))
        for item in manifest.get("entries", [])
        if item.get("status") in {"ready", "review", "applied"}
    }

    env = read_env(project_root / ".env")
    supabase_url = env_value(env, "SUPABASE_URL", "VITE_SUPABASE_URL")
    api_key = env_value(
        env, "SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"
    )
    notes: list[dict[str, Any]]
    local_source: Path | None = None
    if args.file:
        local_source = args.file.expanduser().resolve()
        if not local_source.exists():
            raise SystemExit(f"Audio file does not exist: {local_source}")
        notes = [
            {
                "id": None,
                "number": args.number,
                "audio_url": None,
                "transcript": args.transcript or "",
            }
        ]
    else:
        if not supabase_url or not api_key:
            raise SystemExit(
                "SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required in .env"
            )
        log("Reading published Stranger FM notes from Supabase…")
        notes = fetch_notes(supabase_url, api_key)
        if args.numbers:
            selected = set(args.numbers)
            notes = [
                note for note in notes if int(note.get("number") or -1) in selected
            ]
        elif not args.all and not args.force:
            notes = [
                note
                for note in notes
                if int(note.get("number") or -1) not in previous_numbers
            ]

    if not notes:
        report_html([], output_dir)
        log(f"No recordings needed processing. Report: {output_dir / 'report.html'}")
        return 0

    entries: list[dict[str, Any]] = []
    for index, note in enumerate(notes, start=1):
        number = int(note.get("number") or 0)
        log(f"[{index}/{len(notes)}] Cleaning note {number:03d}…")
        entry = process_one(note, output_dir, args.model, local_source)
        entries.append(entry)
        log(f"    {entry['status']} ({float(entry.get('confidence', 0)):.0%} match)")

    # Replace manifest records for this batch, preserving history for other notes.
    batch_numbers = {int(entry["number"]) for entry in entries}
    retained = [
        item
        for item in manifest.get("entries", [])
        if int(item.get("number", -1)) not in batch_numbers
    ]
    manifest["entries"] = retained + entries
    write_manifest(manifest_path, manifest)
    report_html(entries, output_dir)

    if args.apply:
        assert supabase_url and api_key
        applicable = [entry for entry in entries if entry["status"] == "ready"]
        uncertain = [entry for entry in entries if entry["status"] == "review"]
        if uncertain and not args.allow_low_confidence:
            numbers = ", ".join(str(entry["number"]) for entry in uncertain)
            log(
                f"Skipping low-confidence note(s): {numbers}. Review them; do not override silently."
            )
        elif args.allow_low_confidence:
            applicable.extend(uncertain)
        if applicable:
            log("Authenticating to apply approved recordings…")
            token = authenticate(supabase_url, api_key, args.email)
            for entry in applicable:
                if not entry.get("id") or not entry.get("cleaned_path"):
                    continue
                log(f"Uploading approved note {int(entry['number']):03d}…")
                replacement = upload_and_update(entry, supabase_url, api_key, token)
                entry["replacement_url"] = replacement
                entry["status"] = "applied"
            manifest["entries"] = retained + entries
            write_manifest(manifest_path, manifest)
            report_html(entries, output_dir)

    ready = sum(entry["status"] in {"ready", "applied"} for entry in entries)
    review = sum(entry["status"] == "review" for entry in entries)
    errors = sum(entry["status"] == "error" for entry in entries)
    log(f"Finished: {ready} ready, {review} need review, {errors} errors.")
    log(f"Listening report: {output_dir / 'report.html'}")
    log(
        "No live recordings were changed."
        if not args.apply
        else "Applied entries are recorded in manifest.json."
    )
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())

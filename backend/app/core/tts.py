"""Server-side text-to-speech via espeak-ng.

Used so spoken playback (the Voice page) never depends on the requesting
device having a matching OS/browser voice installed — espeak-ng runs here
and the frontend just plays back a normal audio file. Free, offline, no API
key, same "pinned open-source tool" spirit as the DeepSeek model pin in
config.py.
"""
from __future__ import annotations

import shutil
import subprocess

_VOICE_BY_LANG = {"en": "en-us", "ar": "ar"}
_ESPEAK_BIN = shutil.which("espeak-ng") or shutil.which("espeak")


class TTSError(RuntimeError):
    pass


def synthesize(text: str, lang: str) -> bytes:
    """Return WAV audio bytes for `text` spoken in `lang`."""
    if not _ESPEAK_BIN:
        raise TTSError(
            "espeak-ng is not installed on this server (see backend/nixpacks.toml)."
        )
    voice = _VOICE_BY_LANG.get(lang, "en-us")
    try:
        result = subprocess.run(
            [_ESPEAK_BIN, "-v", voice, "-s", "165", "--stdout"],
            input=text.encode("utf-8"),
            capture_output=True,
            timeout=30,
            check=True,
        )
    except subprocess.CalledProcessError as exc:
        raise TTSError(f"espeak-ng failed: {exc.stderr.decode(errors='replace')}") from exc
    except subprocess.TimeoutExpired as exc:
        raise TTSError("espeak-ng timed out") from exc
    if not result.stdout:
        raise TTSError("espeak-ng produced no audio.")
    return result.stdout

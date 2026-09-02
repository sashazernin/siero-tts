import base64
import io
import json
import re
import sys
import wave
from typing import Literal

import numpy as np
import torch
from silero import silero_tts
from silero_stress import load_accentor

# Windows: force UTF-8 for JSON lines over stdin/stdout from Node.js
if hasattr(sys.stdin, "buffer"):
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", write_through=True)

MODEL_ID = "v5_cis_base_nostress"
DEFAULT_SAMPLE_RATE = 48000
STRESS_LANGUAGE_BY_PREFIX = {
    "ru": "ru",
    "bel": "bel",
    "ukr": "ukr",
}
CYRILLIC_SPEAKER_PREFIXES = frozenset(STRESS_LANGUAGE_BY_PREFIX.keys())
CYRILLIC_TEXT_RE = re.compile(r"[\u0400-\u04FF]")
LANGUAGE_HINTS = {
    "ru": "русском",
    "bel": "белорусском",
    "ukr": "украинском",
}

model = None
device = torch.device("cpu")
accentors: dict[str, object] = {}


def get_stress_language(speaker: str) -> str | None:
    prefix = speaker.split("_", 1)[0]
    return STRESS_LANGUAGE_BY_PREFIX.get(prefix)


def preload_accentors() -> None:
    for lang in STRESS_LANGUAGE_BY_PREFIX.values():
        accentors[lang] = load_accentor(lang=lang)


def add_stress(text: str, speaker: str) -> str:
    if "+" in text:
        return text

    stress_language = get_stress_language(speaker)
    if not stress_language:
        return text

    accentor = accentors.get(stress_language)
    if accentor is None:
        raise RuntimeError(f"Stress accentor for '{stress_language}' is not loaded")

    return accentor(text)


def validate_text(text: str, speaker: str) -> None:
    prefix = speaker.split("_", 1)[0]
    normalized_text = text.replace("+", "")

    if prefix in CYRILLIC_SPEAKER_PREFIXES and not CYRILLIC_TEXT_RE.search(normalized_text):
        language_hint = LANGUAGE_HINTS.get(prefix, prefix)
        raise ValueError(
            f"Голос {speaker} озвучивает только кириллицу. "
            f"Введите текст на {language_hint}."
        )


def tensor_to_wav_bytes(audio_tensor: torch.Tensor, sample_rate: int) -> bytes:
    audio = audio_tensor.detach().cpu().numpy()
    if audio.ndim > 1:
        audio = audio.squeeze()

    audio = np.clip(audio, -1.0, 1.0)
    audio_int16 = (audio * 32767).astype(np.int16)

    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_int16.tobytes())

    return buffer.getvalue()


def load_model() -> list[str]:
    global model

    torch.set_num_threads(4)
    loaded_model, _ = silero_tts(language="ru", speaker=MODEL_ID)
    loaded_model.to(device)
    model = loaded_model
    return sorted(model.speakers)


def synthesize(text: str, speaker: str, sample_rate: Literal[8000, 24000, 48000]) -> bytes:
    if model is None:
        raise RuntimeError("Model is not loaded")

    validate_text(text, speaker)
    prepared_text = add_stress(text, speaker)

    try:
        audio = model.apply_tts(
            text=prepared_text,
            speaker=speaker,
            sample_rate=sample_rate,
            put_accent=False,
            put_yo=False,
            put_stress_homo=False,
            put_yo_homo=False,
        )
    except ValueError as exc:
        if str(exc).strip():
            raise

        raise ValueError(
            "Текст не подходит для выбранного голоса. "
            "Проверьте алфавит и язык текста."
        ) from exc

    return tensor_to_wav_bytes(audio, sample_rate)


def write_message(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main() -> None:
    speakers = load_model()
    preload_accentors()
    write_message({"event": "ready", "model": MODEL_ID, "speakers": speakers})

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        request_id = None
        try:
            payload = json.loads(line)
            request_id = payload.get("id")
            command = payload.get("command")

            if command == "ping":
                write_message({"id": request_id, "ok": True, "ready": model is not None})
                continue

            if command != "synthesize":
                write_message({"id": request_id, "ok": False, "error": "Unknown command"})
                continue

            text = str(payload.get("text", "")).strip()
            speaker = str(payload.get("speaker", ""))
            sample_rate = int(payload.get("sample_rate", DEFAULT_SAMPLE_RATE))

            if not text:
                write_message({"id": request_id, "ok": False, "error": "Text is empty"})
                continue

            wav_bytes = synthesize(text, speaker, sample_rate)
            write_message(
                {
                    "id": request_id,
                    "ok": True,
                    "audio_base64": base64.b64encode(wav_bytes).decode("ascii"),
                }
            )
        except Exception as exc:
            write_message({"id": request_id, "ok": False, "error": str(exc)})


if __name__ == "__main__":
    main()

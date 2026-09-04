import base64
import io
import json
import re
import sys
import wave
from typing import Any, Literal

import numpy as np
import torch
from silero import silero_tts
from silero_stress import load_accentor

# Windows: force UTF-8 for JSON lines over stdin/stdout from Node.js
if hasattr(sys.stdin, "buffer"):
    sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")
if hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", write_through=True)

DEFAULT_SAMPLE_RATE = 48000
MODEL_CONFIG: dict[str, dict[str, str | bool]] = {
    "v5_cis_base_nostress": {"language": "ru", "eager": True},
    "v3_en": {"language": "en", "eager": False},
    "v5_ru": {"language": "ru", "eager": False},
}
STRESS_LANGUAGE_BY_PREFIX = {
    "ru": "ru",
    "bel": "bel",
    "ukr": "ukr",
}
CYRILLIC_SPEAKER_PREFIXES = frozenset(STRESS_LANGUAGE_BY_PREFIX.keys())
CYRILLIC_TEXT_RE = re.compile(r"[\u0400-\u04FF]")
LATIN_TEXT_RE = re.compile(r"[A-Za-z]")
LANGUAGE_HINTS = {
    "ru": "русском",
    "bel": "белорусском",
    "ukr": "украинском",
}

device = torch.device("cpu")
models: dict[str, Any] = {}
accentors: dict[str, object] = {}
speaker_to_model: dict[str, str] = {}


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


def validate_text(text: str, speaker: str, model_id: str) -> None:
    normalized_text = text.replace("+", "")

    if model_id == "v3_en":
        if not LATIN_TEXT_RE.search(normalized_text):
            raise ValueError(
                "Английский голос озвучивает только латиницу. Введите текст на английском."
            )
        return

    if model_id == "v5_ru":
        if not CYRILLIC_TEXT_RE.search(normalized_text):
            raise ValueError(
                "Классический русский голос озвучивает только кириллицу. "
                "Введите текст на русском."
            )
        return

    prefix = speaker.split("_", 1)[0]
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


def load_model(model_id: str) -> Any:
    if model_id in models:
        return models[model_id]

    config = MODEL_CONFIG.get(model_id)
    if config is None:
        raise ValueError(f"Unknown model '{model_id}'")

    language = str(config["language"])
    loaded_model, _ = silero_tts(language=language, speaker=model_id)
    loaded_model.to(device)
    models[model_id] = loaded_model

    for speaker in loaded_model.speakers:
        speaker_to_model[speaker] = model_id

    write_message({"event": "model_loaded", "model": model_id, "speakers": sorted(loaded_model.speakers)})
    return loaded_model


def load_initial_models() -> dict[str, list[str]]:
    loaded: dict[str, list[str]] = {}

    for model_id, config in MODEL_CONFIG.items():
        if not config.get("eager"):
            continue

        model = load_model(model_id)
        loaded[model_id] = sorted(model.speakers)

    return loaded


def resolve_model_id(model_id: str | None, speaker: str) -> str:
    if model_id:
        if model_id not in MODEL_CONFIG:
            raise ValueError(f"Unknown model '{model_id}'")
        return model_id

    known_model = speaker_to_model.get(speaker)
    if known_model:
        return known_model

    raise ValueError(f"Unknown speaker '{speaker}'. Specify model explicitly.")


def synthesize(
    text: str,
    speaker: str,
    sample_rate: Literal[8000, 24000, 48000],
    model_id: str,
) -> bytes:
    model = load_model(model_id)
    if speaker not in model.speakers:
        raise ValueError(f"Speaker '{speaker}' is not available in model '{model_id}'")

    validate_text(text, speaker, model_id)

    if model_id == "v5_cis_base_nostress":
        prepared_text = add_stress(text, speaker)
        audio = model.apply_tts(
            text=prepared_text,
            speaker=speaker,
            sample_rate=sample_rate,
            put_accent=False,
            put_yo=False,
            put_stress_homo=False,
            put_yo_homo=False,
        )
    else:
        audio = model.apply_tts(
            text=text,
            speaker=speaker,
            sample_rate=sample_rate,
        )

    return tensor_to_wav_bytes(audio, sample_rate)


def write_message(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main() -> None:
    torch.set_num_threads(4)
    try:
        write_message({"event": "status", "detail": "Запуск..."})
        loaded_models = load_initial_models()
        preload_accentors()
    except Exception as exc:
        write_message({"event": "failed", "error": str(exc)})
        raise

    write_message({"event": "ready", "models": loaded_models})

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
                write_message({"id": request_id, "ok": True, "ready": bool(models)})
                continue

            if command != "synthesize":
                write_message({"id": request_id, "ok": False, "error": "Unknown command"})
                continue

            text = str(payload.get("text", "")).strip()
            speaker = str(payload.get("speaker", ""))
            model_id = resolve_model_id(payload.get("model"), speaker)
            sample_rate = int(payload.get("sample_rate", DEFAULT_SAMPLE_RATE))

            if not text:
                write_message({"id": request_id, "ok": False, "error": "Text is empty"})
                continue

            wav_bytes = synthesize(text, speaker, sample_rate, model_id)
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

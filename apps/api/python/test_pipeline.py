"""Quick sanity check for Silero TTS pipeline. Run: python test_pipeline.py"""

import json
import subprocess
import sys
import wave
from pathlib import Path

import torch
from silero import silero_tts
from silero_stress import load_accentor

MODEL_ID = "v5_cis_base_nostress"
SPEAKER = "ru_ekaterina"
SAMPLE_RATE = 48000
TEXT = "привет"


def save_wav(path: Path, audio_tensor: torch.Tensor, sample_rate: int) -> None:
    import io
    import numpy as np

    audio = audio_tensor.detach().cpu().numpy().squeeze()
    audio = np.clip(audio, -1.0, 1.0)
    audio_int16 = (audio * 32767).astype(np.int16)

    with wave.open(str(path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_int16.tobytes())


def test_direct() -> None:
    print("=== Direct Python ===")
    accentor = load_accentor(lang="ru")
    stressed = accentor(TEXT)
    print(f"text:     {TEXT!r}")
    print(f"stressed: {stressed!r}")

    model, _ = silero_tts(language="ru", speaker=MODEL_ID)
    model.to(torch.device("cpu"))
    audio = model.apply_tts(
        text=stressed,
        speaker=SPEAKER,
        sample_rate=SAMPLE_RATE,
        put_accent=False,
        put_yo=False,
    )
    out = Path(__file__).parent / "test_direct.wav"
    save_wav(out, audio, SAMPLE_RATE)
    samples = len(audio.squeeze())
    print(f"wav: {out.name}, samples={samples}, dur={samples / SAMPLE_RATE:.3f}s")


def test_worker_ipc() -> None:
    print("\n=== Worker IPC (like Node) ===")
    worker = Path(__file__).parent / "worker.py"
    env = {**dict(**__import__("os").environ), "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"}
    proc = subprocess.Popen(
        [sys.executable, str(worker)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
    )
    ready = json.loads(proc.stdout.readline().decode("utf-8"))
    assert ready.get("event") == "ready", ready

    req = json.dumps(
        {
            "id": "1",
            "command": "synthesize",
            "text": TEXT,
            "speaker": SPEAKER,
            "sample_rate": SAMPLE_RATE,
        },
        ensure_ascii=False,
    ).encode("utf-8")
    proc.stdin.write(req + b"\n")
    proc.stdin.flush()

    resp = json.loads(proc.stdout.readline().decode("utf-8"))
    assert resp.get("ok"), resp.get("error")

    import base64

    data = base64.b64decode(resp["audio_base64"])
    out = Path(__file__).parent / "test_worker.wav"
    out.write_bytes(data)
    samples = (len(data) - 44) // 2
    print(f"wav: {out.name}, bytes={len(data)}, dur={samples / SAMPLE_RATE:.3f}s")

    stderr = proc.stderr.read().decode("utf-8", errors="replace").strip()
    if stderr:
        print(f"stderr: {stderr[:300]}")
    proc.kill()


if __name__ == "__main__":
    test_direct()
    test_worker_ipc()
    print("\nOK — open test_direct.wav and test_worker.wav in VLC")

import json
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError
from tqdm import tqdm

import torch
import open_clip

# --------- PATHS (robust no matter where you run from) ----------
ROOT = Path(__file__).resolve().parent                  # .../backend
IMAGES_DIR = ROOT / "products" / "images"               # flat folder
OUT_DIR    = ROOT / "data"
EMB_PATH   = OUT_DIR / "embeddings.npy"
META_PATH  = OUT_DIR / "meta.json"

# --------- MODEL CHOICE ----------
MODEL_NAME = "ViT-B-32"          # fast & robust for catalog photos
PRETRAINED = "openai"
BATCH_SIZE = 128
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def list_images(folder: Path):
    exts = {e.lower() for e in IMAGE_EXTS}
    return sorted([p.name for p in folder.iterdir() if p.suffix.lower() in exts])


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if not IMAGES_DIR.exists():
        raise SystemExit(
            f"Images folder not found: {IMAGES_DIR}\n"
            f"Create it and place images inside, e.g. {IMAGES_DIR/'000001.jpg'}"
        )

    print(f"Loading CLIP: {MODEL_NAME} ({PRETRAINED}) ...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, _, preprocess = open_clip.create_model_and_transforms(
        MODEL_NAME, pretrained=PRETRAINED, device=device
    )
    model.eval()

    # Collect image filenames
    files = list_images(IMAGES_DIR)
    if not files:
        raise SystemExit(f"No images found in {IMAGES_DIR}")

    # Run a dummy image through to get embedding dim
    with torch.no_grad():
        dummy = preprocess(Image.new("RGB", (224, 224))).unsqueeze(0).to(device)
        d = model.encode_image(dummy).shape[-1]

    # Allocate output array (float32 + L2-normalized)
    N = len(files)
    embeddings = np.zeros((N, d), dtype=np.float32)
    meta = {
        "images_dir": str(IMAGES_DIR).replace("\\", "/"),
        "filenames": [],  # index-aligned with embeddings rows
        "model": {"name": MODEL_NAME, "pretrained": PRETRAINED},
        "embedding_dim": int(d),
        "count": int(N),
    }

    idx = 0
    pbar = tqdm(total=N, desc="Embedding images", ncols=90)

    with torch.no_grad():
        while idx < N:
            batch_files = files[idx: idx + BATCH_SIZE]

            batch_tensors = []
            ok_names = []

            # Load + preprocess
            for name in batch_files:
                path = IMAGES_DIR / name
                try:
                    img = Image.open(path).convert("RGB")
                except (UnidentifiedImageError, FileNotFoundError, OSError):
                    # skip unreadable files
                    continue
                batch_tensors.append(preprocess(img))
                ok_names.append(name)

            if not batch_tensors:
                # All unreadable? move window forward
                idx += BATCH_SIZE
                pbar.update(len(batch_files))
                continue

            batch = torch.stack(batch_tensors, dim=0).to(device)

            # Encode + L2-normalize
            feats = model.encode_image(batch)                  # (B, d)
            feats = feats / feats.norm(dim=-1, keepdim=True)   # cosine-ready

            # Append in order we successfully read
            write_base = len(meta["filenames"])
            embeddings[write_base: write_base + feats.shape[0]] = feats.float().cpu().numpy()
            meta["filenames"].extend(ok_names)

            # Advance
            idx += BATCH_SIZE
            pbar.update(len(batch_files))

    pbar.close()

    # Trim if some files were unreadable
    valid = len(meta["filenames"])
    if valid < N:
        embeddings = embeddings[:valid]
        meta["count"] = valid
        print(f"Skipped {N - valid} unreadable files. Final count = {valid}")

    # Save artifacts
    np.save(EMB_PATH, embeddings)
    META_PATH.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nSaved embeddings: {EMB_PATH}  shape={embeddings.shape}")
    print(f"Saved meta:       {META_PATH}")


if __name__ == "__main__":
    main()

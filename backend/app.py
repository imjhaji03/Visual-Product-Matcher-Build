import os
import json
import io
from typing import List, Optional, Tuple

import numpy as np
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ---- Optional FAISS (installed only if you want ANN search) ----
try:
    import faiss  # type: ignore
    HAS_FAISS = True
except Exception:
    HAS_FAISS = False

# ---- Optional torch/open-clip for query encoding ----
import torch
import open_clip

# ----------------- Paths / Config -----------------
ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ROOT, "data")
IMAGES_DIR = os.path.join(ROOT, "products", "images")
EMB_PATH = os.path.join(DATA_DIR, "embeddings.npy")
META_PATH = os.path.join(DATA_DIR, "meta.json")
FAISS_PATH = os.path.join(DATA_DIR, "index.faiss")
HF_CFG_PATH = os.path.join(ROOT, "huggingface.json")

# ----------------- Globals -----------------
app = FastAPI(title="Visual Product Matcher API", version="1.0.0")

# CORS for Vite dev server (adjust if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve product images statically at /images/*
if os.path.isdir(IMAGES_DIR):
    app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# Lazy-loaded resources
_cfg = None
_device = None
_model = None
_preprocess = None
_embeddings = None  # (N, d) float32, L2-normalized
_meta = None        # dict with 'filenames'
_faiss = None       # optional faiss index


# ----------------- Models/Schemas -----------------
class SearchTextBody(BaseModel):
    query: str
    top_k: Optional[int] = None


class Item(BaseModel):
    filename: str
    url: str
    score: Optional[float] = None  # present in search results


class SearchResponse(BaseModel):
    total: int
    top_k: int
    results: List[Item]


# ----------------- Utils -----------------
def load_config() -> dict:
    global _cfg
    if _cfg is not None:
        return _cfg

    default_cfg = {
        "embedding_backend": "open_clip",
        "model_name": "ViT-B-32",
        "pretrained": "openai",
        "device": "auto",
        "search": {"top_k": 24, "metric": "cosine"},
    }
    if os.path.isfile(HF_CFG_PATH):
        try:
            with open(HF_CFG_PATH, "r", encoding="utf-8") as f:
                file_cfg = json.load(f)
            default_cfg.update(file_cfg)
        except Exception:
            pass
    _cfg = default_cfg
    return _cfg


def device() -> str:
    global _device
    if _device is None:
        cfg = load_config()
        if cfg.get("device") == "cpu":
            _device = "cpu"
        else:
            _device = "cuda" if torch.cuda.is_available() else "cpu"
    return _device


def load_model():
    global _model, _preprocess
    if _model is not None and _preprocess is not None:
        return _model, _preprocess

    cfg = load_config()
    model_name = cfg.get("model_name", "ViT-B-32")
    pretrained = cfg.get("pretrained", "openai")
    dev = device()

    model, _, preprocess = open_clip.create_model_and_transforms(
        model_name, pretrained=pretrained, device=dev
    )
    model.eval()
    _model, _preprocess = model, preprocess
    return _model, _preprocess


def load_embeddings() -> Tuple[np.ndarray, dict]:
    """Loads embeddings.npy (L2-normalized) and meta.json"""
    global __embeddings, _meta
    if _embeddings is not None and _meta is not None:
        return _embeddings, _meta

    if not os.path.isfile(EMB_PATH):
        raise FileNotFoundError(f"Embeddings not found at {EMB_PATH}. Run precompute_embeddings.py first.")

    if not os.path.isfile(META_PATH):
        raise FileNotFoundError(f"Meta not found at {META_PATH}. Expected filenames list for index mapping.")

    emb = np.load(EMB_PATH).astype("float32")
    with open(META_PATH, "r", encoding="utf-8") as f:
        meta = json.load(f)

    # Ensure normalized (safety)
    norms = np.linalg.norm(emb, axis=1, keepdims=True) + 1e-12
    emb = emb / norms

    _embeddings, _meta = emb, meta
    return _embeddings, _meta


def load_faiss():
    """Load FAISS index if available and compatible with embeddings."""
    global _faiss
    if _faiss is not None:
        return _faiss

    if not HAS_FAISS or not os.path.isfile(FAISS_PATH):
        _faiss = None
        return None

    index = faiss.read_index(FAISS_PATH)
    _faiss = index
    return _faiss


def similarity_search(query_vec: np.ndarray, top_k: int) -> Tuple[np.ndarray, np.ndarray]:
    """
    query_vec: (d,)
    returns (indices, scores)
    """
    emb, _ = load_embeddings()
    if HAS_FAISS and load_faiss() is not None:
        # FAISS expects (1, d) float32
        q = query_vec.reshape(1, -1).astype("float32")
        # We use inner-product if embeddings are normalized (cosine)
        scores, ids = _faiss.search(q, top_k)
        return ids[0], scores[0]
    else:
        # NumPy fallback (cosine == dot for normalized vectors)
        sims = emb @ query_vec.astype("float32")  # (N,)
        top_k = min(top_k, sims.shape[0])
        idxs = np.argpartition(-sims, top_k - 1)[:top_k]
        # sort exact top_k by score desc
        idxs = idxs[np.argsort(-sims[idxs])]
        return idxs, sims[idxs]


def encode_text(text: str) -> np.ndarray:
    model, _ = load_model()
    dev = device()
    with torch.no_grad():
        toks = open_clip.tokenize([text]).to(dev)
        feats = model.encode_text(toks)
        feats = feats / feats.norm(dim=-1, keepdim=True)
    return feats[0].float().cpu().numpy()


def encode_image_file(file_bytes: bytes) -> np.ndarray:
    model, preprocess = load_model()
    dev = device()
    img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    with torch.no_grad():
        tensor = preprocess(img).unsqueeze(0).to(dev)
        feats = model.encode_image(tensor)
        feats = feats / feats.norm(dim=-1, keepdim=True)
    return feats[0].float().cpu().numpy()


def image_url_for(filename: str) -> str:
    # Served statically at /images/*
    return f"/images/{filename}"


# ----------------- Routes -----------------
@app.get("/health")
def health():
    cfg = load_config()
    try:
        emb, meta = load_embeddings()
        n, d = emb.shape
        img_root_exists = os.path.isdir(IMAGES_DIR)
        faiss_ok = bool(load_faiss()) if HAS_FAISS else False
        return {
            "ok": True,
            "device": device(),
            "model": {"name": cfg.get("model_name"), "pretrained": cfg.get("pretrained")},
            "embeddings": {"count": int(n), "dim": int(d)},
            "images_dir": IMAGES_DIR,
            "images_dir_exists": img_root_exists,
            "faiss_loaded": faiss_ok,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/items", response_model=List[Item])
def list_items(offset: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200)):
    _, meta = load_embeddings()
    files: List[str] = meta.get("filenames", [])
    end = min(len(files), offset + limit)
    out = []
    for name in files[offset:end]:
        out.append(Item(filename=name, url=image_url_for(name)))
    return out


@app.post("/search-text", response_model=SearchResponse)
def search_text(body: SearchTextBody):
    cfg = load_config()
    default_k = int(cfg.get("search", {}).get("top_k", 24))
    top_k = int(body.top_k or default_k)

    if not body.query or not body.query.strip():
        raise HTTPException(status_code=400, detail="query is required")

    qvec = encode_text(body.query.strip())
    ids, scores = similarity_search(qvec, top_k)

    _, meta = load_embeddings()
    files: List[str] = meta.get("filenames", [])
    results: List[Item] = []
    for idx, sc in zip(ids, scores):
        if 0 <= idx < len(files):
            name = files[int(idx)]
            results.append(Item(filename=name, url=image_url_for(name), score=float(sc)))

    total = len(files)
    return SearchResponse(total=total, top_k=len(results), results=results)


@app.post("/search-image", response_model=SearchResponse)
async def search_image(file: UploadFile = File(...), top_k: Optional[int] = None):
    cfg = load_config()
    default_k = int(cfg.get("search", {}).get("top_k", 24))
    k = int(top_k or default_k)

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty file")

    try:
        qvec = encode_image_file(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid image: {e}")

    ids, scores = similarity_search(qvec, k)

    _, meta = load_embeddings()
    files: List[str] = meta.get("filenames", [])
    results: List[Item] = []
    for idx, sc in zip(ids, scores):
        if 0 <= idx < len(files):
            name = files[int(idx)]
            results.append(Item(filename=name, url=image_url_for(name), score=float(sc)))

    total = len(files)
    return SearchResponse(total=total, top_k=len(results), results=results)

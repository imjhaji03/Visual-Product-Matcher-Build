# Visual Product Matcher (CLIP + YOLO)

A fast, browser-first **visual search** demo that finds similar products from your catalog.  
Front end is a lightweight Vite + Tailwind app; back end uses Python with **OpenCLIP** to generate embeddings and a simple API to search them.

---

## ✨ Features

- **Image similarity** via CLIP embeddings (OpenCLIP `ViT-B-32` by default)
- **(Optional) Object detection** with YOLO before embedding (crop → embed → search)
- **Zero‑backend deploy option** for the UI (static hosting) + local/remote Python API
- Keyboard-friendly UI with drag‑drop uploads, progress states, and result gallery
- Reproducible scripts for **pre-computing catalog embeddings**

---

## 🧱 Tech Stack

- **Frontend:** Vite, Vanilla JS, Tailwind CSS
- **ML:** OpenCLIP (`open_clip`) for embeddings, optional YOLO
- **Backend:** Python 3.10+, minimal API (Flask/FastAPI style)
- **Data:** `.npz`/`.npy` for vectors, JSON for metadata

---

## 📁 Repository Structure

```
Visual-Product-Matcher-Build/
├─ frontend/                 # Vite + Tailwind UI
│  ├─ index.html
│  ├─ src/
│  │  ├─ main.js
│  │  ├─ ui/                 # components, css utilities
│  │  └─ ml/                 # (optional) browser models or helpers
│  └─ tailwind.config.cjs
├─ backend/
│  ├─ app.py                 # Python API (start here)
│  ├─ precompute_embeddings.py
│  ├─ huggingface.json       # (if used) token/config
│  └─ data/
│     ├─ images/             # your product catalog images
│     ├─ embeddings.npz      # CLIP vectors (generated)
│     └─ meta.json           # id → filepath / attributes
└─ README.md                 # you are here
```

> **Note:** Folder names can differ in your clone. If they do, update the paths in `precompute_embeddings.py` and the API.

---

## ✅ Prerequisites

- **Python** 3.10 or newer  
- **Node.js** 18+ and **npm**
- (Optional) **Git LFS** if your dataset is large

---

## 🚀 Quick Start

### 1) Backend (Python)

```powershell
# Windows PowerShell
cd backend
python -m venv venv
.env\Scripts\Activate.ps1
pip install -r requirements.txt
```

If you see a QuickGELU warning from `open_clip`, it’s harmless.

Generate embeddings for your catalog images:

```powershell
# Adjust paths to your images; the script may also work with defaults.
python precompute_embeddings.py ^
  --images-dir ".\data\images" ^
  --out ".\data\embeddings.npz" ^
  --meta ".\data\meta.json"
```

> **If the script has no CLI flags:** open `precompute_embeddings.py` and set the constants at the top (paths to images/outputs).

Run the API server:

```powershell
python app.py
# expected: http://localhost:8000  (change if your app binds differently)
```

If you need CORS from the frontend, enable it in `app.py` (e.g., `flask_cors.CORS(app)` or FastAPI `CORSMiddleware`).

#### Example API Contract (fill if different)

- `GET /health` → `{ "ok": true }`
- `POST /embed` (multipart: `file`) → `{ "vector": [...] }`
- `POST /search` (multipart: `file` or body: `{ "vector": [...] }`, `top_k`) → result list with `id`, `score`, and `preview` URL

> 🔧 **TODO:** Replace with your real endpoints if names differ.

---

### 2) Frontend (Vite + Tailwind)

```powershell
cd ../frontend
npm install
npm run dev
# Vite will print a local URL, typically http://localhost:5173
```

Create a `.env` (or `.env.local`) in **frontend** to point to your API:

```
VITE_API_BASE=http://localhost:8000
```

If Tailwind is not picked up, ensure the config filename is `tailwind.config.cjs` and the `content` globs include your `src/**` files.

---

## 🧪 How It Works (High Level)

1. **Precompute**: Run `precompute_embeddings.py` to embed all catalog images and write `embeddings.npz` + `meta.json`.
2. **Query**: The UI sends an uploaded image to the backend.
3. **Embed**: Backend gets the CLIP vector for the query image.
4. **Search**: Backend performs cosine similarity (or inner product) against the precomputed matrix and returns top‑K items.
5. **Display**: UI renders a responsive grid with product thumbnails and scores/labels.

---

## 🔍 Configuration

- **Model**: Change OpenCLIP model name in `precompute_embeddings.py` (e.g., `ViT-B-32`, `ViT-L-14`) and mirror it in `app.py`.
- **Paths**: Update image + output directories to match your dataset.
- **Top‑K / Thresholds**: Expose as query params or env vars.
- **Hugging Face**: If you rely on HF auth, keep a token in `backend/huggingface.json` or use `HUGGINGFACE_TOKEN` env var.

---

## 🧯 Common Issues

- **Git CRLF warnings**: Safe to ignore. To standardize:
  ```bash
  git config core.autocrlf false
  git add --renormalize .
  ```
- **CORS errors**: Allow the frontend origin in the backend (Flask-CORS / FastAPI CORSMiddleware).
- **Model download slow/fails**: Pre‑download weights or set `HF_HOME`/`TRANSFORMERS_CACHE` to a persistent path.
- **Empty results**: Check that `embeddings.npz` and `meta.json` exist and align (same order/length).

---

## 🧰 Useful Scripts (suggested)

```bash
# backend (PowerShell)
python precompute_embeddings.py --images-dir ".\data\images" --out ".\data\embeddings.npz" --meta ".\data\meta.json"
python app.py

# frontend
npm run dev
npm run build
npm run preview
```

---



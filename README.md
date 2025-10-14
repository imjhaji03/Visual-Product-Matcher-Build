
# 🛍️ Visual Product Matcher (E-Commerce Product Matching)

An AI-powered **Visual + Textual Product Matching System** that identifies visually or semantically *similar products* across an e-commerce catalog.

This project combines **Convolutional Neural Networks (CNNs)** and **text-embedding models** to find duplicate or related listings — similar to how large platforms (e.g., Amazon or Flipkart) detect identical products uploaded by different sellers.

---

## 🚀 Project Overview

Given a dataset of products with images and textual titles/descriptions, the model learns to identify which listings refer to the **same product** by analyzing both:

- 🖼️ **Visual similarity** — extracted via pre-trained CNNs like **ResNet**, **EfficientNet**, or custom CNNs.
- 🧠 **Textual similarity** — computed from product titles using **TF-IDF**, **transformers**, or sentence embeddings.
- ⚙️ **Combined embeddings** — concatenated and passed through a **Final Dense Layer** to predict similarity.

This approach replicates a **real-world “Product Matching Engine”**, which powers visual search, de-duplication, and catalog intelligence in e-commerce systems.

---

## 🧩 Tech Stack

| Component | Technology Used |
|------------|----------------|
| **Language** | Python 3.10+ |
| **Deep Learning** | PyTorch |
| **Image Models** | ResNet, EfficientNet |
| **Text Embeddings** | TF-IDF / Transformers |
| **Libraries** | torch, transformers, pandas, numpy, tqdm, scikit-learn, pillow |
| **Notebook** | Jupyter / VSCode |
| **Hardware** | GPU recommended (CUDA / Colab) |

---

## 📂 Folder Structure

```
Ecommerce-Product-Matching/
│
├── model/
│   ├── EnsembleModel.py
│   ├── FinalLayer.py
│   ├── ShopeeDataset.py
│   └── ShopeeModel.py
│
├── cnn-sivyati.ipynb
├── shopee_training_resnet.py
├── shopee_training_efficientnet.py
├── shopee_inference.py
├── shopee_custom.py
└── README.md
```

---

## ⚙️ Installation & Setup

```bash
git clone https://github.com/your-username/visual-product-matcher.git
cd visual-product-matcher
python -m venv venv
venv\Scripts\activate
pip install torch torchvision torchaudio pandas numpy scikit-learn pillow tqdm transformers matplotlib seaborn
```

---

## 🧠 How It Works

1. **Image Encoder:** CNN extracts deep visual embeddings.
2. **Text Encoder:** TF-IDF / transformer encodes title.
3. **Fusion Layer:** Combines embeddings for prediction.
4. **Cosine Similarity:** Finds similar product pairs.

---

## 🧪 Running the Project

### Jupyter Notebook
Run `cnn-sivyati.ipynb` to train/infer directly.

### Python Script
```bash
python shopee_inference.py
```

---

## 📊 Output

Outputs similarity predictions as `submission.csv` with matched product IDs.

---

## 👨‍💻 Author

**Amit Gunjan Jha**  
B.Tech CSE (Cloud Computing) — VIT Bhopal University  
Use Case: *Unthinkable Solutions Pvt. Ltd. Assessment*

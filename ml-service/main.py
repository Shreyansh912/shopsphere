import io
import os
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ShopSphere Visual Search Microservice",
    description="ResNet-18 feature extraction & cosine similarity matching for product search",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "ShopSphere ML Microservice",
        "endpoints": {
            "search": "POST /search",
            "similar": "GET /similar/{product_id}",
            "health": "GET /health"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "indexed_products": len(CATALOG_IDS) if "CATALOG_IDS" in globals() else 0
    }

# Device setup
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load pre-trained ResNet-18 feature extractor
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
feature_extractor = torch.nn.Sequential(*list(model.children())[:-1])
feature_extractor.eval()
feature_extractor.to(device)

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

# Load precomputed embeddings
index_path = os.path.join(os.path.dirname(__file__), "catalog_embeddings.pt")
if not os.path.exists(index_path):
    index_path = "catalog_embeddings.pt"

if not os.path.exists(index_path):
    print("WARNING: 'catalog_embeddings.pt' not found. Run indexer.py first.")
    CATALOG_IDS = []
    CATALOG_EMBEDDINGS = torch.empty((0, 512))
else:
    index_data = torch.load(index_path, map_location="cpu")
    CATALOG_IDS = index_data["product_ids"]
    CATALOG_EMBEDDINGS = index_data["embeddings"]
    print(f"Loaded {len(CATALOG_IDS)} product embeddings into memory.")

@app.post("/search")
async def visual_search(file: UploadFile = File(...), top_k: int = 6):
    if len(CATALOG_IDS) == 0:
        raise HTTPException(status_code=503, detail="Embeddings index is not loaded.")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        if image.mode != "RGB":
            image = image.convert("RGB")

        tensor = preprocess(image).unsqueeze(0).to(device)
        with torch.no_grad():
            query_emb = feature_extractor(tensor).squeeze()
            query_emb = query_emb / torch.norm(query_emb)

        query_emb = query_emb.cpu()
        similarities = torch.mv(CATALOG_EMBEDDINGS, query_emb)
        top_k_count = min(top_k, len(CATALOG_IDS))
        top_scores, top_indices = torch.topk(similarities, k=top_k_count)

        results = []
        seen = set()
        for idx, score in zip(top_indices.tolist(), top_scores.tolist()):
            pid = CATALOG_IDS[idx]
            if pid not in seen:
                seen.add(pid)
                results.append({
                    "productId": pid,
                    "similarity": round(float(score), 4)
                })

        return {"matches": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/similar/{product_id}")
def get_similar_products(product_id: str, top_k: int = 4):
    if len(CATALOG_IDS) == 0:
        raise HTTPException(status_code=503, detail="Embeddings index is not loaded.")

    try:
        target_idx = CATALOG_IDS.index(product_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Product ID not found in embeddings index.")

    target_emb = CATALOG_EMBEDDINGS[target_idx]
    similarities = torch.mv(CATALOG_EMBEDDINGS, target_emb)

    # Fetch top_k + 1 to account for the product matching itself
    top_scores, top_indices = torch.topk(similarities, k=min(top_k + 1, len(CATALOG_IDS)))

    results = []
    for idx, score in zip(top_indices.tolist(), top_scores.tolist()):
        pid = CATALOG_IDS[idx]
        if pid != product_id:
            results.append({
                "productId": pid,
                "similarity": round(float(score), 4)
            })
        if len(results) == top_k:
            break

    return {"similar": results}
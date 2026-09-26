import os
import io
import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image
import requests
import json
import sqlite3

# Device configuration (GPU if available, else CPU)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Load pre-trained ResNet-18 and strip final classification layer
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
feature_extractor = torch.nn.Sequential(*list(model.children())[:-1])
feature_extractor.eval()
feature_extractor.to(device)

# Standard ImageNet pre-processing
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    ),
])

def extract_features(img: Image.Image) -> torch.Tensor:
    if img.mode != "RGB":
        img = img.convert("RGB")
    tensor = preprocess(img).unsqueeze(0).to(device)
    with torch.no_grad():
        embedding = feature_extractor(tensor).squeeze()
        # L2-normalize for cosine similarity
        embedding = embedding / torch.norm(embedding)
    return embedding.cpu()

def build_index():
    print("Connecting to SQLite database to read product images...")
    # Adjust relative path to point to prisma/dev.db
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "prisma", "dev.db"))
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Query product ID, name, and first image URL
    cursor.execute("""
        SELECT p.id, p.name, pi.url 
        FROM Product p 
        JOIN ProductImage pi ON p.id = pi.productId
    """)
    rows = cursor.fetchall()
    conn.close()

    print(f"Found {len(rows)} product image entries. Generating embeddings...")

    product_ids = []
    embeddings = []

    for pid, name, url in rows:
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                img = Image.open(io.BytesIO(res.content))
                emb = extract_features(img)
                embeddings.append(emb)
                product_ids.append(pid)
                print(f"Indexed: {name[:30]}")
        except Exception as e:
            print(f"Skipping {url}: {e}")

    if not embeddings:
        print("No embeddings created.")
        return

    embeddings_tensor = torch.stack(embeddings)
    torch.save({
        "product_ids": product_ids,
        "embeddings": embeddings_tensor
    }, "catalog_embeddings.pt")

    print(f"Saved {len(product_ids)} vector embeddings to 'catalog_embeddings.pt'!")

if __name__ == "__main__":
    build_index()
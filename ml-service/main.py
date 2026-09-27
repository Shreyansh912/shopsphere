from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="ShopSphere ML & Semantic Search Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory document storage for fast semantic text retrieval
class ProductDoc(BaseModel):
    id: str
    name: str
    description: str
    category: Optional[str] = None

class IndexPayload(BaseModel):
    products: List[ProductDoc]

# Global state for vectors
INDEXED_PRODUCTS: List[ProductDoc] = []
VECTORIZER: Optional[TfidfVectorizer] = None
TFIDF_MATRIX = None

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "ShopSphere ML Microservice",
        "indexed_items": len(INDEXED_PRODUCTS)
    }

@app.post("/index")
def sync_catalog(payload: IndexPayload):
    """Indexes the latest catalog from SQLite so FastAPI can run fast vector matches."""
    global INDEXED_PRODUCTS, VECTORIZER, TFIDF_MATRIX
    if not payload.products:
        return {"message": "Empty catalog received", "count": 0}

    INDEXED_PRODUCTS = payload.products
    corpus = [f"{p.name} {p.description} {p.category or ''}" for p in INDEXED_PRODUCTS]

    VECTORIZER = TfidfVectorizer(stop_words="english")
    TFIDF_MATRIX = VECTORIZER.fit_transform(corpus)

    return {"message": "Catalog indexed successfully", "count": len(INDEXED_PRODUCTS)}

@app.get("/search")
def search_products(q: str = Query(..., min_length=1), limit: int = 12):
    """Semantic vector search against product titles and descriptions."""
    global INDEXED_PRODUCTS, VECTORIZER, TFIDF_MATRIX

    if not INDEXED_PRODUCTS or VECTORIZER is None or TFIDF_MATRIX is None:
        return {"query": q, "product_ids": []}

    query_vec = VECTORIZER.transform([q])
    similarities = cosine_similarity(query_vec, TFIDF_MATRIX).flatten()

    # Get indices of matches with positive similarity, sorted descending
    top_indices = np.argsort(similarities)[::-1]
    matching_ids = [
        INDEXED_PRODUCTS[idx].id
        for idx in top_indices
        if similarities[idx] > 0.05
    ][:limit]

    return {
        "query": q,
        "product_ids": matching_ids,
        "matches_found": len(matching_ids)
    }

@app.get("/recommendations/{product_id}")
def get_recommendations(product_id: str, limit: int = 4):
    """Content-based recommendations for 'Similar Products'."""
    global INDEXED_PRODUCTS, TFIDF_MATRIX

    if not INDEXED_PRODUCTS or TFIDF_MATRIX is None:
        return {"product_id": product_id, "recommendations": []}

    target_idx = next((i for i, p in enumerate(INDEXED_PRODUCTS) if p.id == product_id), None)
    if target_idx is None:
        return {"product_id": product_id, "recommendations": []}

    target_vec = TFIDF_MATRIX[target_idx]
    similarities = cosine_similarity(target_vec, TFIDF_MATRIX).flatten()

    sorted_indices = np.argsort(similarities)[::-1]
    # Exclude the target product itself (index 0)
    recommended_ids = [
        INDEXED_PRODUCTS[idx].id
        for idx in sorted_indices
        if idx != target_idx and similarities[idx] > 0.02
    ][:limit]

    return {
        "product_id": product_id,
        "recommendations": recommended_ids
    }
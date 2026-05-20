# routers/recommend_router.py — Semantic recommendation endpoints (Day 6)
# Uses FAISS vector search for O(log n) item similarity instead of O(n) linear scan.

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from auth_utils import get_current_user, UserProfile
from database import get_db
import embedding_store
from ai_matcher import _text_to_pseudo_embedding, fashion_matcher

router = APIRouter(prefix="/api/recommend", tags=["recommend"])
logger = logging.getLogger("uvicorn.error")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fetch_wardrobe(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM wardrobe_items WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def _fetch_item(user_id: str, item_id: str) -> Dict[str, Any]:
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM wardrobe_items WHERE item_id = ? AND user_id = ?",
            (item_id, user_id)
        ).fetchone()
        if not row:
            raise HTTPException(404, f"Item {item_id} not found")
        return dict(row)
    finally:
        conn.close()


def _items_by_ids(wardrobe: List[Dict], ids: List[str]) -> List[Dict]:
    """Return wardrobe items in the order given by ids, skipping unknowns."""
    lookup = {item.get("item_id"): item for item in wardrobe}
    return [lookup[i] for i in ids if i in lookup]


# ---------------------------------------------------------------------------
# GET /api/recommend/similar/{item_id}
# ---------------------------------------------------------------------------

@router.get("/similar/{item_id}")
async def similar_items(item_id: str, top_k: int = 8, user: UserProfile = Depends(get_current_user)):
    """
    Find the most visually/stylistically similar items in the user's wardrobe
    to the given seed item, using FAISS vector search.

    Falls back to linear cosine scan if no FAISS index exists yet.
    """
    seed = _fetch_item(user.user_id, item_id)
    wardrobe = _fetch_wardrobe(user.user_id)

    # Exclude the seed item itself from results
    other_items = [w for w in wardrobe if w.get("item_id") != item_id]
    if not other_items:
        return {"item_id": item_id, "similar_items": [], "method": "empty_wardrobe"}

    query_emb = _text_to_pseudo_embedding(seed)

    # Try FAISS first
    if embedding_store.index_exists(user.user_id):
        similar_ids = embedding_store.search(user.user_id, query_emb, top_k=top_k + 1)
        # Remove the seed itself from results
        similar_ids = [i for i in similar_ids if i != item_id][:top_k]

        if similar_ids:
            results = _items_by_ids(other_items, similar_ids)
            # Attach match score for the frontend
            for r in results:
                from ai_matcher import compute_similarity_score
                r["match_score"] = compute_similarity_score(seed, r)
            logger.info(
                "FAISS similar search — user=%s seed=%s results=%d",
                user.user_id[:8], item_id[:8], len(results)
            )
            return {"item_id": item_id, "similar_items": results, "method": "faiss"}

    # Fall back to linear scan
    ranked = fashion_matcher.rank_closet_matches(seed, other_items)
    logger.info(
        "Linear similar search (no FAISS index) — user=%s seed=%s", user.user_id[:8], item_id[:8]
    )
    return {"item_id": item_id, "similar_items": ranked[:top_k], "method": "linear_fallback"}


# ---------------------------------------------------------------------------
# POST /api/recommend/outfit
# ---------------------------------------------------------------------------

@router.post("/outfit")
async def recommend_outfit(data: Dict[str, Any], user: UserProfile = Depends(get_current_user)):
    """
    Build a complete semantic outfit recommendation from a seed item_id.

    Body: { "item_id": "<uuid>", "style": "casual", "occasion": "daytime" }

    Uses FAISS to find complementary items, then hands the candidates off to
    AdvancedFashionMatcher.create_complete_outfit() for outfit assembly.
    Falls back to full wardrobe scan if no index.
    """
    item_id = data.get("item_id")
    if not item_id:
        raise HTTPException(400, "item_id is required")

    style = data.get("style", "casual")
    occasion = data.get("occasion", "daytime")

    seed = _fetch_item(user.user_id, item_id)
    wardrobe = _fetch_wardrobe(user.user_id)

    if len(wardrobe) < 2:
        raise HTTPException(400, "Add more items to your wardrobe to get outfit recommendations")

    query_emb = _text_to_pseudo_embedding(seed)
    method = "linear_fallback"
    candidate_pool = wardrobe  # default: full wardrobe

    if embedding_store.index_exists(user.user_id):
        # Grab top-20 semantically similar items as the candidate pool
        similar_ids = embedding_store.search(user.user_id, query_emb, top_k=20)
        candidates = _items_by_ids(wardrobe, similar_ids)
        if candidates:
            # Always include the seed itself
            if not any(c.get("item_id") == item_id for c in candidates):
                candidates.insert(0, seed)
            candidate_pool = candidates
            method = "faiss"
            logger.info(
                "FAISS outfit pool — user=%s seed=%s candidates=%d",
                user.user_id[:8], item_id[:8], len(candidates)
            )

    outfit = fashion_matcher.create_complete_outfit(candidate_pool, style=style, occasion=occasion)
    outfit["seed_item_id"] = item_id
    outfit["method"] = method
    return outfit


# ---------------------------------------------------------------------------
# GET /api/recommend/rebuild-index
# ---------------------------------------------------------------------------

@router.get("/rebuild-index")
async def rebuild_index(user: UserProfile = Depends(get_current_user)):
    """
    Rebuild the FAISS index for the current user from their entire wardrobe.
    Call this after bulk imports or whenever the index is stale.
    """
    wardrobe = _fetch_wardrobe(user.user_id)
    if not wardrobe:
        return {"success": False, "message": "Wardrobe is empty — nothing to index"}

    success = embedding_store.build_index(user.user_id, wardrobe)
    if success:
        logger.info("FAISS index rebuilt — user=%s items=%d", user.user_id[:8], len(wardrobe))
        return {"success": True, "indexed_items": len(wardrobe), "message": "Index rebuilt successfully"}
    else:
        return {
            "success": False,
            "indexed_items": 0,
            "message": "faiss-cpu not available — install it to enable semantic search",
        }

# services/fabric_classifier.py
# Rule-based fabric inference from texture metrics, colour, garment category, and pattern.

class FabricClassifier:
    """
    Enhanced Logic Inference Engine (LIE) for fabric detection.
    Accepts optional pattern_type to refine fabric guesses for printed/textured garments.
    Defaults to "Cotton" for any unmatched case.
    """

    @staticmethod
    def classify(
        variance: float,
        brightness: float,
        color: str,
        category: str,
        pattern_type: str = "solid",
        shoe_subtype: str = "",
    ) -> str:
        _DENIM_COLORS = {
            "Denim", "Light Denim", "Navy", "Blue", "Charcoal", "Ice Blue",
            "Gray", "Black", "Light Blue", "Royal Blue", "Sky Blue",
            "Slate", "Indigo", "Midnight Navy",
        }
        _DENIM_CATS = {"Pants", "Trousers", "Jeans", "Shorts", "Jacket", "Skirt", "Dress", "Jumpsuit", "Top"}
        _EARTH = {"White", "Beige", "Cream", "Olive", "Sage", "Brown", "Tan", "Rust", "Sand", "Khaki"}
        _JEWEL = {"Red", "Burgundy", "Navy", "Black", "Green", "Emerald", "Purple", "Plum", "Bordeaux"}
        _PASTELS = {"Blush", "Lavender", "Mint", "Baby Blue", "Cream", "White", "Soft Peony", "Champagne"}
        _LEATHER_COLORS = {"Brown", "Tan", "Black", "Camel", "Cognac", "Burgundy", "Red", "Olive"}

        # ── Jewellery ──────────────────────────────────────────────────────
        if category in ("Necklace", "Ring", "Earrings", "Watch", "Jewellery"):
            if color in ("Gold", "Yellow", "Orange", "Beige", "Cream", "Champagne"):
                return "Gold"
            if color in ("Silver", "Gray", "White", "Platinum", "Ash", "Steel Blue"):
                return "Silver"
            if category == "Watch" and color in ("Black", "Brown", "Tan", "Cognac"):
                return "Leather Strap"
            return "Metal"

        # ── Shoes — sub-type aware fabric ─────────────────────────────────
        if category == "Shoes":
            st = shoe_subtype.lower()
            # Canvas sneakers / sporty
            if "sneaker" in st:
                if color in ("White", "Cream", "Off-White") and variance > 200:
                    return "Canvas"
                if variance > 400:
                    return "Canvas"
                return "Leather" if color in _LEATHER_COLORS else "Synthetic / Mesh"
            # Boots
            if "boot" in st:
                if color in _LEATHER_COLORS and variance < 350:
                    return "Leather"
                if variance < 200 and color in ("Brown", "Tan", "Camel", "Olive"):
                    return "Suede"
                return "Leather"
            # Heels
            if "heel" in st:
                if variance < 80 and brightness > 150:
                    return "Patent Leather"
                if color in _LEATHER_COLORS:
                    return "Leather"
                if color in ("Nude", "Blush", "Beige", "Cream"):
                    return "Satin"
                return "Leather"
            # Sandals
            if "sandal" in st:
                if color in _LEATHER_COLORS and variance < 300:
                    return "Leather"
                return "Synthetic"
            # Loafers / Oxfords / Flats
            if any(w in st for w in ["loafer", "oxford", "brogue", "derby", "flat", "mary jane"]):
                if color in _LEATHER_COLORS:
                    return "Leather"
                return "Suede" if variance < 150 else "Leather"
            # Slides / Mules / Flip flops
            if any(w in st for w in ["slide", "mule", "flip"]):
                return "Rubber" if color in ("White", "Black", "Gray") else "Synthetic"
            # Generic fallback
            if color in _LEATHER_COLORS and variance < 300:
                return "Leather"
            if variance > 500:
                return "Canvas"
            return "Synthetic / Mesh"

        # ── Bag ───────────────────────────────────────────────────────────
        if category == "Bag":
            if color in _LEATHER_COLORS:
                return "Leather"
            if variance > 400:
                return "Canvas"
            return "Synthetic"

        # ── Accessories ───────────────────────────────────────────────────
        if category == "Accessories":
            if color in _LEATHER_COLORS and variance < 250:
                return "Leather"
            if color in ("Gold", "Silver", "Platinum"):
                return "Metal"
            return "Fabric"

        # ── Denim shortcut (before other clothing) ─────────────────────────
        if category in _DENIM_CATS and color in _DENIM_COLORS:
            if 150 < variance < 800 or color in ("Denim", "Light Denim"):
                return "Denim"

        # ── Knitwear detection (high variance + dark/warm + cool season cats) ─
        if variance > 900 and category in ("Top", "Sweater", "Outerwear", "Jacket", "Dress"):
            return "Knit"

        # ── Velvet detection ──────────────────────────────────────────────
        if variance > 800 and brightness < 110 and color in _JEWEL:
            return "Velvet"

        # ── Printed / floral fabric bump ──────────────────────────────────
        if pattern_type in ("floral", "geometric") and variance > 200:
            if category in ("Dress", "Top", "Skirt", "Blouse"):
                return "Chiffon" if brightness > 160 else "Cotton"

        # ── Per-category rules ────────────────────────────────────────────
        if category in ("Pants", "Trousers", "Jeans", "Shorts"):
            if color in _EARTH and variance > 200:  return "Linen"
            return "Cotton" if variance > 200 else "Polyester"

        if category == "Skirt":
            if variance < 30 and brightness > 120:   return "Satin"
            if 300 < variance < 700:
                return "Linen" if color in _EARTH else "Cotton"
            if variance < 100 and brightness > 150:  return "Silk"
            return "Polyester"

        if category == "Dress":
            if variance < 30 and brightness > 120:   return "Satin"
            if 30 < variance < 100 and brightness > 150:
                return "Chiffon" if color in _PASTELS else "Silk"
            if 100 < variance < 400:
                return "Linen" if color in _EARTH else "Cotton"
            if 400 < variance < 700:
                return "Crepe" if brightness < 100 else "Ponte"
            return "Polyester"

        if category in ("Top", "T-Shirt", "Sweater"):
            if variance < 30 and brightness > 120:   return "Satin"
            if 300 < variance < 700 and color in _EARTH: return "Linen"
            if color in _PASTELS and variance < 200 and brightness > 160: return "Chiffon"
            return "Cotton"

        if category == "Jumpsuit":
            if variance < 30 and brightness > 120:   return "Satin"
            if 30 < variance < 200 and brightness > 150: return "Silk"
            if 200 < variance < 500:
                return "Linen" if color in _EARTH else "Cotton"
            return "Polyester"

        if category in ("Jacket", "Coat", "Outerwear", "Blazer"):
            if color in _LEATHER_COLORS and variance < 250:   return "Leather"
            if color in _LEATHER_COLORS and variance < 400:   return "Suede"
            if variance > 400:                                 return "Cotton"
            return "Polyester"

        return "Cotton"

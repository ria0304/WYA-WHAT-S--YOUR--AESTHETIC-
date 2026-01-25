
# ai_matcher.py - ADVANCED FASHION MATCHING ENGINE
import logging
import random
from typing import Dict, Any, List, Tuple
from collections import defaultdict
import numpy as np

logger = logging.getLogger(__name__)

class AdvancedFashionMatcher:
    """
    Advanced matching engine for complete wardrobe coordination.
    Handles all clothing types, accessories, and shoes.
    """
    
    def __init__(self):
        # Color compatibility rules
        self.color_harmony = {
            'monochromatic': lambda c1, c2: c1 == c2,
            'analogous': lambda c1, c2: abs(self.color_to_hue(c1) - self.color_to_hue(c2)) < 30,
            'complementary': lambda c1, c2: abs(self.color_to_hue(c1) - self.color_to_hue(c2)) in [150, 210],
            'triadic': lambda c1, c2: abs(self.color_to_hue(c1) - self.color_to_hue(c2)) in [120, 240],
            'neutral': lambda c1, c2: c2 in ['Black', 'White', 'Gray', 'Beige', 'Cream', 'Taupe']
        }
        
        # Category compatibility
        self.category_groups = {
            'tops': ['Top', 'T-Shirt', 'Blouse', 'Shirt', 'Sweater', 'Tank', 'Crop Top'],
            'bottoms': ['Bottom', 'Trousers', 'Jeans', 'Skirt', 'Shorts', 'Pants'],
            'outerwear': ['Jacket', 'Blazer', 'Coat', 'Cardigan'],
            'dresses': ['Dress', 'Jumpsuit', 'Romper'],
            'shoes': ['Shoes', 'Boots', 'Sandals', 'Sneakers', 'Heels'],
            'accessories': ['Accessory', 'Jewelry', 'Bag', 'Hat', 'Scarf', 'Belt', 'Necklace', 'Ring', 'Earrings', 'Watch'],
            'formal': ['Suit', 'Blazer', 'Dress Pants', 'Cocktail Dress']
        }
        
        # Fabric compatibility
        self.fabric_seasonality = {
            'summer': ['Linen', 'Cotton', 'Silk', 'Chiffon', 'Jersey'],
            'winter': ['Wool', 'Cashmere', 'Tweed', 'Fleece', 'Velvet'],
            'all_season': ['Denim', 'Polyester', 'Rayon', 'Spandex', 'Leather', 'Metal', 'Gold', 'Silver']
        }
        
        # Style rules
        self.style_rules = {
            'color_blocking': ['Red+Blue', 'Yellow+Purple', 'Green+Orange'],
            'minimalist': ['Monochromatic', 'Neutral+OneColor', 'Black+White'],
            'bohemian': ['Pattern+Mixing', 'Layered+Textures', 'Earthy+Colors'],
            'streetwear': ['Oversized+Fitted', 'Logo+Plain', 'Tech+Fabrics'],
            'business': ['Tailored+Structured', 'Neutral+Palette', 'Classic+Silhouettes']
        }
    
    def color_to_hue(self, color_name: str) -> int:
        """Convert color name to approximate hue value (0-360)."""
        color_hues = {
            'Red': 0, 'Orange': 30, 'Yellow': 60, 'Green': 120,
            'Teal': 180, 'Blue': 240, 'Purple': 270, 'Pink': 300,
            'Brown': 20, 'Beige': 45, 'White': 0, 'Black': 0,
            'Gray': 0, 'Navy': 240, 'Denim': 210, 'Cream': 60,
            'Camel': 30, 'Olive': 80, 'Burgundy': 350, 'Rust': 15,
            'Mint': 150, 'Lavender': 270, 'Sage': 100, 'Taupe': 30,
            'Gold': 45, 'Silver': 0, 'Charcoal': 200, 'Rose': 330
        }
        return color_hues.get(color_name, 0)
    
    def match_items(self, item1: Dict[str, Any], item2: Dict[str, Any]) -> Dict[str, Any]:
        """
        Match two fashion items and provide compatibility score.
        """
        # Extract features
        color1 = item1.get('color', 'Unknown')
        color2 = item2.get('color', 'Unknown')
        cat1 = item1.get('category', 'Unknown')
        cat2 = item2.get('category', 'Unknown')
        fabric1 = item1.get('fabric', 'Unknown')
        fabric2 = item2.get('fabric', 'Unknown')
        
        scores = {
            'color_compatibility': 0,
            'category_compatibility': 0,
            'fabric_compatibility': 0,
            'style_compatibility': 0,
            'overall_score': 0
        }
        
        explanations = []
        
        # 1. COLOR COMPATIBILITY (0-40 points)
        color_score = 0
        
        # Same color (monochromatic)
        if color1 == color2:
            color_score += 30
            explanations.append(f"Monochromatic: Both items are {color1}")
        
        # Neutral pairing
        elif color2 in ['Black', 'White', 'Gray', 'Beige', 'Cream', 'Taupe', 'Denim']:
            color_score += 25
            explanations.append(f"Neutral pairing: {color1} works with neutral {color2}")
        elif color1 in ['Black', 'White', 'Gray', 'Beige', 'Cream', 'Taupe', 'Denim']:
             color_score += 25
             explanations.append(f"Neutral pairing: {color2} works with neutral {color1}")
        
        # Complementary colors
        elif abs(self.color_to_hue(color1) - self.color_to_hue(color2)) in [150, 210]:
            color_score += 35
            explanations.append(f"Complementary colors: {color1} and {color2} create contrast")
        
        # Analogous colors
        elif abs(self.color_to_hue(color1) - self.color_to_hue(color2)) < 30:
            color_score += 20
            explanations.append(f"Analogous colors: {color1} and {color2} are harmonious")
        
        # Classic combinations
        classic_pairs = [
            ('Navy', 'White'), ('Black', 'White'), ('Red', 'Denim'),
            ('Green', 'Brown'), ('Pink', 'Gray'), ('Blue', 'Orange'),
            ('Purple', 'Yellow'), ('Coral', 'Teal'), ('Camel', 'Black'),
            ('Gold', 'Black'), ('Silver', 'Blue'), ('Denim', 'White')
        ]
        
        if (color1, color2) in classic_pairs or (color2, color1) in classic_pairs:
            color_score += 30
            explanations.append(f"Classic combination: {color1} and {color2}")
        
        scores['color_compatibility'] = min(40, color_score)
        
        # 2. CATEGORY COMPATIBILITY (0-30 points)
        category_score = 0
        
        # Top + Bottom combination
        if (cat1 in self.category_groups['tops'] and cat2 in self.category_groups['bottoms']) or \
           (cat2 in self.category_groups['tops'] and cat1 in self.category_groups['bottoms']):
            category_score += 25
            explanations.append("Perfect combination: Top with Bottom")
        
        # Dress + Outerwear
        elif (cat1 in self.category_groups['dresses'] and cat2 in self.category_groups['outerwear']) or \
             (cat2 in self.category_groups['dresses'] and cat1 in self.category_groups['outerwear']):
            category_score += 20
            explanations.append("Layered look: Dress with Outerwear")
        
        # Accessory with clothing
        elif (cat1 in self.category_groups['accessories'] and cat2 not in self.category_groups['accessories']) or \
             (cat2 in self.category_groups['accessories'] and cat1 not in self.category_groups['accessories']):
            category_score += 15
            explanations.append("Accessory complements clothing item")
        
        # Shoes with outfit
        elif (cat1 in self.category_groups['shoes'] and cat2 not in self.category_groups['shoes']) or \
             (cat2 in self.category_groups['shoes'] and cat1 not in self.category_groups['shoes']):
            category_score += 20
            explanations.append("Shoes complete the outfit")
        
        scores['category_compatibility'] = min(30, category_score)
        
        # 3. FABRIC COMPATIBILITY (0-20 points)
        fabric_score = 0
        
        # Same season fabrics
        for season, fabrics in self.fabric_seasonality.items():
            if fabric1 in fabrics and fabric2 in fabrics:
                fabric_score += 15
                explanations.append(f"Seasonally appropriate: Both are {season} fabrics")
                break
        
        # Texture contrast logic
        fabric_score += 5 # Base score for mixing fabrics
        
        scores['fabric_compatibility'] = min(20, fabric_score)
        
        # 4. STYLE COMPATIBILITY (0-10 points)
        style_score = 0
        
        # Check for style alignment
        item1_name = item1.get('name', '').lower()
        item2_name = item2.get('name', '').lower()
        
        style_keywords = {
            'casual': ['casual', 'tee', 'jeans', 'sneakers', 'cotton'],
            'formal': ['formal', 'suit', 'dress', 'blazer', 'silk'],
            'bohemian': ['boho', 'flowy', 'embroidered', 'fringe', 'maxi'],
            'streetwear': ['street', 'hoodie', 'oversized', 'sneaker', 'graphic'],
            'minimalist': ['minimal', 'basic', 'plain', 'simple', 'neutral']
        }
        
        for style, keywords in style_keywords.items():
            count1 = sum(1 for kw in keywords if kw in item1_name)
            count2 = sum(1 for kw in keywords if kw in item2_name)
            if count1 > 0 and count2 > 0:
                style_score += 8
                explanations.append(f"Style match: Both items have {style} elements")
                break
        
        scores['style_compatibility'] = min(10, style_score)
        
        # Calculate overall score
        scores['overall_score'] = sum(scores.values())
        
        # Determine compatibility level
        if scores['overall_score'] >= 80:
            compatibility = "Excellent"
            recommendation = "Perfect match! Wear together confidently."
        elif scores['overall_score'] >= 60:
            compatibility = "Good"
            recommendation = "Works well together. Consider adding accessories."
        elif scores['overall_score'] >= 40:
            compatibility = "Fair"
            recommendation = "Could work with the right styling and accessories."
        else:
            compatibility = "Poor"
            recommendation = "Consider different combinations for better harmony."
        
        return {
            'compatibility_score': scores['overall_score'],
            'compatibility_level': compatibility,
            'category_match': f"{cat1} + {cat2}",
            'color_match': f"{color1} + {color2}",
            'fabric_match': f"{fabric1} + {fabric2}",
            'explanations': explanations,
            'recommendation': recommendation,
            'breakdown': {
                'color': scores['color_compatibility'],
                'category': scores['category_compatibility'],
                'fabric': scores['fabric_compatibility'],
                'style': scores['style_compatibility']
            }
        }
    
    def create_complete_outfit(self, items: List[Dict[str, Any]], 
                              style: str = "casual",
                              occasion: str = "daytime") -> Dict[str, Any]:
        """
        Create a complete outfit from wardrobe items.
        """
        if len(items) < 2:
            return {}
        
        # Categorize items
        categorized = defaultdict(list)
        for item in items:
            cat = item.get('category', 'Unknown')
            for group_name, group_cats in self.category_groups.items():
                if cat in group_cats:
                    categorized[group_name].append(item)
                    break
            else:
                categorized['other'].append(item)
        
        # Style-specific rules
        style_rules = {
            'casual': {
                'required': ['tops', 'bottoms'],
                'optional': ['shoes', 'accessories'],
                'avoid': ['formal']
            },
            'formal': {
                'required': ['formal', 'shoes'],
                'optional': ['accessories'],
                'prefer': ['dresses', 'outerwear']
            },
            'business': {
                'required': ['tops', 'bottoms'],
                'optional': ['outerwear', 'shoes', 'accessories'],
                'avoid': ['casual']
            },
            'evening': {
                'required': ['dresses'] if categorized['dresses'] else ['tops', 'bottoms'],
                'optional': ['shoes', 'accessories', 'outerwear'],
                'prefer': ['formal']
            },
            'streetwear': {
                'required': ['tops', 'bottoms'],
                'optional': ['shoes', 'accessories', 'outerwear'],
                'prefer': ['streetwear_items']
            }
        }
        
        rules = style_rules.get(style, style_rules['casual'])
        
        # Select items based on rules
        selected_items = []
        
        # 1. Select required categories
        for req_cat in rules.get('required', []):
            if categorized.get(req_cat):
                selected_items.append(random.choice(categorized[req_cat]))
        
        # 2. Select optional categories
        for opt_cat in rules.get('optional', []):
            if categorized.get(opt_cat) and random.random() > 0.3:  # 70% chance to include
                selected_items.append(random.choice(categorized[opt_cat]))
        
        # 3. Fallback to basic Top+Bottom if logic failed
        if len(selected_items) < 2:
            if categorized['tops'] and categorized['bottoms']:
                selected_items = [random.choice(categorized['tops']), random.choice(categorized['bottoms'])]
            elif categorized['dresses']:
                selected_items = [random.choice(categorized['dresses'])]
        
        # Create outfit name based on items
        if len(selected_items) >= 2:
            main_items = selected_items[:2]
            color1 = main_items[0].get('color', '')
            color2 = main_items[1].get('color', '')
            
            outfit_names = [
                f"{style.title()} {color1} Combo",
                f"{color1} & {color2} Mix",
                f"{style.title()} Ensemble",
                f"Modern {style.title()}"
            ]
            outfit_name = random.choice(outfit_names)
        else:
            outfit_name = f"{style.title()} Look"
        
        # Calculate overall compatibility
        compatibility_scores = []
        if len(selected_items) >= 2:
            for i in range(len(selected_items)):
                for j in range(i+1, len(selected_items)):
                    match_result = self.match_items(selected_items[i], selected_items[j])
                    compatibility_scores.append(match_result['compatibility_score'])
        
        avg_compatibility = sum(compatibility_scores) / len(compatibility_scores) if compatibility_scores else 85
        
        # Generate styling tips
        styling_tips = self._generate_styling_tips(selected_items, style, occasion)
        
        return {
            'name': outfit_name,
            'vibe': style.capitalize(),
            'item_ids': [item['id'] for item in selected_items],
            'items': selected_items,
            'compatibility_score': avg_compatibility,
            'styling_tips': styling_tips,
        }
    
    def _generate_styling_tips(self, items: List[Dict[str, Any]], 
                              style: str, occasion: str) -> List[str]:
        """Generate specific styling tips for the outfit."""
        tips = []
        # Basic tips
        tips.append("Mix of colors adds visual interest")
        if style == 'casual': tips.append("Tuck in the front for a relaxed look")
        return tips
    
    def analyze_wardrobe_gaps(self, wardrobe: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze wardrobe and identify missing items or gaps.
        """
        category_counts = defaultdict(int)
        color_counts = defaultdict(int)
        style_counts = defaultdict(int)
        
        for item in wardrobe:
            cat = item.get('category', 'Unknown')
            color = item.get('color', 'Unknown')
            category_counts[cat] += 1
            color_counts[color] += 1
            
            # Simple style heuristic
            name = item.get('name', '').lower()
            if 'jeans' in name or 'tee' in name: style_counts['Casual'] += 1
            elif 'suit' in name or 'blazer' in name: style_counts['Formal'] += 1
            else: style_counts['Versatile'] += 1
        
        essential_categories = ['Top', 'Bottom', 'Shoes', 'Jacket']
        missing_essentials = [cat for cat in essential_categories if category_counts.get(cat, 0) == 0]
        
        recommendations = []
        if missing_essentials:
            recommendations.append(f"Missing essentials: {', '.join(missing_essentials)}")
        else:
            recommendations.append("Good foundation of essentials.")
            
        if len(color_counts) < 3:
            recommendations.append("Try adding more color variety.")
        
        dom_style = max(style_counts, key=style_counts.get) if style_counts else "Newcomer"
        
        health_score = min(100, len(wardrobe) * 5 + len(color_counts) * 5)
        
        return {
            'total_items': len(wardrobe),
            'category_distribution': dict(category_counts),
            'missing_essentials': missing_essentials,
            'recommendations': recommendations,
            'wardrobe_health_score': health_score,
            'dominant_style': dom_style,
            'color_preferences': list(color_counts.keys())
        }

# Singleton instance
fashion_matcher = AdvancedFashionMatcher()

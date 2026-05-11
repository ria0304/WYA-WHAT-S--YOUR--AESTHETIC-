# schemas.py
# Pydantic models for request body validation.

from pydantic import BaseModel
from typing import List, Optional


# ====================== AUTH ======================

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    birthday: Optional[str] = None
    gender: Optional[str] = "Female"
    location: Optional[str] = "Global"


class UserLogin(BaseModel):
    email: str
    password: str


# ====================== WARDROBE ======================

class WardrobeItemCreate(BaseModel):
    name: str
    category: str
    color: Optional[str] = ""
    fabric: Optional[str] = ""
    image_url: Optional[str] = None
    tags: Optional[List[str]] = []


class WardrobeItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    fabric: Optional[str] = None
    image_url: Optional[str] = None
    tags: Optional[List[str]] = None


# ====================== OUTFITS ======================

class OutfitItem(BaseModel):
    item_id: str
    name: Optional[str] = ""
    category: Optional[str] = ""
    color: Optional[str] = ""
    image_url: Optional[str] = None

    def dict(self, **kwargs):
        return {
            "item_id": self.item_id,
            "name": self.name,
            "category": self.category,
            "color": self.color,
            "image_url": self.image_url,
        }


class OutfitCreate(BaseModel):
    name: str
    vibe: Optional[str] = ""
    items: List[OutfitItem] = []
    is_daily: Optional[bool] = False
    created_date: Optional[str] = None


# ====================== STYLE DNA ======================

class StyleDNACreate(BaseModel):
    styles: List[str]
    comfort_level: Optional[int] = 5
    summary: Optional[str] = ""


# ====================== NOTIFICATIONS ======================

class NotificationPreferencesUpdate(BaseModel):
    daily_drop_email: bool = False


# ====================== AI REQUESTS ======================

class WeatherRequest(BaseModel):
    city: str


class GreenAuditRequest(BaseModel):
    brand: str


class TripRequest(BaseModel):
    city: Optional[str] = "Delhi"
    duration_days: Optional[int] = 3
    vacation_type: Optional[str] = "city"

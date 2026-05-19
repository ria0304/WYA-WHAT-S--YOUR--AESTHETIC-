# WYA – What's Your Aesthetic

A full-stack AI-powered fashion web app that helps users discover, analyze, and refine their personal style. WYA combines computer vision, style profiling, and wardrobe intelligence to deliver personalized aesthetic insights.

![CI/CD](https://github.com/ria0304/WYA-Whats-Your-Aesthetic/actions/workflows/deploy.yml/badge.svg)

---

## 🔗 Live Deployment

| Service | URL |
|---|---|
| Frontend | http://wya-whats-your-aesthetic.s3-website.ap-south-1.amazonaws.com/ |
| Backend API | http://13.201.121.83:8000 |

---

## 🏗️ Architecture

```
User (browser / mobile)
  ↓
CloudFront + S3  ·  CDN + static hosting (ap-south-1)
  ↓
React + TypeScript frontend  ·  Vite — quiz, closet, matcher, weather
  ↓
FastAPI backend  ·  Docker on EC2 t2.micro · SQLite · rembg · OpenCV
  ↓
AWS SageMaker endpoint  ·  wya-fashionclip-serverless · ml.m5.xlarge
  ↓
FashionCLIP (patrickjohncyh/fashion-clip)  ·  zero-shot image classification
```

---

## ✨ Features

| Feature | Description |
|---|---|
| Style Quiz | Interactive questionnaire that maps your aesthetic DNA |
| Wardrobe / Closet | Upload garments with AI auto-tagging (category, color, fabric, pattern) |
| AI Outfit Matcher | Outfit suggestions based on color harmony and your style profile |
| Style Evolution | Track how your style changes over time |
| Green Score | Sustainability rating for your wardrobe |
| Aesthetic Aura | Shareable style card generated from your wardrobe |
| Vacation Shop / Curate | Trip and weather-based outfit curation |
| Weather Styling | Outfit recommendations based on real-time weather |
| Background Removal | Clean garment images automatically via rembg |
| Push Notifications | Style alerts and reminders via VAPID |

---

## 🤖 AI Pipeline

```
Image decode + background removal (rembg + OpenCV)
  ↓
Garment mask extraction (GrabCut / Otsu thresholding)
  ↓
Garment crop + zoom (removes background noise before classification)
  ↓
✅  Zero-shot classification via AWS SageMaker (FashionCLIP on ml.m5.xlarge)
  ↓
✅  Dominant color extraction via KMeans clustering (sklearn)
  ↓
✅  Secondary color detection (largest non-dominant cluster)
  ↓
✅  Texture variance + brightness analysis (OpenCV)
  ↓
✅  Pattern detection — striped / floral / geometric / solid (Sobel + Canny)
  ↓
✅  Fabric inference via rule-based classifier (category × color × texture × pattern)
  ↓
✅  Smart name generation — e.g. "Floral Chiffon Midi Dress", "Washed Indigo Jeans"
  ↓
✅  Style profile vectorization + outfit similarity matching
```

---

## 🧭 Garment Auto-Tagging Architecture

Auto-tagging runs a two-tier pipeline:

**Tier 1 — AWS SageMaker (FashionCLIP)**
Zero-shot classification with candidate labels. EC2 authenticates via IAM instance profile (no API keys). Returns category (e.g. Dress, Jeans, Watch).

**Tier 2 — Rule-based fabric classifier**
Runs locally on the EC2 container using category × color × texture × pattern rules — no additional ML inference needed.

```
Image upload
  ↓
SageMaker reachable? ─── YES ──→ FashionCLIP zero-shot → category (Dress, Jeans…)
  │                                                              ↓
  NO                                                  Fabric classifier (local rules)
  ↓                                                              ↓
Fallback: category = "Top" ─────────────────────────→ Smart name generated
```

---

## 🚦 Deployment Status

| Component | Status |
|---|---|
| Frontend (S3 + CloudFront) | ✅ Live |
| Backend (Docker on EC2) | ✅ Live |
| Database (SQLite, persistent volume) | ✅ Live |
| SageMaker FashionCLIP endpoint | ✅ InService |
| CI/CD (GitHub Actions) | ✅ Live |
| Garment auto-tagging (category) | ✅ Working |
| Color detection (KMeans) | ✅ Working |
| Fabric classifier | ✅ Working |
| Background removal | ✅ Working |
| Login / wardrobe / style DNA | ✅ Working |
| Outfit matcher | ✅ Working |
| Weather styling | ✅ Working |
| Green score | ✅ Working |
| Aesthetic aura | ✅ Working |

---

## 🛠️ Tech Stack

### Frontend
- React + TypeScript
- Vite
- Deployed on AWS S3 + CloudFront

### Backend
- FastAPI (Python)
- SQLite via SQLAlchemy (persisted at `/app/data/wya.db` via Docker volume)
- OpenCV + Pillow + rembg for computer vision
- scikit-learn for KMeans color clustering
- AWS SageMaker for garment classification (FashionCLIP)
- Dockerized and deployed on AWS EC2 (ap-south-1)

### AWS Infrastructure
- EC2 `i-0ee2cb7f52191f766` (t2.micro, ap-south-1) — runs Docker backend
- S3 bucket `wya-whats-your-aesthetic` + CloudFront — static frontend
- SageMaker endpoint `wya-fashionclip-serverless` on `ml.m5.xlarge` — InService
- IAM role `wya-sagemaker-role` attached via EC2 instance profile — no API keys needed
- SQLite DB persisted at `/home/ubuntu/wya-data/wya.db` via Docker volume mount

---

## 📁 Project Structure

```
WYA-Whats-Your-Aesthetic/
│
├── views/                      # React page components
│   ├── Closet.tsx              # Wardrobe upload + autotag UI
│   ├── AIMatcher.tsx           # Outfit suggestion UI
│   ├── StyleQuiz.tsx           # Aesthetic quiz
│   ├── Dashboard.tsx
│   ├── Evolution.tsx
│   ├── GreenScore.tsx
│   ├── AestheticAura.tsx
│   ├── VacationShop.tsx
│   ├── Curate.tsx
│   ├── Weather.tsx
│   ├── TheArchive.tsx
│   ├── ScanLook.tsx
│   └── Profile.tsx
│
├── routers/                    # FastAPI route modules
│   ├── auth_router.py          # /api/auth — login, register
│   ├── wardrobe_router.py      # /api/wardrobe — CRUD, remove-bg, archive
│   ├── outfit_router.py        # /api/outfits — save, wear tracking, history
│   ├── ai_router.py            # /api/ai — fabric-scan, outfit-match, weather, gap
│   ├── style_router.py         # /api/style — DNA, aura, evolution, dashboard
│   └── user_router.py          # /api/user — profile, preferences, notifications
│
├── services/                   # Backend service modules
│   ├── computer_vision.py      # Garment detection, masking, color, pattern
│   ├── fabric_classifier.py    # Rule-based fabric inference engine
│   ├── color_matcher.py        # Color harmony engine
│   ├── outfit_generator.py     # Outfit + gap analysis
│   ├── style_profile.py        # Style DNA extraction
│   ├── gap_analyzer.py         # Wardrobe gap detection
│   ├── brand_auditor.py        # Brand sustainability scoring
│   ├── weather_service.py      # Real-time weather + outfit pairing
│   ├── trip_curator.py         # Vacation packing curation
│   ├── email_service.py
│   └── notification_service.py
│
├── ai_model.py                 # AI orchestrator (autotag, suggestions, aura)
├── ai_matcher.py               # Advanced similarity matching engine
├── main.py                     # FastAPI app entry point + router registration
├── database.py                 # SQLite models + SQLAlchemy setup
├── auth_utils.py               # JWT authentication
├── schemas.py                  # Pydantic request/response schemas
├── Dockerfile                  # Docker image for backend
├── deploy_fashionclip.py       # SageMaker endpoint deployment script
├── Test_sagemaker.py           # SageMaker connectivity diagnostic script
├── requirements.txt
├── .env
└── README.md
```

---

## 🚀 Run Locally

### Prerequisites
- Node.js 18+
- Python 3.10+

### Frontend Setup
```bash
npm install
npm run dev
```

### Backend Setup
```bash
pip install -r requirements.txt
cp env.example .env
# Fill in your .env values
uvicorn main:app --reload
```

### Environment Variables

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT secret |
| `SAGEMAKER_ENDPOINT` | SageMaker endpoint name (default: `wya-fashionclip-serverless`) |
| `AWS_REGION` | AWS region (default: `ap-south-1`) |
| `WYA_VAPID_PRIVATE_KEY` | Push notification private key |
| `WYA_VAPID_PUBLIC_KEY` | Push notification public key |

---

## 🐳 Deployment

### Backend (Docker on EC2)

```bash
# Build image
sudo docker build -t wya-backend .

# Run container with persistent DB volume
sudo docker run -d \
  --name wya \
  --restart unless-stopped \
  -p 8000:8000 \
  --env-file .env \
  -e SAGEMAKER_ENDPOINT=wya-fashionclip-serverless \
  -e AWS_REGION=ap-south-1 \
  -v /home/ubuntu/wya-data:/app/data \
  wya-backend

# View logs
sudo docker logs wya -f

# Rebuild after code changes
sudo docker stop wya && sudo docker rm wya
sudo docker build -t wya-backend .
sudo docker run -d --name wya --restart unless-stopped \
  -p 8000:8000 --env-file .env \
  -e SAGEMAKER_ENDPOINT=wya-fashionclip-serverless \
  -e AWS_REGION=ap-south-1 \
  -v /home/ubuntu/wya-data:/app/data \
  wya-backend

# Free disk space if build fails (t2.micro fills up fast)
sudo docker system prune -a -f
```

### Frontend (S3 + CloudFront)

```bash
npm run build
aws s3 sync dist/ s3://wya-whats-your-aesthetic --delete
```

### CI/CD (GitHub Actions)

Push to `main` automatically triggers:
1. **deploy-backend** — SSH into EC2, rebuild Docker image, restart container (~2m 30s)
2. **deploy-frontend** — `npm run build` + sync to S3 (~30s)

Workflow file: `.github/workflows/deploy.yml`

### SageMaker Endpoint

```bash
source venv/bin/activate
python3 deploy_fashionclip.py
```

### Diagnose SageMaker Connectivity

```bash
# Run on EC2 to verify credentials + endpoint + invocation
pip3 install boto3 pillow --break-system-packages
python3 Test_sagemaker.py

# Test with a real garment image
python3 Test_sagemaker.py /path/to/garment.jpg
```

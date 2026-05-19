# WYA – What's Your Aesthetic

> A full-stack AI-powered fashion web app that helps users discover, analyze, and refine their personal style. WYA combines computer vision, style profiling, and wardrobe intelligence to deliver personalized aesthetic insights.

![Deploy to AWS](https://img.shields.io/github/actions/workflow/status/ria0304/WYA-Whats-Your-Aesthetic/deploy.yml?branch=main&label=Deploy+to+AWS&logo=github&logoColor=white&labelColor=24292e&color=2ea44f)

---

## 🔗 Live Deployment

| Service | URL |
|---|---|
| **Frontend** | [wya-whats-your-aesthetic.s3-website.ap-south-1.amazonaws.com](http://wya-whats-your-aesthetic.s3-website.ap-south-1.amazonaws.com/) |
| **Backend API** | [13.201.121.83:8000](http://13.201.121.83:8000) |

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
| **Style Quiz** | Interactive questionnaire that maps your aesthetic DNA |
| **Wardrobe / Closet** | Upload garments with color detection; AI auto-tagging for category and fabric |
| **AI Outfit Matcher** | Outfit suggestions based on color harmony and your style profile |
| **Style Evolution** | Track how your style changes over time |
| **Green Score** | Sustainability rating for your wardrobe |
| **Aesthetic Aura** | Shareable style card generated from your wardrobe |
| **Vacation Shop / Curate** | Trip and weather-based outfit curation |
| **Weather Styling** | Outfit recommendations based on real-time weather |
| **Background Removal** | Clean garment images automatically via rembg |
| **Push Notifications** | Style alerts and reminders via VAPID |

---

## 🤖 AI Pipeline

```
Image decode + background removal (rembg + OpenCV)
  ↓
Garment mask extraction (GrabCut / Otsu thresholding)
  ↓
Garment crop + zoom (removes background noise before classification)
  ↓
⚠️  Zero-shot classification via AWS SageMaker (FashionCLIP on ml.m5.xlarge)
     Works locally · broken on EC2 (IAM/memory/dependency under investigation)
  ↓
✅  Dominant color extraction via KMeans clustering (sklearn)
  ↓
✅  Secondary color detection (largest non-dominant cluster)
  ↓
✅  Texture variance + brightness analysis (OpenCV)
  ↓
✅  Pattern detection — striped / floral / geometric / solid (Sobel + Canny)
  ↓
⚠️  Fabric inference via rule-based classifier (category × color × texture × pattern)
     Works locally · broken on EC2
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
⚠️ Works locally, broken on EC2 — likely IAM/memory/missing system dependency inside Docker.

**Tier 2 — Rule-based fallback**
Returns `"Top"` if SageMaker is unreachable. The fabric classifier then runs locally on the EC2 container using `category × color × texture × pattern` rules — no additional ML inference needed.
⚠️ Depends on SageMaker category output, so also broken on EC2.

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
| Color detection (KMeans) | ✅ Working |
| Background removal | ✅ Working |
| Login / wardrobe / style DNA | ✅ Working |
| Outfit matcher | ✅ Working |
| Weather styling | ✅ Working |
| Green score | ✅ Working |
| Aesthetic aura | ✅ Working |
| Garment auto-tagging (category) | ⚠️ Works locally, broken on EC2 |
| Fabric classifier | ⚠️ Works locally, broken on EC2 |

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
- SageMaker endpoint `wya-fashionclip-serverless` on ml.m5.xlarge — InService
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
├── main.py                     # FastAPI app + all API routes
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

See `env.example` for all required variables:

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
- **`deploy-backend`** — SSH into EC2, rebuild Docker image, restart container (~2m 30s)
- **`deploy-frontend`** — `npm run build` + sync to S3 (~30s)

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

---

## ⚠️ Known Issues

**Garment auto-tagging broken on EC2** — FashionCLIP classification via SageMaker works when invoked locally but fails when called from inside the Docker container on EC2. Likely causes: IAM instance profile not propagating into the container, memory pressure on t2.micro, or a missing system-level dependency in the Docker image. `Test_sagemaker.py` can be run directly on the EC2 host to isolate the layer where credentials/invocation breaks.

**Fabric classifier broken on EC2** — Depends on the category output from SageMaker, so it is indirectly broken by the same issue above.

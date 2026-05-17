# WYA – What's Your Aesthetic

A full-stack AI-powered fashion web app that helps users discover, analyze, and refine their personal style. WYA combines computer vision, style profiling, and wardrobe intelligence to deliver personalized aesthetic insights.

The complete AI pipeline is fully functional in local development. Current work focuses on productionizing inference and deployment on AWS infrastructure using EC2, Docker, and SageMaker Serverless.

---

## Live Deployment

| Service | URL |
|---|---|
| Frontend | https://d1yc69o122s878.cloudfront.net |
| Backend API | http://13.201.121.83:8000 |

---

## Architecture

```
User
  ↓
CloudFront + S3
  ↓
React Frontend
  ↓
FastAPI Backend (Docker on EC2)
  ↓
SageMaker Serverless Endpoint
  ↓
FashionCLIP / CLIP
```

---

## Features

- **Style Quiz** — Interactive questionnaire that maps your aesthetic DNA
- **Wardrobe / Closet** — Upload garments with AI auto-tagging (category, color, fabric, pattern)
- **AI Outfit Matcher** — Get outfit suggestions based on color harmony and your style profile
- **Style Evolution** — Track how your style changes over time
- **Green Score** — Sustainability rating for your wardrobe
- **Aesthetic Aura** — Shareable style card generated from your wardrobe
- **Vacation Shop / Curate** — Trip and weather-based outfit curation
- **Weather Styling** — Outfit recommendations based on real-time weather
- **Background Removal** — Clean garment images automatically
- **Push Notifications** — Style alerts and reminders

---

## AI Pipeline

1. Garment preprocessing and background removal
2. Computer vision feature extraction (OpenCV)
3. CLIP / FashionCLIP embedding generation via SageMaker Serverless
4. Color palette clustering using KMeans
5. Style profile vectorization
6. Outfit similarity matching
7. Personalized recommendation generation

---

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Deployed on AWS S3 + CloudFront

### Backend
- FastAPI (Python)
- SQLite via SQLAlchemy
- OpenCV + Pillow for computer vision
- AWS SageMaker Serverless for garment classification
- Deployed on AWS EC2 via Docker

### AWS Infrastructure
- EC2 (ap-south-1) running Dockerized FastAPI backend
- S3 + CloudFront for static frontend hosting
- SageMaker Serverless Endpoint for ML inference
- IAM instance profile for secure EC2 to SageMaker authentication

---

## Project Structure

```
WYA-Whats-Your-Aesthetic/
│
├── views/                  # React page components
│   ├── Closet.tsx
│   ├── AIMatcher.tsx
│   ├── StyleQuiz.tsx
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
├── services/               # Backend service modules
│   ├── computer_vision.py  # Garment detection, color, pattern, fabric
│   ├── color_matcher.py    # Color harmony engine
│   ├── outfit_generator.py # Outfit + gap analysis
│   ├── style_profile.py    # Style DNA extraction
│   ├── fabric_classifier.py
│   ├── brand_auditor.py
│   ├── weather_service.py
│   ├── trip_curator.py
│   └── notification_service.py
│
├── ai_model.py             # AI orchestrator (autotag, suggestions, aura)
├── ai_matcher.py           # Similarity matching engine
├── main.py                 # FastAPI app + all routes
├── database.py             # SQLite models + connection
├── auth_utils.py           # JWT authentication
├── schemas.py              # Pydantic schemas
├── Dockerfile              # Docker image for backend
├── deploy_fashionclip.py   # SageMaker endpoint deployment script
├── requirements.txt
├── .env
└── README.md
```

---

## Run Locally

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
See `env.example` for all required variables including:
- `SECRET_KEY` — JWT secret
- `WYA_VAPID_PRIVATE_KEY` / `WYA_VAPID_PUBLIC_KEY` — Push notifications

---

## Garment Auto-Tagging Architecture

Garment category detection uses a three-tier fallback:

1. **Local FashionCLIP** — attempted first; skipped if RAM is insufficient
2. **AWS SageMaker Serverless** — CLIP-based zero-shot image classification
3. **Default** — returns "Top" if both fail

EC2 authenticates to SageMaker via IAM instance profile — no API keys required.

---

## Deployment Status

- Frontend deployed on AWS S3 + CloudFront
- Backend containerized using Docker
- AI inference pipeline fully functional locally
- EC2 and SageMaker production integration currently being optimized

| Component | Status |
|---|---|
| Core AI pipeline | Working locally |
| Auto-tagging | Working locally |
| Fabric detection | Working locally |
| Frontend | Deployed |
| Backend (Docker) | Deployed on EC2 |
| SageMaker inference | Integration in progress |

---

## Deployment

### Backend (Docker on EC2)
```bash
# Build image
sudo docker build -t wya-backend .

# Run container
sudo docker run -d \
  --name wya \
  --restart unless-stopped \
  -p 8000:8000 \
  --env-file .env \
  wya-backend

# View logs
sudo docker logs -f wya

# Restart after code changes
sudo docker stop wya && sudo docker rm wya
sudo docker build -t wya-backend .
sudo docker run -d --name wya --restart unless-stopped -p 8000:8000 --env-file .env wya-backend
```

### Frontend (S3 + CloudFront)
```bash
npm run build
aws s3 sync dist/ s3://wya-whats-your-aesthetic --delete
```

### SageMaker Endpoint
```bash
source venv/bin/activate
python3 deploy_fashionclip.py
```

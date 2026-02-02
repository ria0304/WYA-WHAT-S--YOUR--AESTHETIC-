
# WYA - What's Your Aesthetic | Tech Stack

## Frontend (Client-Side)
- **Framework**: [React 19](https://react.dev/) (via ESM)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Styling**: 
  - [TailwindCSS](https://tailwindcss.com/) (CDN)
  - Custom CSS Animations
- **Icons**: [Lucide React](https://lucide.dev/)
- **Build System**: ESM Modules (No bundler required for dev, runs natively in modern browsers via import maps)

## Backend (Server-Side)
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Server**: Uvicorn (ASGI)
- **Database**: [SQLite](https://www.sqlite.org/index.html) (Local embedded DB)
- **Authentication**: JWT (JSON Web Tokens) with `python-jose` & `bcrypt`
- **External Requests**: `requests` (for Weather API)

## Artificial Intelligence & Computer Vision
- **Computer Vision (Local)**:
  - [OpenCV (cv2)](https://opencv.org/) - Image processing, structural analysis, edge detection.
  - [Scikit-Learn](https://scikit-learn.org/) - K-Means Clustering for dominant color extraction.
  - [Numpy](https://numpy.org/) - Matrix operations for image data.
- **Logic**: Rule-based styling engine (Heuristic matching).
- **External Data**: 
  - [WeatherAPI.com](https://www.weatherapi.com/) - Real-time weather data for styling.

## Features
- **Local ML**: Runs fabric and color analysis directly on the server without needing external AI APIs for basic tasks.
- **Offline-Capable DB**: SQLite ensures data persists without external dependencies.
- **Responsive UI**: Mobile-first design methodology using Tailwind utility classes.

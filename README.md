# VN Food Handbook

VN Food Handbook is a web application designed to help tourists and food enthusiasts explore Vietnamese cuisine. The system combines a standard food dictionary with AI-powered features, allowing users to identify dishes via images and interact with a virtual culinary chef.

This project was developed as a university group project.

> [!NOTE]
> This project is done with 30% help of AI (a vibe-coding project).

## Overview

The application contains some basic features of a Food Blog such as:
- Search and filter traditional dishes.
- Use a camera or upload photos to identify food using a trained AI model.
- Ask questions about recipes and culture via an AI Chatbot.
- Share their own food stories and interact with the community.

## Tech Stack

**Frontend:**
- ReactJS
- Material UI (MUI)
- Axios (for API communication)
- Framer Motion (for animations)

**Backend:**
- Python 3.x
- FastAPI
- Uvicorn (ASGI Server)
- SQLAlchemy (ORM)

**Database & Storage:**
- MySQL (Relational data: Users, Foods, Comments)
- Firebase Authentication (User identity management)
- Local Static Storage (Images)

**AI & Machine Learning:**
- PyTorch (ResNet-18 model for Food Classification - 36 classes)
- Google Gemini API (Chef Chatbot)

## Features

1. **Food Gallery:** View, search, and filter dishes by region (North, Central, South) or type.
2. **AI Food Recognition:** Upload an image to detect the dish name with confidence score.
3. **Chef Chatbot:** Integrated with Google Gemini to answer culinary queries in English and Vietnamese.
4. **Community Blog & Forum:** Users can write blogs, create discussion topics, and comment.
5. **Gamification:** Mini-games like Food Memory, Puzzle, and Hangman.
6. **Admin Dashboard:** Manage users, posts, and view system statistics.

## Installation & Setup

### 1. Prerequisites
- Node.js & npm
- Python 3.8+
- MySQL Server
- A Google Cloud Project (for Gemini API and Firebase)

### 2. Database Setup
1. Create a MySQL database named `vnfood_db`.
2. Import the provided SQL dump file (`Dump20251222.sql`) to seed the initial structure and data.
3. Update your database credentials in the backend configuration.

### 3. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
pip install fastapi uvicorn sqlalchemy mysql-connector-python torch torchvision python-multipart python-dotenv google-generativeai firebase-admin pillow
```

Create a `.env` file in the root of the backend folder:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=vnfood_db
GEMINI_API_KEY=your_gemini_api_key
BACKEND_URL=http://localhost:8000
```

Add your Firebase credentials:

Place your `serviceAccountKey.json` file in the backend root directory.

Run the server:

```bash
python server.py
# or
uvicorn server:app --reload
```

The server will start at http://localhost:8000

> [!NOTE]
> You shoulde run frontend and backend folders independently.
> Download checkpoint file for AI recognition feature at `https://drive.google.com/file/d/18oGUak9XRLljBZ-M-ZY4EzPhCOOVvZJi/view?usp=sharing`

### 4. Frontend Setup

Install packages:

```bash
npm install
```

Start the React application:

```bash
npm start
```

The application will run at http://localhost:3000
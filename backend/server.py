import os
import io
import uvicorn
import uuid
from urllib.parse import quote_plus, unquote
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship

import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image

import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

# Load environment variables from .env file
load_dotenv()

# Database and API configurations
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_USER = os.getenv("DB_USER", "root")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "vnfood_db")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Initialize Firebase Admin SDK for user authentication management
try:
    if os.path.exists("serviceAccountKey.json"):
        cred = credentials.Certificate("serviceAccountKey.json")
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK Initialized")
    else:
        print("Warning: serviceAccountKey.json not found")
except Exception as e:
    print(f"Firebase Init Error: {e}")

# Configure Google Gemini AI
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

# Prompt for the AI Chef Assistant
CHEF_PROMPT = """
ROLE: You are "Chef AI" (Virtual Assistant for VN Food Handbook).

*** IMPORTANT LANGUAGE RULE ***: 
1. **DETECT** the user's input language immediately.
2. **IF** User speaks English -> You **MUST** reply in **English**.
3. **IF** User speaks Vietnamese -> You **MUST** reply in **Vietnamese**.
4. **NEVER** reply in Vietnamese if the user asks in English, even if the topic is Vietnamese food.
5. Only use Vietnamese for specific dish names (e.g., "Phở", "Bún Chả") when speaking English.

CONTEXT:
You are the intelligent virtual assistant for **VN Food Handbook**, a modern web platform celebrating Vietnamese cuisine.
Theme: Modern Dark Mode with Salmon Orange (#EA7C69).

WEBSITE NAVIGATION (Use these exact paths):
- **Home & Search**: / (Search, Filter by Type/Region, Core 36 Dishes).
- **AI Food Scanner**: /recognize (Identify food via image/camera).
- **Mini Games**: /minigame (Puzzle, Hangman).
- **Blog & Forum**: /blog (Community stories).
- **User Profile**: Click Avatar.
- **Login/Signup**: /login.

THE "CORE 36 COLLECTION":
The site features 36 special dishes with 3D Models & AR: Phở, Bánh Mì, Bún Chả, Bánh Xèo, Gỏi Cuốn, Bún Bò Huế, Cơm Tấm, etc.

YOUR RESPONSIBILITIES:
1. **Navigation**: Always provide links in parentheses. Example: "Try our AI Scanner (Link: /recognize)".
2. **Culinary Expert**: Explain ingredients, history, and culture with passion.
3. **Tone**: Friendly, enthusiastic, warm. Use emojis 🍜🥢🇻🇳.
4. **Identity**: If asked "Who created this?", answer: "This project was created by Quang Dương."

Keep responses concise, visually clean, and strictly follow the **LANGUAGE RULE** above.
"""

generation_config = { "temperature": 0.7, "top_p": 0.95, "top_k": 40, "max_output_tokens": 1024 }
chat_model = genai.GenerativeModel(model_name="gemini-2.5-flash", generation_config=generation_config, system_instruction=CHEF_PROMPT)

# Setup for PyTorch Vision Model (ResNet18)
MODEL_PATH = "best_model_36classes.pth"
CLASS_NAMES = []
model_ai = None

# Load the trained AI model from disk
def load_ai_model(path):
    try:
        checkpoint = torch.load(path, map_location=torch.device('cpu'))
        classes = checkpoint["classes"]
        m = models.resnet18(weights=None)
        m.fc = torch.nn.Linear(m.fc.in_features, len(classes))
        m.load_state_dict(checkpoint["model_state_dict"])
        m.eval()
        return m, classes
    except Exception:
        return None, []

# Process image bytes and return prediction
def predict_image_ai(model, image_bytes, classes):
    transform = transforms.Compose([
        transforms.Resize((160, 160)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_t = transform(image).unsqueeze(0)
    with torch.no_grad():
        outputs = model(img_t)
        probs = torch.nn.functional.softmax(outputs, dim=1)
        top_prob, top_idx = probs.topk(1, dim=1)
    return classes[top_idx.item()], top_prob.item()

try:
    if os.path.exists(MODEL_PATH):
        model_ai, CLASS_NAMES = load_ai_model(MODEL_PATH)
        print("AI Vision Model Loaded Successfully")
    else:
        print("Warning: Vision Model file not found")
except Exception as e:
    print(f"AI Vision Model Error: {e}")

# Database Connection String
encoded_password = quote_plus(DB_PASSWORD)
SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{encoded_password}@{DB_HOST}:3306/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_recycle=3600)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define Database Models
class User(Base):
    __tablename__ = "users"
    uid = Column(String(100), primary_key=True, index=True) 
    email = Column(String(255))
    display_name = Column(String(255))
    photo_url = Column(String(500))
    role = Column(String(50), default="user") 
    created_at = Column(DateTime, default=datetime.utcnow)

class Food(Base):
    __tablename__ = "foods"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, index=True)
    name = Column(String(255))
    introduction = Column(Text)
    ingredients = Column(Text)
    recipe = Column(Text)
    region = Column(String(50))
    city = Column(String(100))
    type = Column(String(255))
    image_url = Column(String(500))
    author = Column(String(100)) 
    created_at = Column(String(50)) 

class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    food_slug = Column(String(100), index=True)
    user_uid = Column(String(100), ForeignKey("users.uid"))
    parent_id = Column(Integer, nullable=True) 
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User") 

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String(100), index=True)  
    sender_uid = Column(String(100), ForeignKey("users.uid"), nullable=True) 
    content = Column(String(500)) 
    link = Column(String(255)) 
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    sender = relationship("User", foreign_keys=[sender_uid])

class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50)) 
    content = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Dependency for Database Session
def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# Helper to create a new notification
def create_notification(db: Session, user_uid: str, sender_uid: str, content: str, link: str):
    notif = Notification(user_uid=user_uid, sender_uid=sender_uid, content=content, link=link)
    db.add(notif); db.commit()

# Helper to save system logs
def save_log(db: Session, type: str, content: str):
    try:
        new_log = SystemLog(type=type, content=content, created_at=datetime.utcnow())
        db.add(new_log); db.commit()
    except Exception as e:
        print(f"Log Error: {e}")

# Helper to verify admin privileges
def get_current_admin(uid: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.uid == uid).first()
    if not user or user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user

# Helper to format image URLs correctly for mobile/desktop
def fix_url(url: str):
    if not url: return ""
    if "static/" in url:
        clean_path = url.split("static/")[-1]
        return f"{BACKEND_URL}/static/{clean_path}"
    if url.startswith("http"): 
        return url
    return f"{BACKEND_URL}/{url.lstrip('/')}"

# Helper to delete local image files safely
def delete_old_image(image_url: str):
    if not image_url or "static/" not in image_url: return
    try:
        relative_path = "static/" + image_url.split("static/")[1]
        # Decode special characters in URL
        relative_path = unquote(relative_path)
        if os.path.exists(relative_path):
            os.remove(relative_path)
    except Exception as e:
        print(f"Error deleting image: {e}")

# Save uploaded file to local static directory
async def save_file_locally(file: UploadFile, folder: str) -> str:
    try:
        target_dir = f"static/{folder}"
        os.makedirs(target_dir, exist_ok=True)
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}" 
        file_location = f"{target_dir}/{unique_filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(await file.read())
        return f"{BACKEND_URL}/{file_location}"
    except Exception as e:
        print(f"Upload Error: {e}")
        return None

# Pydantic Schemas for Request Data
class UserSync(BaseModel):
    uid: str
    email: str
    displayName: Optional[str] = "User"
    photoURL: Optional[str] = ""

class UserUpdateProfile(BaseModel):
    display_name: str
    photo_url: str

class CommentCreate(BaseModel):
    food_slug: str
    user_uid: str
    content: str
    parent_id: Optional[int] = None 

class CommentUpdate(BaseModel):
    content: str

class FoodCreate(BaseModel):
    slug: str
    name: str
    introduction: str
    image_url: str
    region: str
    city: str
    type: list[str]
    recipe: str
    author: str

class FoodUpdate(BaseModel):
    name: str
    introduction: str
    image_url: str
    region: str
    city: str
    type: list[str]
    recipe: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

# Initialize FastAPI App
app = FastAPI()

# Configure CORS to allow access from local development networks
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.0.100:3000", 
    "http://192.168.9.101:3000",
]

# Use Regex to allow dynamic local IPs
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",          
        "http://food.xdp.vn",    
        "https://food.xdp.vn"    
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Health check endpoint
@app.get("/")
def read_root(): return {"message": "Backend Running"}

# Chat with Gemini AI
@app.post("/api/chat")
async def chat_with_chef(req: ChatRequest):
    if not GEMINI_KEY: return {"reply": "Server Error: API Key not configured."}
    try:
        chat_session = chat_model.start_chat(history=[]) 
        response = chat_session.send_message(req.message)
        return {"reply": response.text}
    except Exception as e:
        print(f"GEMINI AI ERROR: {str(e)}")
        return {"reply": "Sorry, the kitchen is busy right now!"}

# Sync user data from Firebase to MySQL
@app.post("/api/users/sync")
def sync_user(user: UserSync, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.uid == user.uid).first()
    if not db_user:
        d_name = user.displayName if user.displayName else user.email.split('@')[0]
        db_user = User(uid=user.uid, email=user.email, display_name=d_name, photo_url=user.photoURL or "", role="user")
        db.add(db_user); db.commit()
        save_log(db, "user", f"New user joined: {d_name}")
    return {"status": "synced"}

# Get user profile info
@app.get("/api/users/{uid}")
def get_user_profile(uid: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.uid == uid).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return {
        "uid": user.uid, "email": user.email, "display_name": user.display_name,
        "photo_url": fix_url(user.photo_url),
        "role": user.role, "created_at": user.created_at
    }

# Update user profile name and avatar
@app.put("/api/users/{uid}")
def update_user_profile(uid: str, data: UserUpdateProfile, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.uid == uid).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    
    try:
        if user.photo_url and data.photo_url and user.photo_url != data.photo_url:
            delete_old_image(user.photo_url)

        old_name = user.display_name
        user.display_name = data.display_name
        user.photo_url = data.photo_url
        
        # Update author name in foods if user changes display name
        if old_name != data.display_name:
            foods = db.query(Food).filter(Food.author == old_name).all()
            for f in foods: f.author = data.display_name
            
        db.commit(); db.refresh(user)
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=str(e))
    return {"status": "updated", "new_name": user.display_name}

# Get list of all foods
@app.get("/api/foods")
def get_all_foods(db: Session = Depends(get_db)):
    users = db.query(User).all()
    user_map = {u.display_name: u for u in users}

    foods = db.query(Food).order_by(Food.created_at.desc()).all()
    results = []
    for f in foods:
        item = f.__dict__.copy()
        if '_sa_instance_state' in item: del item['_sa_instance_state']
        
        author_user = user_map.get(f.author)
        item['author_uid'] = author_user.uid if author_user else None
        item['author_photo'] = fix_url(author_user.photo_url) if author_user else ""
        item['type'] = f.type.split(',') if f.type else []
        item['ingredients'] = f.ingredients.split('|') if f.ingredients else []
        item['imageUrl'] = fix_url(f.image_url)
        item['createdAt'] = f.created_at
        results.append(item)
    return results

# Get foods by specific author
@app.get("/api/foods/author/{author_name}")
def get_foods_by_author(author_name: str, db: Session = Depends(get_db)):
    foods = db.query(Food).filter(Food.author == author_name).filter(Food.region != 'Forum').order_by(Food.created_at.desc()).all()
    results = []
    for f in foods:
        item = f.__dict__.copy()
        if '_sa_instance_state' in item: del item['_sa_instance_state']
        item['imageUrl'] = fix_url(f.image_url)
        results.append(item)
    return results

# Get detailed food information
@app.get("/api/foods/{slug}")
def get_food_detail(slug: str, db: Session = Depends(get_db)):
    f = db.query(Food).filter(Food.slug == slug).first()
    if not f: raise HTTPException(status_code=404, detail="Food not found")
    
    author_user = db.query(User).filter(User.display_name == f.author).first()

    return {
        "id": f.slug, "slug": f.slug, "name": f.name, "introduction": f.introduction,
        "ingredients": f.ingredients.split('|') if f.ingredients else [], "recipe": f.recipe,
        "region": f.region, "city": f.city, "type": f.type.split(',') if f.type else [],
        "imageUrl": fix_url(f.image_url), 
        "author": f.author, 
        "author_uid": author_user.uid if author_user else None, 
        "author_photo": fix_url(author_user.photo_url) if author_user else "",
        "createdAt": f.created_at
    }

# Create a new food post (Blog)
@app.post("/api/foods/create")
def create_blog(food: FoodCreate, db: Session = Depends(get_db)):
    if db.query(Food).filter(Food.slug == food.slug).first(): raise HTTPException(status_code=400, detail="Slug already exists")
    new_food = Food(
        slug=food.slug, name=food.name, introduction=food.introduction,
        ingredients="", recipe=food.recipe, region=food.region,
        city=food.city, type=",".join(food.type), image_url=food.image_url,
        author=food.author, created_at=datetime.now().isoformat()
    )
    db.add(new_food); db.commit()
    save_log(db, "post", f"New post created: {food.name} ({food.region})")
    return {"status": "created", "slug": food.slug}

# Update an existing food post
@app.put("/api/foods/{slug}")
def update_blog(slug: str, food: FoodUpdate, db: Session = Depends(get_db)):
    db_food = db.query(Food).filter(Food.slug == slug).first()
    if not db_food: raise HTTPException(status_code=404, detail="Food not found")
    
    db_food.name = food.name; db_food.introduction = food.introduction; db_food.image_url = food.image_url
    db_food.region = food.region; db_food.city = food.city; db_food.type = ",".join(food.type); db_food.recipe = food.recipe
    db.commit()
    return {"status": "updated"}

# Delete a food post
@app.delete("/api/foods/{slug}")
def delete_food(slug: str, db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.slug == slug).first()
    if not food: raise HTTPException(status_code=404, detail="Food not found")
    
    db.query(Comment).filter(Comment.food_slug == slug).delete()
    if food.image_url: delete_old_image(food.image_url)
    db.delete(food); db.commit()
    return {"status": "deleted"}

# Get comments for a specific food slug
@app.get("/api/comments/{food_slug}")
def get_comments(food_slug: str, db: Session = Depends(get_db)):
    comments = db.query(Comment, User).join(User, Comment.user_uid == User.uid).filter(Comment.food_slug == food_slug).order_by(Comment.created_at.asc()).all()
    results = []
    for c, u in comments:
        results.append({
            "id": c.id, "content": c.content, "created_at": c.created_at,
            "user_uid": c.user_uid, "parent_id": c.parent_id,
            "user": { 
                "display_name": u.display_name if u else "Unknown", 
                "photo_url": fix_url(u.photo_url) if u else ""
            }
        })
    return results

# Post a new comment
@app.post("/api/comments")
def create_comment(comment: CommentCreate, db: Session = Depends(get_db)):
    new_comment = Comment(content=comment.content, food_slug=comment.food_slug, user_uid=comment.user_uid, parent_id=comment.parent_id)
    db.add(new_comment); db.commit(); db.refresh(new_comment)
    
    sender = db.query(User).filter(User.uid == comment.user_uid).first()
    sender_name = sender.display_name if sender else "Someone"
    food_item = db.query(Food).filter(Food.slug == comment.food_slug).first()
    base_link = f"/forum/{comment.food_slug}" if food_item and food_item.region == "Forum" else f"/dish/{comment.food_slug}"
    final_link = f"{base_link}?highlight={new_comment.id}"

    if comment.parent_id:
        parent_comment = db.query(Comment).filter(Comment.id == comment.parent_id).first()
        if parent_comment and parent_comment.user_uid != comment.user_uid:
            create_notification(db, parent_comment.user_uid, comment.user_uid, f"{sender_name} replied to your comment", final_link)
    else:
        if food_item:
            author_user = db.query(User).filter(User.display_name == food_item.author).first()
            if author_user and author_user.uid != comment.user_uid:
                 create_notification(db, author_user.uid, comment.user_uid, f"{sender_name} commented on '{food_item.name}'", final_link)
    return {"status": "success"}

# Update comment content
@app.put("/api/comments/{comment_id}")
def update_comment(comment_id: int, comment: CommentUpdate, db: Session = Depends(get_db)):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment: raise HTTPException(status_code=404, detail="Comment not found")
    db_comment.content = comment.content; db.commit()
    return {"status": "updated"}

# Delete comment and its replies
@app.delete("/api/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    db_comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not db_comment: raise HTTPException(status_code=404, detail="Comment not found")
    db.query(Comment).filter(Comment.parent_id == comment_id).delete()
    db.delete(db_comment); db.commit()
    return {"status": "deleted"}

# Get user notifications
@app.get("/api/notifications/{user_uid}")
def get_user_notifications(user_uid: str, db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.user_uid == user_uid).order_by(Notification.created_at.desc()).all()
    results = []
    for n in notifs:
        results.append({
            "id": n.id, "content": n.content, "link": n.link, "is_read": n.is_read, "created_at": n.created_at,
            "sender": { "uid": n.sender.uid if n.sender else None, "display_name": n.sender.display_name if n.sender else "System", "photo_url": fix_url(n.sender.photo_url) if n.sender else "" }
        })
    return results

# Mark single notification as read
@app.put("/api/notifications/{id}/read")
def mark_notification_read(id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == id).first()
    if notif: notif.is_read = True; db.commit()
    return {"status": "success"}

# Mark all notifications as read
@app.put("/api/notifications/read-all/{user_uid}")
def mark_all_notifications_read(user_uid: str, db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_uid == user_uid).update({Notification.is_read: True})
    db.commit()
    return {"status": "success"}

# Delete single notification
@app.delete("/api/notifications/{id}")
def delete_notification(id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif: raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif); db.commit()
    return {"status": "deleted"}

# Delete all notifications for user
@app.delete("/api/notifications/delete-all/{user_uid}")
def delete_all_notifications(user_uid: str, db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_uid == user_uid).delete()
    db.commit()
    return {"status": "deleted"}

# Upload generic image
@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    url = await save_file_locally(file, "food_images")
    return {"url": url} if url else {"error": "Upload failed"}

# Upload user avatar
@app.post("/api/upload-avatar")
async def upload_avatar(file: UploadFile = File(...)):
    url = await save_file_locally(file, "avatars")
    return {"url": url} if url else {"error": "Upload failed"}

# Upload blog cover image
@app.post("/api/upload-blog-image")
async def upload_blog_image(file: UploadFile = File(...)):
    url = await save_file_locally(file, "blog_images")
    return {"url": url} if url else {"error": "Upload failed"}

# AI Food Prediction Endpoint
@app.post("/api/predict")
async def predict_endpoint(file: UploadFile = File(...)):
    if not model_ai: return {"error": "AI Model not loaded"}
    try:
        image_bytes = await file.read()
        class_name, confidence = predict_image_ai(model_ai, image_bytes, CLASS_NAMES)
        return {"prediction": class_name, "confidence": confidence}
    except Exception as e: return {"error": str(e)}

# Get admin statistics
@app.get("/api/admin/stats")
def get_admin_stats(uid: str, db: Session = Depends(get_db)):
    get_current_admin(uid, db)
    return { 
        "users": db.query(User).count(), 
        "foods": db.query(Food).filter(Food.region != 'Forum').count(), 
        "forum_posts": db.query(Food).filter(Food.region == 'Forum').count(), 
        "comments": db.query(Comment).count() 
    }

# Get list of users for admin
@app.get("/api/admin/users")
def get_all_users_admin(uid: str, db: Session = Depends(get_db)):
    get_current_admin(uid, db)
    return db.query(User).order_by(User.created_at.desc()).all()

# Admin delete user
@app.delete("/api/admin/users/{target_uid}")
def delete_user_admin(uid: str, target_uid: str, db: Session = Depends(get_db)):
    get_current_admin(uid, db)
    user = db.query(User).filter(User.uid == target_uid).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    try:
        if user.photo_url: delete_old_image(user.photo_url)
        db.query(Comment).filter(Comment.user_uid == target_uid).delete()
        db.query(Notification).filter(Notification.user_uid == target_uid).delete()
        
        notifs_sent = db.query(Notification).filter(Notification.sender_uid == target_uid).all()
        for n in notifs_sent: n.sender_uid = None
            
        user_blogs = db.query(Food).filter(Food.author == user.display_name).all()
        for blog in user_blogs:
            if blog.image_url: delete_old_image(blog.image_url)
            db.delete(blog)
        
        db.delete(user); db.commit()
        try: firebase_auth.delete_user(target_uid)
        except Exception: pass
        return {"status": "deleted"}
    except Exception as e:
        db.rollback(); raise HTTPException(status_code=500, detail=str(e))

# Admin update user role
@app.put("/api/admin/users/{target_uid}/role")
def update_user_role(uid: str, target_uid: str, new_role: str, db: Session = Depends(get_db)):
    get_current_admin(uid, db)
    user = db.query(User).filter(User.uid == target_uid).first()
    if not user: raise HTTPException(status_code=404, detail="User not found")
    user.role = new_role; db.commit()
    return {"status": "updated"}

# Admin get recent comments
@app.get("/api/admin/comments")
def get_all_comments_admin(uid: str, db: Session = Depends(get_db)):
    get_current_admin(uid, db)
    comments = db.query(Comment).order_by(Comment.created_at.desc()).limit(100).all()
    results = []
    for c in comments:
        food = db.query(Food).filter(Food.slug == c.food_slug).first()
        results.append({
            "id": c.id, "content": c.content, "created_at": c.created_at,
            "user_uid": c.user_uid, "user_name": c.user.display_name if c.user else "Unknown",
            "user_avatar": fix_url(c.user.photo_url) if c.user else "",
            "post_name": food.name if food else "Unknown Post",
            "post_slug": c.food_slug
        })
    return results

# Admin delete comment
@app.delete("/api/admin/comments/{comment_id}")
def delete_comment_admin(uid: str, comment_id: int, db: Session = Depends(get_db)):
    get_current_admin(uid, db)
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment: raise HTTPException(status_code=404, detail="Comment not found")
    db.query(Comment).filter(Comment.parent_id == comment_id).delete()
    db.delete(comment); db.commit()
    return {"status": "deleted"}

# Seed data using Upsert strategy (Update if exists, Insert if new)
@app.post("/api/seed-data")
def seed_data(foods_data: list[dict], db: Session = Depends(get_db)):
    try:
        count_new = 0
        count_update = 0
        
        for item in foods_data:
            existing_food = db.query(Food).filter(Food.slug == item['slug']).first()
            type_str = ",".join(item.get('type', [])) if isinstance(item.get('type'), list) else item.get('type', '')
            
            if existing_food:
                existing_food.name = item['name']
                existing_food.introduction = item.get('introduction', '')
                existing_food.recipe = item.get('recipe', '')
                existing_food.region = item.get('region', '')
                existing_food.city = item.get('city', '')
                existing_food.type = type_str
                if item.get('imageUrl'):
                    existing_food.image_url = item.get('imageUrl')
                count_update += 1
            else:
                new_food = Food(
                    slug=item['slug'], name=item['name'], 
                    introduction=item.get('introduction', ''),
                    ingredients="", recipe=item.get('recipe', ''), 
                    region=item.get('region', ''),
                    city=item.get('city', ''), type=type_str, 
                    image_url=item.get('imageUrl', ''),
                    author=item.get('author', 'admin'), 
                    created_at=str(item.get('createdAt', datetime.now()))
                )
                db.add(new_food)
                count_new += 1
        
        db.commit()
        return {"status": "success", "new_added": count_new, "updated": count_update}
    except Exception as e:
        db.rollback(); return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
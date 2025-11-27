# create a Flask web app with PostgreSQL database integration,
# password hashing, 
# login management, 
# and database migrations
# loads authentication routes via a blueprint

# Initialize Flask App
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_migrate import Migrate
import os
from dotenv import load_dotenv

import cloudinary
import cloudinary.uploader
import cloudinary.api

from flask_cors import CORS 
from flask_jwt_extended import JWTManager

cloudinary.config(
    cloud_name="CLOUD_NAME",
    api_key="CLOUD_API_KEY",
    api_secret="CLOUD_API_SECRET"
)

load_dotenv()

db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()
migrate = Migrate()
jwt = JWTManager()  

def create_app():
    app = Flask(__name__)
    # app.config['SECRET_KEY'] = 'secret_key'
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "fallback_secret")
    # app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost:5432/ecommerce_db'
    # app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://postgres@localhost:5432/flask_ecommerce"
    # app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
    app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql://flask_ecommerce_db_vp25_user:x1GF7vUhwJix8jRQFq3YWEfDTDdF5bu0@dpg-d3uirv63jp1c73aashs0-a.oregon-postgres.render.com/flask_ecommerce_db_vp25"
        
    
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        "connect_args": {"sslmode": "require"}
    }

    # app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['SESSION_COOKIE_SECURE'] = True 
    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    # migrate = Migrate(app, db)
    migrate.init_app(app, db)
    
    jwt.init_app(app) 
    
    # CORS configuration for React development
    # CORS(app, origins=['http://localhost:3000'], supports_credentials=True)  
    CORS(app, supports_credentials=True, origins=[
        # "https://flask-ecommerce-o41y.onrender.com",
        # "flask-ecommerce-j9cilmwx4-steslics-projects.vercel.app",
        "https://flask-ecommerce-orpin.vercel.app", # Vercel frontend
        "http://localhost:3000"
    ])

    login_manager.login_view = 'auth.login'
    login_manager.login_message_category = 'info'

    # Register blueprints
    from app.auth.routes import auth
    app.register_blueprint(auth)

    from app.main.routes import main
    app.register_blueprint(main)
    
    # NEW: Register API blueprint
    from app.auth.routes import api_auth
    app.register_blueprint(api_auth)

    from app.main.routes import api
    app.register_blueprint(api) 
    
    return app

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

load_dotenv()

db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    # app.config['SECRET_KEY'] = 'secret_key'
    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "fallback_secret")
    #app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost:5432/ecommerce_db'
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")

    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    # migrate = Migrate(app, db)
    migrate.init_app(app, db)

    login_manager.login_view = 'auth.login'
    login_manager.login_message_category = 'info'

    from app.auth.routes import auth
    app.register_blueprint(auth)

    return app

# Database Models

from app import db, login_manager
from flask_login import UserMixin

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)          # unique product ID
    name = db.Column(db.String(100), nullable=False)      # product name (required)
    description = db.Column(db.Text)                      # longer text description
    price = db.Column(db.Float, nullable=False)           # product price (required)
    stock = db.Column(db.Integer, default=0)              # quantity in stock (defaults to 0)

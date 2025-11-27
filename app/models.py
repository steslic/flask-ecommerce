# Database Models

from datetime import datetime
from app import db, login_manager
from flask_login import UserMixin

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Tracks registered users
class User(db.Model, UserMixin):
    #__tablename__ = '"user"'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)

    # relationship: one user can have many orders
    # One to many with Order
    orders = db.relationship("Order", backref="customer", lazy=True)

# Stores product info
class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)          # unique product ID
    name = db.Column(db.String(100), nullable=False)      # product name (required)
    description = db.Column(db.Text)                      # longer text description
    price = db.Column(db.Float, nullable=False)           # product price (required)
    stock = db.Column(db.Integer, default=0)              # quantity in stock (defaults to 0)
    image_filename = db.Column(db.String(255), nullable=True)  # NEW FIELD
    # image_url = db.Column(db.String(500)) # store cloud URL

    # relationship: product can appear in many order items
    # One to many with OrderItem
    order_items = db.relationship("OrderItem", backref="product", lazy=True)

# Order - tracks who made the order and when
class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)  # who placed the order
    date_created = db.Column(db.DateTime, default=datetime.utcnow)             # when order was placed
    status = db.Column(db.String(20), default="Pending")                       # e.g. Pending, Shipped, Completed

    # relationship: one order can have many order items
    # One to many with OrderItem
    items = db.relationship("OrderItem", backref="order", lazy=True)

# OrderItem - links each product to an order (one order can contain multiple products)
class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)                 # how many of this product
    price_at_purchase = db.Column(db.Float, nullable=False)                     # price locked at time of purchase
    
# CartItem 
class CartItem(db.Model):
    __tablename__ = "cart_items"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    
    product = db.relationship("Product", backref="cart_items")
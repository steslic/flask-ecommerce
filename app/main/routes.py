# Main Blueprint

from flask import Blueprint, jsonify, render_template, redirect, url_for, request, flash, abort, session, current_app
from flask_login import login_required, current_user
from app import db
from app.models import Order, OrderItem, Product, CartItem

from werkzeug.utils import secure_filename  
import os  
import uuid  

import cloudinary.uploader 

import stripe 
from dotenv import load_dotenv 

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Base directory
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Folder to store product images
UPLOAD_FOLDER = os.path.join(BASE_DIR, '..', 'static', 'uploads')

# Check that folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

main = Blueprint('main', __name__)
api = Blueprint("api", __name__, url_prefix="/api") 

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}  

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# / 
@main.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.home'))
    else:
        return redirect(url_for('auth.login'))

# Home
@main.route("/home")
@login_required
def home():
    return render_template("home.html")

# Products
@main.route("/products")
@login_required
def products():
    # Get search parameters from query string
    search_name = request.args.get("search_name", "").strip()
    search_description = request.args.get("search_description", "").strip()
    min_price = request.args.get("min_price", "").strip()
    max_price = request.args.get("max_price", "").strip()

    # Start with base query
    query = Product.query

    # Apply filters if values are provided
    if search_name:
        query = query.filter(Product.name.ilike(f"%{search_name}%"))
    if search_description:
        query = query.filter(Product.description.ilike(f"%{search_description}%"))
    if min_price:
        try:
            min_price_val = float(min_price)
            query = query.filter(Product.price >= min_price_val)
        except ValueError:
            pass
    if max_price:
        try:
            max_price_val = float(max_price)
            query = query.filter(Product.price <= max_price_val)
        except ValueError:
            pass

    # Execute query
    products_list = query.all()
    
    return render_template("products.html", products=products_list)

# Add to Cart
@main.route("/cart/add/<int:product_id>", methods=["POST"])
@login_required
def add_to_cart(product_id):
    cart = session.get("cart", [])

    # ensure cart is always a list of dicts
    new_cart = []
    for item in cart:
        if isinstance(item, str) or isinstance(item, int):
            # migrate old style cart (just product_id) into dict format
            new_cart.append({"product_id": int(item), "quantity": 1})
        else:
            new_cart.append(item)
    cart = new_cart

    # see if product already in cart
    found = False
    for item in cart:
        if item["product_id"] == product_id:
            item["quantity"] += 1
            found = True
            break

    if not found:
        cart.append({"product_id": product_id, "quantity": 1})

    session["cart"] = cart
    session.modified = True
    flash("Added to cart!", "success")
    return redirect(url_for("main.cart"))

# Remove from Cart
@main.route("/cart/remove/<int:product_id>", methods=["POST"])
@login_required
def remove_from_cart(product_id):
    cart = session.get("cart", [])
    
    # Keep only items that don't match the product_id
    cart = [item for item in cart if item["product_id"] != product_id]
    
    session["cart"] = cart
    session.modified = True
    flash("Item removed from cart!", "success")
    
    return redirect(url_for("main.cart"))

    if pid in cart:
        cart[pid] = quantity
        session["cart"] = cart
        session.modified = True
        flash("Cart updated!", "success")
    else:
        flash("Product not found in cart.", "warning")

    return redirect(url_for("main.cart"))

# Update Cart
@main.route("/cart/update/<int:product_id>", methods=["POST"])
def update_cart(product_id):
    cart = session.get("cart", [])

    new_quantity = request.form.get("quantity", type=int)

    if new_quantity is None or new_quantity < 1:
        flash("Invalid quantity.", "danger")
        return redirect(url_for("main.cart"))

    for item in cart:
        if item["product_id"] == product_id:
            item["quantity"] = new_quantity
            break

    session["cart"] = cart
    flash("Cart updated!", "success")
    return redirect(url_for("main.cart"))

# Cart 
@main.route("/cart")
@login_required
def cart():
    cart = session.get("cart", [])
    detailed_cart = []
    total = 0

    for item in cart:  # item is {"product_id": ..., "quantity": ...}
        product = Product.query.get(item["product_id"])
        if product:
            subtotal = product.price * item["quantity"]
            total += subtotal
            detailed_cart.append({
                "product": product,
                "quantity": item["quantity"],
                "subtotal": subtotal
            })

    return render_template("cart.html", cart=detailed_cart, total=total)

# Cart Checkout
@main.route("/cart/checkout", methods=["POST"])
@login_required
def checkout():
    # Clear the cart after checkout
    session.pop("cart", None)
    flash("Thank you for your purchase!", "success")
    return redirect(url_for("main.products"))

# Read Product (admin)
@login_required
@main.route("/admin/products")
def admin_products():
    if not current_user.is_admin:
        abort(403)

    products = Product.query.all()
    return render_template("admin/products.html", products=products)

# Create product (admin)
@main.route("/admin/products/create", methods=["GET", "POST"])
@login_required
def create_product():
    if not current_user.is_admin:
        abort(403)
        
    # NEW 
    UPLOAD_FOLDER = os.path.join(current_app.root_path, "static", "uploads")
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    if request.method == "POST":
        name = request.form['name']
        description = request.form['description'] or "None" # new
        price = request.form['price']
        stock = request.form['stock'] or 0 # new
        
        # NEW: Handle image upload
        image_file = request.files.get("image")
        # image_filename = None

        # if image_file and allowed_file(image_file.filename):
        #     ext = image_file.filename.rsplit(".", 1)[1].lower()
        #     unique_name = f"{uuid.uuid4().hex}.{ext}"  # avoid overwriting files
        #     image_path = os.path.join(UPLOAD_FOLDER, unique_name)
        #     image_file.save(image_path)
        #     image_filename = unique_name
        
        
        # # product = Product(name=name, price=price)
        # # NEW field
        # product = Product(name=name, description=description, price=price, stock=stock, image_filename=image_filename)
        image_url = None
        if image_file and allowed_file(image_file.filename):
            # Upload to Cloudinary and get the URL
            upload_result = cloudinary.uploader.upload(image_file, public_id=f"product_{uuid.uuid4().hex}")
            image_url = upload_result.get("secure_url")

        # Store URL instead of filename
        product = Product(
            name=name,
            description=description,
            price=price,
            stock=stock,
            image_filename=image_url  # stores full Cloudinary URL
        )

        db.session.add(product)
        db.session.commit()
        flash("Product created!", "success")
        return redirect(url_for("main.admin_products"))
    return render_template("admin/create_product.html")

# Edit product (admin)
@main.route("/admin/products/<int:product_id>/edit", methods=["GET", "POST"])
@login_required
def edit_product(product_id):
    if not current_user.is_admin:
        abort(403)

    product = Product.query.get_or_404(product_id)
    if request.method == "POST":
        product.name = request.form['name']
        product.description = request.form['description'] or "None" # new
        product.price = request.form['price']
        product.stock = request.form['stock'] or 0 
        
        # New image upload
        image_file = request.files.get("image")
        if image_file and allowed_file(image_file.filename):
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                image_file,
                public_id=f"product_{uuid.uuid4().hex}"
            )
            product.image_filename = upload_result.get("secure_url")
        
        db.session.commit()
        flash("Product updated!", "success")
        return redirect(url_for("main.admin_products"))
    return render_template("admin/edit_product.html", product=product)

# Delete product (admin)
@main.route("/admin/products/<int:product_id>/delete", methods=["POST"])
@login_required
def delete_product(product_id):
    if not current_user.is_admin:
        abort(403)

    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    flash("Product deleted!", "success")
    return redirect(url_for("main.admin_products"))


# --------#########----------

# ---------------------------
# Home
# ---------------------------
@api.route("/home")
@login_required
def api_home():
    return jsonify({"message": f"Welcome, {current_user.username}!"})

# ---------------------------
# Products API
# ---------------------------
# GET - Get all products (for public view)
@api.route("/products")
def api_get_products():
    search_name = request.args.get("search_name", "").strip()
    search_description = request.args.get("search_description", "").strip()
    min_price = request.args.get("min_price", "").strip()
    max_price = request.args.get("max_price", "").strip()

    query = Product.query
    if search_name: query = query.filter(Product.name.ilike(f"%{search_name}%"))
    if search_description: query = query.filter(Product.description.ilike(f"%{search_description}%"))
    if min_price:
        try: query = query.filter(Product.price >= float(min_price))
        except ValueError: pass
    if max_price:
        try: query = query.filter(Product.price <= float(max_price))
        except ValueError: pass

    products = query.all()
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "price": float(p.price),
        "stock": p.stock,
        "image_filename": p.image_filename
    } for p in products])

# POST - Create a new product (admin)
@api.route("/products", methods=["POST"])
@login_required
def api_create_product():
    if not current_user.is_admin:
        return jsonify({"error": "Forbidden"}), 403

    try:
        name = request.form.get("name")
        description = request.form.get("description") or "None"
        price = request.form.get("price")
        stock = request.form.get("stock") or 0

        if not name or not price:
            return jsonify({"error": "Missing name or price"}), 400

        # Handle image upload
        image_file = request.files.get("image")
        image_url = None
        if image_file:
            upload_result = cloudinary.uploader.upload(
                image_file,
                public_id=f"product_{uuid.uuid4().hex}"
            )
            image_url = upload_result.get("secure_url")

        # Create product in DB
        new_product = Product(
            name=name,
            description=description,
            price=price,
            stock=stock,
            image_filename=image_url
        )
        db.session.add(new_product)
        db.session.commit()

        return jsonify({"message": "Product created successfully", "product_id": new_product.id}), 201

    except Exception as e:
        print(f"Error creating product: {e}")
        return jsonify({"error": "Failed to create product"}), 500

# PUT - Edit/update a product (admin)
@api.route("/products/<int:product_id>", methods=["PUT", "PATCH"])
@login_required
def api_edit_product(product_id):
    if not current_user.is_admin:
        return jsonify({"error": "Forbidden"}), 403
    
    # Fetch the product from DB
    product = Product.query.get_or_404(product_id)

    # Read text fields 
    data = request.form
    
    # Update field if provided
    product.name = data.get("name", product.name)
    product.description = data.get("description", product.description or "None")
    product.price = float(data.get("price", product.price))
    product.stock = int(data.get("stock", product.stock or 0))

    # Image upload to Cloudinary
    image_file = request.files.get("image")
    if image_file:
        # Generate unique public_id
        public_id = f"product_{uuid.uuid4().hex}"
        upload_result = cloudinary.uploader.upload(image_file, public_id=public_id)
        product.image_filename = upload_result.get("secure_url")

    db.session.commit()
    return jsonify({
        "message": "Product updated",
        "product": {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock": product.stock,
            "image_filename": product.image_filename
        }
    })

# DELETE - Delete a product (admin)
@api.route("/products/<int:product_id>", methods=["DELETE"])
@login_required
def api_delete_product(product_id):
    if not current_user.is_admin:
        return jsonify({"error": "Forbidden"}), 403
    
    # Delete cart items referencing the product
    CartItem.query.filter_by(product_id=product_id).delete()

    # Delete the product
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"})

# GET - Get all products (admin)
@api.route("/admin/products")
@login_required
def api_admin_products():
    if not current_user.is_admin:
        return jsonify({"error": "Forbidden"}), 403

    products = Product.query.all()
    return jsonify({
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description or "None",
                "price": float(p.price),
                "stock": p.stock or 0,
                "image_filename": p.image_filename
            }
            for p in products
        ]
    })

# GET - Fetch one product (for editing, admin)
@api.route("/products/<int:product_id>", methods=["GET"])
@login_required
def api_get_product(product_id):
    if not current_user.is_admin:
        return jsonify({"error": "Forbidden"}), 403

    product = Product.query.get_or_404(product_id)
    return jsonify({
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "stock": product.stock,
        "image_filename": product.image_filename
    })

# ---------------------------
# Cart API
# ---------------------------
# GET - Get cart
@api.route("/cart")
@login_required
def api_get_cart():
    # Fetch all cart items
    cart_items = (
    CartItem.query
    .filter_by(user_id=current_user.id)
    .order_by(CartItem.id)  # ensures items appear in the order they were added
    .all()
    )

    detailed_cart = [] # cart with product details
    total = 0 # total price
    
    for item in cart_items:
        product = Product.query.get(item.product_id) # Fetch product from DB
        if not product:
            continue
        
        subtotal = product.price * item.quantity
        total += subtotal
        
        # Append detailed info 
        detailed_cart.append({
            "product": {
                "id": product.id,
                "name": product.name,
                "description": product.description,
                "price": float(product.price),
                "stock": product.stock,
                "image_filename": product.image_filename
            },
            "quantity": item.quantity,
            "subtotal": float(subtotal)
        })
    return jsonify({"cart": detailed_cart, "total": float(total)})

# POST - Add to cart
@api.route("/cart/add/<int:product_id>", methods=["POST"])
@login_required
def api_add_to_cart(product_id):
    # Look for an existing item
    cart_item = CartItem.query.filter_by(user_id=current_user.id, product_id=product_id).first()
    if cart_item:
        cart_item.quantity += 1 
    else:
        cart_item = CartItem(user_id=current_user.id, product_id=product_id, quantity=1)
        db.session.add(cart_item)
    db.session.commit()
    return jsonify({"message": "Added to cart"})

# POST - Remove from cart
@api.route("/cart/remove/<int:product_id>", methods=["POST"])
@login_required
def api_remove_from_cart(product_id):
    # Look for an existing item
    cart_item = CartItem.query.filter_by(user_id=current_user.id, product_id=product_id).first()
    if not cart_item:
        return jsonify({"error": "Item not found"}), 404
    db.session.delete(cart_item)
    db.session.commit()
    return jsonify({"message": "Removed from cart"})

# POST - Update cart
@api.route("/cart/update/<int:product_id>", methods=["POST"])
@login_required
def api_update_cart(product_id):
    data = request.get_json()
    new_quantity = int(data.get("quantity"))
    
    if new_quantity is None or new_quantity < 1:
        return jsonify({"error": "Invalid quantity"}), 400
    
    cart_item = CartItem.query.filter_by(user_id=current_user.id, product_id=product_id).first()
    if not cart_item:
        return jsonify({"error": "Item not found"}), 404
    
    cart_item.quantity = new_quantity
    db.session.commit()
    return jsonify({"message": "Cart updated"})

# POST - Checkout cart
@api.route("/cart/checkout", methods=["POST"])
@login_required
def api_checkout():
    # Fetch all cart items for current user
    cart_items = CartItem.query.filter_by(user_id=current_user.id).all()
    if not cart_items:
        return jsonify({"error": "Cart is empty"}), 400

    # Aggregate quantities per product to prevent double subtraction
    product_quantities = {}
    for item in cart_items:
        if item.product_id in product_quantities:
            product_quantities[item.product_id] += item.quantity
        else:
            product_quantities[item.product_id] = item.quantity

    # Validate stock for all products first
    for product_id, quantity in product_quantities.items():
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"error": f"Product {product_id} not found"}), 404
        if quantity > product.stock:
            return jsonify({
                "error": f"Not enough stock for '{product.name}'",
                "available": product.stock,
                "requested": quantity
            }), 400

    # Create a single order
    order = Order(user_id=current_user.id, status="Pending")
    db.session.add(order)
    db.session.flush()  # ensures order.id is available

    order_summary = []
    total = 0

    # Process each product
    for product_id, quantity in product_quantities.items():
        product = Product.query.get(product_id)
        subtotal = product.price * quantity
        total += subtotal

        # Create OrderItem
        order_item = OrderItem(
            order_id=order.id,
            product_id=product_id,
            quantity=quantity,
            price_at_purchase=product.price
        )
        db.session.add(order_item)

        # Deduct stock
        product.stock -= quantity

        # Add to order summary
        order_summary.append({
            "product": {
                "id": product.id,
                "name": product.name,
                "price": float(product.price)
            },
            "quantity": quantity,
            "subtotal": float(subtotal)
        })

    # Remove all cart items
    CartItem.query.filter_by(user_id=current_user.id).delete()

    db.session.commit()

    # Return order info
    return jsonify({
        "message": "Checkout complete",
        "order": {
            "id": order.id,
            "items": order_summary,
            "total": float(total),
            "status": order.status
        }
    }), 201

# GET - View order history (must be logged in)
@api.route("/orders")
@login_required
def api_get_orders():
    orders = (
        Order.query
        .filter_by(user_id=current_user.id)
        .order_by(Order.date_created.desc())
        .all()
    )

    if not orders:
        return jsonify({"orders": []})  # empty history

    order_history = []
    for order in orders:
        items = []
        total = 0

        for item in order.items:
            subtotal = item.price_at_purchase * item.quantity
            total += subtotal
            items.append({
                "product": {
                    "id": item.product.id,
                    "name": item.product.name,
                    "price": float(item.price_at_purchase)
                },
                "quantity": item.quantity,
                "subtotal": float(subtotal)
            })

        order_history.append({
            "id": order.id,
            "date": order.date_created.strftime("%Y-%m-%d %H:%M:%S"),
            "status": order.status,
            "total": float(total),
            "items": items
        })

    return jsonify({"orders": order_history}), 200

# GET - Count cart
@api.route("/cart/count")
@login_required
def api_get_cart_count():
    count = db.session.query(db.func.sum(CartItem.quantity)) \
        .filter_by(user_id=current_user.id).scalar() or 0
    return jsonify({"count": count})

# ---------------------------
# View all orders (admin)
# ---------------------------
@api.route("/admin/orders")
@login_required
def api_admin_orders():
    if not current_user.is_admin:
        return jsonify({"error": "Forbidden"}), 403

    # Fetch all orders, most recent first
    orders = Order.query.order_by(Order.date_created.desc()).all()
    
    order_list = []  # Store formatted order data

    for order in orders:
        items = []  # Store items in the order
        total = 0   # Total value of this order

        for item in order.items:  # item is an OrderItem instance
            # Fetch the corresponding product
            product = Product.query.get(item.product_id)
            if not product:
                continue  # skip if product no longer exists

            subtotal = item.quantity * item.price_at_purchase
            total += subtotal

            # Add item details to the items list            
            items.append({
                "product": {
                    "id": product.id,
                    "name": product.name,
                    "price": float(item.price_at_purchase)
                },
                "quantity": item.quantity,
                "subtotal": float(subtotal)
            })

        # Add order details including items and total
        order_list.append({
            "order_id": order.id,
            "user_id": order.user_id,
            "username": order.customer.username if order.customer else None,
            "status": order.status,
            "date_created": order.date_created.isoformat(),
            "total": float(total),
            "items": items
        })

    # Return all orders as JSON
    return jsonify({"orders": order_list})

# ---------------------------
# Update order status (admin)
# ---------------------------
@api.route("/admin/orders/<int:order_id>", methods=["PUT"])
@login_required
def api_update_order_status(order_id):
    if not current_user.is_admin:
        return jsonify({"error": "Forbidden"}), 403

    # Fetch the order by ID or return 404 if not found
    order = Order.query.get_or_404(order_id)

    # Get new status from request JSON
    data = request.get_json()
    new_status = data.get("status", "").capitalize()  # e.g., "Shipped"

    # Allowed status values
    allowed_statuses = ["Pending", "Shipped", "Delivered"]

    # Validate status
    if new_status not in allowed_statuses:
        return jsonify({"error": f"Invalid status. Allowed: {allowed_statuses}"}), 400

    # Update order status
    order.status = new_status
    db.session.commit()

    # Return success response with updated order info
    return jsonify({
        "message": "Order status updated successfully",
        "order": {
            "order_id": order.id,
            "user_id": order.user_id,
            "username": order.customer.username if order.customer else None,
            "status": order.status,
            "date_created": order.date_created.isoformat()
        }
    })

# ---------------------------
# Current user
# ---------------------------
@api.route("/current_user")
@login_required
def api_current_user():
    return jsonify({
        "username": current_user.username,
        "is_admin": current_user.is_admin
    })
    
# ---------------------------
# Stripe Payment Intent
# ---------------------------
@api.route("/create-payment-intent", methods=["POST"])
@login_required
def create_payment_intent():
    try:
        data = request.get_json()
        amount = data.get("amount")
        
        print("Received amount from frontend:", amount)  # DEBUG

        if not amount or amount <= 0:
            return jsonify({"error": "Invalid amount"}), 400

        # Create payment intent (amount in cents)
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # convert dollars to cents
            currency="usd",
            automatic_payment_methods={"enabled": True},
        )

        return jsonify({"clientSecret": intent.client_secret})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

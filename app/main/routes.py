# Main Blueprint

# app/main/routes.py

from flask import Blueprint, render_template, redirect, url_for, request, flash, abort, session
from flask_login import login_required, current_user
from app import db
from app.models import Product

main = Blueprint('main', __name__)

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
# @main.route("/products")
# @login_required
# def products():
#     # Fetch all products from the db
#     products_list = Product.query.all()
#     return render_template("products.html", products=products_list)

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

    if request.method == "POST":
        name = request.form['name']
        description = request.form['description'] or "None" # new
        price = request.form['price']
        stock = request.form['stock'] or 0 # new
        # product = Product(name=name, price=price)
        product = Product(name=name, description=description, price=price, stock=stock)

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
        product.stock = request.form['stock'] or 0 # new
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
# Main Blueprint

# app/main/routes.py

from flask import Blueprint, render_template, redirect, url_for, request, flash, abort
from flask_login import login_required, current_user
from app import db
from app.models import Product

main = Blueprint('main', __name__)

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

# Read Product (admin)
@login_required
@main.route("/admin/products")
def admin_products():
    if not current_user.is_admin:
        abort(403)

    products = Product.query.all()
    return render_template("admin/products.html", products=products)

# Create product
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

# Edit product
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

# Delete product
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
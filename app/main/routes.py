# New Blueprint

# app/main/routes.py
from flask import Blueprint, render_template
from flask_login import login_required, current_user

main = Blueprint('main', __name__)

@main.route("/home")
@login_required
def home():
    return render_template("home.html")

@main.route("/products")
@login_required
def products():
    products_list = Product.query.all()
    return render_template("products.html", products=products_list)
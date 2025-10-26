# Authentication Blueprint

from flask import Blueprint, jsonify, render_template, redirect, url_for, flash, request
from app import db, bcrypt
from app.models import User
from flask_login import login_user, logout_user, current_user, login_required

auth = Blueprint('auth', __name__)
api_auth = Blueprint("api_auth", __name__, url_prefix="/api/auth")

# Collect username, email, and password
# Hashes the password with bcrypt
# Creates a new User object and saves it to the db
# Shows a success message and redirects user to login page
@auth.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = bcrypt.generate_password_hash(request.form['password']).decode('utf-8')
        user = User(username=username, email=email, password=password)
        db.session.add(user)
        db.session.commit()
        flash('Account created!', 'success')
        return redirect(url_for('auth.login'))
    return render_template('register.html')

# Shows the login form
# Looks up the user by email 
# Verifies the password with bcrypt.check_password_hash
# If correct, logs in the user with login_user()
# If wrong, send an error message
@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('main.home'))
        else:
            flash('Login failed', 'danger')
    return render_template('login.html')

# Logout
@auth.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))


# -----------------------------

# -----------------------------
# Register (POST)
# -----------------------------
@api_auth.route("/register", methods=["POST"])
def api_register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    is_admin = data.get("is_admin", False)

    if not username or not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(username=username, email=email, password=hashed_pw, is_admin=is_admin)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Account created successfully"}), 201

# -----------------------------
# Login (POST)
# -----------------------------
@api_auth.route("/login", methods=["POST"])
def api_login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.password, password):
        login_user(user)  # works with session
        return jsonify({"message": "Login successful", "username": user.username, "email": user.email})
    else:
        return jsonify({"error": "Invalid credentials"}), 401

# -----------------------------
# Logout (POST)
# -----------------------------
@api_auth.route("/logout", methods=["POST"])
@login_required
def api_logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

# -----------------------------
# Current User (GET)
# -----------------------------
@api_auth.route("/user", methods=["GET"])
def api_current_user():
    if current_user.is_authenticated:
        return jsonify({
            "user": {  
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
            }
        })
    else:
        return jsonify({"user": None})

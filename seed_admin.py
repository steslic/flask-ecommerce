from app import create_app, db, bcrypt
from app.models import User

app = create_app()

with app.app_context():
    # Check if admin already exists
    existing_admin = User.query.filter_by(email="admin@admin.com").first()
    
    if not existing_admin:
        # Create admin user with bcrypt-hashed password
        admin = User(
            username="admin",
            email="admin@admin.com",
            password=bcrypt.generate_password_hash("admin").decode('utf-8'),
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()
        print("Admin user created successfully!")
    else:
        print("Admin user already exists.")

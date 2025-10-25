from app import create_app

app = create_app()

# Render: gunicorn wsgi:app
# Run Flask App

from app import create_app, db

app = creat_app()

if __name__ == '__main__':
    app.run(debug=True)

    
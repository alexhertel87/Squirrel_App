from app.models import db, User
from app.demo_account import ensure_demo_user


# Adds a demo user, you can add other users here if you want
def seed_users():
    ensure_demo_user()
    users = [
        {
            'username': 'marnie',
            'email': 'marnie@aa.io',
            'password': 'password',
        },
        {
            'username': 'bobbie',
            'email': 'bobbie@aa.io',
            'password': 'password',
        },
        {
            'username': 'ahertel87',
            'email': 'alex.hertel87@gmail.com',
            'password': 'password',
        },
    ]

    for user_data in users:
        user = User.query.filter(User.email == user_data['email']).first()
        if user:
            user.username = user_data['username']
            user.password = user_data['password']
        else:
            db.session.add(User(**user_data))

    db.session.commit()


# Uses a raw SQL query to TRUNCATE the users table.
# SQLAlchemy doesn't have a built in function to do this
# TRUNCATE Removes all the data from the table, and RESET IDENTITY
# resets the auto incrementing primary key, CASCADE deletes any
# dependent entities
def undo_users():
    db.session.execute('TRUNCATE users RESTART IDENTITY CASCADE;')
    db.session.commit()

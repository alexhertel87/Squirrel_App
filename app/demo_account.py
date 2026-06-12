from app.models import User, db


DEMO_USERNAME = 'squirrel_demo'
DEMO_EMAIL = 'demo@squirrel.app'
DEMO_PASSWORD = 'SquirrelDemo2026!'


def _available_demo_username():
    username = DEMO_USERNAME
    suffix = 2

    while User.query.filter(User.username == username).first():
        username = f'{DEMO_USERNAME}_{suffix}'
        suffix += 1

    return username


def ensure_demo_user():
    demo = User.query.filter(User.email == DEMO_EMAIL).first()

    if demo:
        changed = False
        username_taken = User.query.filter(
            User.username == DEMO_USERNAME,
            User.id != demo.id
        ).first()

        if demo.username != DEMO_USERNAME and not username_taken:
            demo.username = DEMO_USERNAME
            changed = True

        if not demo.check_password(DEMO_PASSWORD):
            demo.password = DEMO_PASSWORD
            changed = True

        if changed:
            db.session.commit()

        return demo

    demo = User(
        username=_available_demo_username(),
        email=DEMO_EMAIL,
        password=DEMO_PASSWORD
    )
    db.session.add(demo)
    db.session.commit()

    return demo

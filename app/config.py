import os


database_url = os.environ.get('DATABASE_URL', 'sqlite:///dev.db')


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # SQLAlchemy 1.4 no longer supports url strings that start with 'postgres'
    # (only 'postgresql') but heroku's postgres add-on automatically sets the
    # url in the hidden config vars to start with postgres.
    # so the connection uri must be updated here
    SQLALCHEMY_DATABASE_URI = database_url.replace(
        'postgres://', 'postgresql://', 1)
    SQLALCHEMY_ECHO = True

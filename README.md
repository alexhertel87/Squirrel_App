# Squirrel!


Squirrel! is a medication log and tracker, as well as a to-do/task list that is geared towards aiding the ADHD and neurodivergant community with remembering to take their medications and complete everyday tasks.

[Live Heroku App](https://https://squirrelapp.herokuapp.com/)

To run the project locally, follow the instructions below.
1. Clone the repo.
2. Run `flask run` in the root directory after having run "pipenv shell" to enter the virtual environment.
3. Run `npm start`  in the frontend 'react-app' folder to launch the front-end server.
4. Navigate to http://localhost:3000/ and begin using the app!

## Links
[Database Schema and Backend Routes](https://github.com/alexhertel87/Squirrel_App/wiki/Database-Schema)

[MVP Feature List](https://github.com/alexhertel87/Squirrel_App/wiki/MVP-Feature-List)

[Frontend Routes](https://github.com/alexhertel87/Squirrel_App/wiki/Frontend-Routes)

## Application Stack
Squirrel! is built on a Flask-SQLAlchemy backend and a Redux/React frontend stack. On my backend I use Python-Flask and SQLAlchemy to work with my database, and on the frontend React and Redux.


## Fututre Features
* I will add the ability to "check" off completed tasks and add them to an additional "Completed Tasks" table, as they are removed from the "To-Do" list.
* Users will be able to check a box next to their currently-prescribed medications that (that will un-check each day) and as they are checked, that medication will be added to a separate table called "Medication Log" that will display whether the user successfully took that medication on that given day.
* Users will also be able to set reminders that will notify them to take their medications each morning


import sqlite3
import csv

database_name = 'edu.db'
original_work_csv = 'work.csv'

def create_database():
    connection = sqlite3.connect(database_name)

    cursor = connection.cursor()

    cursor.executescript(
        """
    -- Create the 'Student' table
CREATE TABLE IF NOT EXISTS Student (
    ID INTEGER PRIMARY KEY,
    nationality DECIMAL(2,1) NOT NULL,
    gender TEXT NOT NULL
);

-- Create the 'Time' table
CREATE TABLE IF NOT EXISTS Time (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    eventDate DATE NOT NULL,
    term TEXT NOT NULL,
    examDate DATE NOT NULL,
    semester TEXT NOT NULL
);

-- Create the 'Course' table
CREATE TABLE IF NOT EXISTS Course (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    credits DECIMAL(3,1) NOT NULL
);

-- Create the 'Transaction' table
CREATE TABLE IF NOT EXISTS "Transaction"(
    transactionID INTEGER PRIMARY KEY,
    unitID INTEGER NOT NULL,
    id INTEGER NOT NULL,
    state BOOLEAN NOT NULL,
    grade DECIMAL(2,1) NOT NULL,
    student_ID INTEGER NOT NULL,
    time_ID INTEGER NOT NULL,
    course_ID INTEGER NOT NULL,
    ugrade DECIMAL(2,1) NOT NULL,
    degreeID INTEGER NOT NULL,
    enrollmentID INTEGER NOT NULL,
    degree BOOLEAN NOT NULL,
    FOREIGN KEY (student_ID) REFERENCES Student(ID),
    FOREIGN KEY (time_ID) REFERENCES Time(ID),
    FOREIGN KEY (course_ID) REFERENCES Course(ID)
);
    """
    )
    
    cursor.execute("""
    CREATE UNIQUE INDEX unique_event_exam_dates ON Time(eventDate, examDate);
    """)
    cursor.execute("""
    CREATE UNIQUE INDEX unique_name_credits ON Course(name, credits);
    """)

    # Save changes
    connection.commit()

    connection.close()

# Execute a specific command s
def execute_command(s):
    connection = sqlite3.connect(database_name)

    cursor = connection.cursor()

    cursor.execute(s)
    print(cursor.fetchall())

    connection.commit()

    connection.close()


def fill_course_table():
    connection = sqlite3.connect(database_name)

    cursor = connection.cursor()

    with open(original_work_csv, "r") as file:
        reader = csv.DictReader(file)

        for row in reader:
            try:
                cursor.execute(
                    """
                INSERT INTO Course (name, credits) VALUES (?, ?);
                """,
                    (row["course"], row["credits"]),
                )
            except sqlite3.Error as e:
                print("An error occured", e)

    connection.commit()
    connection.close()


def fill_time_table():
    connection = sqlite3.connect(database_name)

    cursor = connection.cursor()

    with open(original_work_csv, "r") as file:
        reader = csv.DictReader(file)

        for row in reader:
            try:
                cursor.execute(
                    """
                INSERT INTO Time (eventDate, term, examDate, semester)
                    VALUES (?, ?, ?, ?);
                """,
                    (row["eventDate"], row["term"], row["exam_date"], row["semester"]),
                )
            except sqlite3.Error as e:
                print("An error occured", e)

    connection.commit()
    connection.close()


def fill_student_table():
    connection = sqlite3.connect(database_name)

    cursor = connection.cursor()

    with open(original_work_csv, "r") as file:
        reader = csv.DictReader(file)

        for row in reader:
            try:
                cursor.execute(
                    """
                INSERT INTO Student (ID, nationality, gender)
                    VALUES (?, ?, ?);
                """,
                    (row["subjectId"], row["nationality"], row["gender"]),
                )
            except sqlite3.Error as e:
                print("An error occured", e)

    connection.commit()
    connection.close()


def fill_transaction_table():
    connection = sqlite3.connect(database_name)

    cursor = connection.cursor()

    with open(original_work_csv, "r") as file:
        reader = csv.DictReader(file)

        for row in reader:
            try:
                state = False
                if row["state"] == "Bestanden":
                    state = True
                degree = False
                if row["degree"] == "Master of Science":
                    degree = True

                # Get time_ID
                cursor.execute(
                    "SELECT ID FROM Time WHERE eventDate = ? AND examDate = ?;",
                    (row["eventDate"], row["exam_date"]),
                )
                timeid = cursor.fetchone()[0]

                # Get course_ID
                cursor.execute(
                    "SELECT ID FROM Course WHERE name = ? AND credits = ?;",
                    (row["course"], row["credits"]),
                )
                courseid = cursor.fetchone()[0]

                cursor.execute(
                    """
                INSERT INTO "Transaction" (
                    transactionID, unitID, id, state, grade, student_ID, time_ID, course_ID, 
                    ugrade, degreeID, enrollmentID, degree
                )
                VALUES (
                    ?,         -- transactionID
                    ?,       -- unitID
                    ?,      -- id
                    ?,         -- state
                    ?,       -- grade
                    ?,         -- student_ID
                    ?,         -- time_ID
                    ?,         -- course_ID
                    ?,       -- ugrade
                    ?,       -- degreeID
                    ?,       -- enrollmentID
                    ?          -- degree
                );
                """,
                    (
                        row["transactionID"],
                        row["unitId"],
                        row["id"],
                        state,
                        row["grade"],
                        row["subjectId"],
                        timeid,
                        courseid,
                        row["u_grade"],
                        row["degreeId"],
                        row["enrollmentId"],
                        degree,
                    ),
                )
            except sqlite3.Error as e:
                print("An error occured", e)

    connection.commit()
    connection.close()

# execute_command("select count(*) from Course")
# execute_command('select * from Course where name="Programmierung"')

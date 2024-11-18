import os
import sqlite3

options = {
        'dropdown1': ['All students', 'Top 20 students (mean grade)', 'Bottom 20 students (mean grade)'],
        'dropdown2': ['Abstraction 1', 'Abstraction 2'],
        'dropdown3': ['Mean grade']
    }

commands = {
        'dropdown1': [
"""
WITH student_mean_grades AS (
    SELECT
        student_ID,
        AVG(grade) AS mean_grade
    FROM
        "Transaction"
    GROUP BY
        student_ID
),
ranked_students AS (
    SELECT
        student_ID,
        mean_grade,
        COUNT(*) OVER () AS total_students
    FROM
        student_mean_grades
),
all_students AS (
    SELECT
        AVG(mean_grade) AS overall_mean_grade
    FROM
        student_mean_grades
)
    SELECT 
        overall_mean_grade AS overall_mean_grade
    FROM 
        all_students;
""", 

"""WITH student_mean_grades AS (
    SELECT
        student_ID,
        AVG(grade) AS mean_grade
    FROM
        "Transaction"
    GROUP BY
        student_ID
),
ranked_students AS (
    SELECT
        student_ID,
        mean_grade,
        ROW_NUMBER() OVER (ORDER BY mean_grade ASC) AS rank_asc,
        COUNT(*) OVER () AS total_students
    FROM
        student_mean_grades
),
top_20_percent_students AS (
    SELECT
        student_ID,
        mean_grade
    FROM
        ranked_students
    WHERE
        rank_asc <= total_students * 0.2
)
SELECT
    AVG(mean_grade) AS top_20_percent_mean_grade
FROM
    top_20_percent_students;
""", 

"""
WITH student_mean_grades AS (
    SELECT
        student_ID,
        AVG(grade) AS mean_grade
    FROM
        "Transaction"
    GROUP BY
        student_ID
),
ranked_students AS (
    SELECT
        student_ID,
        mean_grade,
        ROW_NUMBER() OVER (ORDER BY mean_grade DESC) AS rank_desc,
        COUNT(*) OVER () AS total_students
    FROM
        student_mean_grades
),
bottom_20_percent_students AS (
    SELECT
        student_ID,
        mean_grade
    FROM
        ranked_students
    WHERE
        rank_desc <= total_students * 0.2
)
    SELECT 
        AVG(mean_grade) AS bottom_20_percent_mean_grade 
    FROM 
        bottom_20_percent_students;
"""],
        'dropdown2': ['Abstraction 1', 'Abstraction 2'],
        'dropdown3': ['Mean grade']
    }

column_values = os.getenv('COLUMN_VALUES', '').split(',')
column_index = os.getenv('COLUMN_INDEX', '')

print(f"Column {column_index} Values: {column_values}")

# Example usage of the values
for value in column_values:
    print(f"Processing value from column {column_index}: {value}")

#
# Functions
#

# Execute a specific command s
def execute_command(s):
    db_path = os.path.join(os.path.dirname(__file__), '../edu.db')
    connection = sqlite3.connect(db_path)

    cursor = connection.cursor()
 
    cursor.execute(s)
    print("Result:", cursor.fetchall())

    connection.commit()

    connection.close()
    
    

execute_command(commands['dropdown1'][options['dropdown1'].index(column_values[0])])

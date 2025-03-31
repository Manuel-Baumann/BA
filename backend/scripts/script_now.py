"""

import pandas as pd
from collections import Counter

# Read CSV file
df = pd.read_csv("../csv/edu-format.csv")

# Count occurrences of unique courses
course_counts = Counter(df["eventDate"])  # Assuming 'course' column exists

# Sort courses by occurrence count (descending)
sorted_courses = sorted(course_counts.items(), key=lambda x: x[0], reverse=True)

# Write results to a text file
output_file = "course_counts.txt"
with open(output_file, "w", encoding="utf-8") as f:
    for course, count in sorted_courses:
        f.write(f"{course}: {count}\n")

print(f"Course counts written to {output_file}")


"""

"""
import math
import pandas as pd

# Read the CSV file
df = pd.read_csv("../csv/edu-format.csv")

# Define the two columns to find unique combinations
col1 = "subjectId"
col2 = "nationality"


# Count unique occurrences
unique_combinations = df.groupby([col1, col2]).size().reset_index(name="count")

# Sort by the first column and then by count (descending)
unique_combinations = unique_combinations.sort_values(
    by=[col1, "count"], ascending=[True, False]
)

# Write to a file
output_file = "course_counts.txt"
with open(output_file, "w", encoding="utf-8") as f:
    for _, row in unique_combinations.iterrows():
        f.write(f"{row[col1]} - {row[col2]}: {row['count']}\n")

print(f"Unique combinations with counts saved to {output_file}.")

ceu = 0
cnon = 0
sonst = 0
for _, row in unique_combinations.iterrows():
    if math.isclose(row[col2], 1.0, abs_tol=1e-9):
        ceu += 1
    elif math.isclose(row[col2], 3.0, abs_tol=1e-9):
        cnon += 1
    else:
        sonst += 1
        print(row[col2])
print(ceu, cnon, sonst)

"""
"""
import pandas as pd


def analyze_csv(filename):
    # Load CSV
    df = pd.read_csv(filename)

    # Calculate mean grade
    mean_grade = df["grade"].mean()

    # Count unique occurrences in columns
    unique_event_ids = df["eventId"].nunique()
    unique_student_ids = df["subjectId"].nunique()
    unique_courses = df["course"].nunique()

    # Count occurrences of courses
    course_counts = df["course"].value_counts()

    # Count courses with low occurrences
    less_than_10 = (course_counts < 10).sum()
    less_than_20 = (course_counts < 20).sum()
    less_than_30 = (course_counts < 30).sum()

    # Count unique occurrences in categorical columns
    gender_counts = df["gender"].value_counts()
    nationality_counts = df["nationality"].value_counts()
    degree_counts = df["degree"].value_counts()

    # Print results
    print(f"Mean Grade: {mean_grade:.2f}")
    print(f"Unique Event IDs: {unique_event_ids}")
    print(f"Unique Student IDs: {unique_student_ids}")
    print(f"Unique Courses: {unique_courses}")
    print(f"Courses occurring less than 10 times: {less_than_10}")
    print(f"Courses occurring less than 20 times: {less_than_20}")
    print(f"Courses occurring less than 30 times: {less_than_30}\n")

    print("Unique Genders & Counts:\n", gender_counts)
    print("\nUnique Nationalities & Counts:\n", nationality_counts)
    print("\nUnique Degrees & Counts:\n", degree_counts)


# Example usage
analyze_csv("../csv/work_renamed.csv")
"""

import pandas as pd

def analyze_edu_format_csv(file_path):
    # Read the CSV file
    df = pd.read_csv(file_path)

    # Get unique values in 'state' and their frequencies
    state_counts = df['state'].value_counts()
    print("Unique values in 'state' and their frequencies:")
    print(state_counts)
    print("\n")

    # Calculate the average grade, ignoring 0.0 values
    valid_grades = df[df['grade'] != 0.0]['grade']
    avg_grade = valid_grades.mean()
    print(f"Average grade (excluding 0.0 values): {avg_grade:.2f}\n")

    # Get unique (gender, nationality) pairs per subjectId
    unique_pairs = df.groupby("subjectId")[["gender", "nationality"]].first()

    # Count occurrences of each (gender, nationality) pair
    pair_counts = unique_pairs.value_counts()
    print("Gender-Nationality pair occurrences (counted per unique subjectId):")
    print(pair_counts)

# Run the function with the given file path
analyze_edu_format_csv('../csv/work_renamed.csv')



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

import pandas as pd

# Read the CSV file
df = pd.read_csv("../csv/edu-format.csv")

# Define the two columns to find unique combinations
col1 = "eventDate"
col2 = "term"


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

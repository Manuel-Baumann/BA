import csv
import matplotlib.pyplot as plt
from collections import Counter

# Step 1: Read the CSV file and extract 'course' column values
def read_csv(file_path):
    courses = []
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if 'course' in row:  # Ensure the column exists
                    courses.append(row['course'])
                else:
                    print("Error: Column 'course' not found in the CSV file.")
                    return None
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return None
    return courses

# Step 2: Count occurrences of each unique course, sort, and filter
def count_courses(courses):
    course_counts = Counter(courses)
    # Filter out courses that appear less than 30 times
    filtered_counts = {course: count for course, count in course_counts.items() if count >= 30}
    # Sort by occurrence (highest first)
    sorted_counts = dict(sorted(filtered_counts.items(), key=lambda item: item[1], reverse=True))
    return sorted_counts

# Step 3: Create and save a bar chart
def plot_course_distribution(course_counts):
    if not course_counts:
        print("No sufficient course data available to plot.")
        return

    counts = list(course_counts.values())

    plt.figure(figsize=(10, 6))
    plt.bar(range(len(counts)), counts, color='skyblue')  # Use indices instead of course names
    plt.xlabel('Courses')
    plt.ylabel('Frequency of occurrence')
    plt.title('Course Distribution (f>=30)')
    plt.grid(axis='y', linestyle='--', alpha=0.7)

    # Hide x-axis labels
    plt.xticks([])

    # Save the plot as an image
    plt.savefig('course_distribution.png', dpi=300, bbox_inches='tight')
    plt.show()

# Main function
def main():
    file_path = "../csv/work_renamed.csv"
    courses = read_csv(file_path)
    
    if courses is None:
        return  # Exit if file not found or column missing
    
    course_counts = count_courses(courses)
    plot_course_distribution(course_counts)

# Run the script
if __name__ == "__main__":
    main()

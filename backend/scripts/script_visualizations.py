import csv
import matplotlib.pyplot as plt
from collections import Counter


# Step 1: Read the CSV file and extract 'term' column values
def read_csv(file_path):
    terms = []
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                if "term" in row:  # Ensure the column exists
                    terms.append(row["term"])
                else:
                    print("Error: Column 'term' not found in the CSV file.")
                    return None
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return None
    return terms


# Step 2: Count occurrences of each unique 'term' value and filter
def count_and_filter_terms(terms, min_occurrences=20):
    term_counts = Counter(terms)  # Count occurrences
    filtered_counts = {
        term: count for term, count in term_counts.items() if count >= min_occurrences
    }  # Filter out terms with < 20 occurrences
    sorted_counts = dict(
        sorted(filtered_counts.items(), key=lambda item: item[0])
    )  # Sort by term (ascending)
    return sorted_counts


# Step 3: Create and save a sorted bar chart
def plot_term_distribution(term_counts):
    if not term_counts:
        print("No term data available to plot.")
        return

    terms = list(term_counts.keys())  # Sorted x-axis values
    counts = list(term_counts.values())  # Corresponding y-axis values

    plt.figure(figsize=(10, 6))
    plt.bar(terms, counts, color="skyblue")
    plt.xlabel("Term")
    plt.ylabel("Number of Occurrences")
    plt.title(
        "Distribution of number of courses in different terms with at least 20 courses"
    )
    plt.xticks(rotation=45, ha="right")  # Rotate labels for better readability
    plt.grid(axis="y", linestyle="--", alpha=0.7)

    # Save the plot as an image
    plt.savefig("term_distribution_filtered.png", dpi=300, bbox_inches="tight")
    plt.show()


# Main function
def main():
    file_path = "../csv/edu-format.csv"
    terms = read_csv(file_path)

    if terms is None:
        return  # Exit if file not found or column missing

    term_counts = count_and_filter_terms(terms, min_occurrences=20)
    plot_term_distribution(term_counts)


# Run the script
if __name__ == "__main__":
    main()

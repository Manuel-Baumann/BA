import matplotlib.pyplot as plt
import numpy as np

# Data
ages = [22, 24, 26, 27, 28, 56, 59]
frequencies = [2, 2, 1, 1, 2, 1, 1]

# Create artificial x positions (evenly spaced categories)
x_positions = np.arange(len(ages))  # [0, 1, 2, 3, 4, 5, 6]

# Create the bar chart using artificial positions
plt.figure(figsize=(8, 5))
plt.bar(x_positions, frequencies, color="skyblue")

# Set custom x-axis labels to match the actual age values
plt.xticks(x_positions, ages)

# Add labels and title
plt.xlabel("Age")
plt.ylabel("Frequency")
plt.title("Age Distribution")

# Ensure the y-axis only shows 1 and 2 (no decimals)
plt.yticks([1, 2])

# Show grid lines for better readability
plt.grid(axis="y", linestyle="--", alpha=0.7)

# Save and display the chart
plt.savefig("age_distribution.png", dpi=300, bbox_inches="tight")
plt.show()

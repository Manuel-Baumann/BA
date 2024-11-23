import os
from execute_script import execute_script_func

options = {
    "dropdown1": ["All students", "Only students who graduated at RWTH"],
    "dropdown2": ["Prefiltered (no 0 credits and passed)", "All data"],
    "dropdown3": ["Courses", "Grades"],
    "dropdown4": ["Year", "Semester"],
    "dropdown5": ["All courses", "Only not passed courses"],
    "dropdown6": ["Frequent Itemsets", "Association Rules", "Sequence Patterns"],
}

commands = {
    "dropdown1": [],
    "dropdown2": ["Abstraction 1", "Abstraction 2"],
    "dropdown3": ["Mean grade"],
}

try:
    values = os.getenv("VALUES", "").split(",")
    column_values = os.getenv("COLUMN_VALUES", "").split(",")
    column_index = os.getenv("COLUMN_INDEX", "")
    slider_min = os.getenv("SLIDER_MIN", "")
    slider_max = os.getenv("SLIDER_MAX", "")
    number_of_output_lines = (
        os.getenv("NUMBER_OF_OUTPUT_LINES", "").replace("[", "").replace("]", "")
    )
    # Example usage of the values

    #
    # Functions
    #
    # Execute script based on chosen dropdown values
    bool_all, bool_courses, bool_year, bool_all_courses = (
        True,
        True,
        True,
        True,
    )
    insights = 0
    sets_rules_patterns = 0

    if values[0] == "Only students who graduated at RWTH":
        bool_all = False
    if values[1] == "Grades":
        bool_courses = False
    if values[2] == "Semester":
        bool_year = False
    if values[3] == "Only not passed courses":
        bool_all_courses = False
    if values[4] == "Closed":
        insights = 1
    if values[4] == "Maximal":
        insights = 2
    if values[-1] == "Association Rules":
        sets_rules_patterns = 1
    if values[-1] == "Sequence Patterns":
        sets_rules_patterns = 2

    # Create the output directory if it doesn't exist
    directory_path = "Results"
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)

    execute_script_func(
        bool_all,
        bool_courses,
        bool_year,
        bool_all_courses,
        insights,
        sets_rules_patterns,
        int(slider_min),
        int(slider_max),
        column_values,
        int(number_of_output_lines),
    )

except Exception as e:
    print(f"Error in script: {str(e)}")
    raise

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
    bool_use_params = os.getenv("BOOL_USE_PARAMS")
    min_sup = os.getenv("MIN_SUP")
    min_conf = os.getenv("MIN_CONF")
    checkbox_data = os.getenv("CHECKBOX_DATA")
    students_basis_bool = os.getenv("STUDENTS_BASIS_BOOL")
    bins_bool = os.getenv("BINS_BOOL")
    bins_array = os.getenv("BINS_ARRAY")
    only_mandatory_boolean = os.getenv("ONLY_MANDATORY_BOOLEAN")
    semester_min = os.getenv("SEMESTER_MIN", "")
    semester_max = os.getenv("SEMESTER_MAX", "")
    bool_filter_fi_results = os.getenv("BOOL_FILTER_FI_RESULTS")
    bool_filter_ar_results = os.getenv("BOOL_FILTER_AR_RESULTS")

    # Example usage of the values

    #
    # Functions
    #
    # Execute script based on chosen dropdown values
    bool_all, bool_courses, bool_year = (
        True,
        True,
        True,
    )
    normal_closed_maximal = 0
    sets_rules_patterns = 0
    exams_all_passed_failed = 0

    if column_values[0] == "Only students who graduated at RWTH":
        bool_all = False
    if values[0] == "Grades":
        bool_courses = False
    if values[1] == "Semester":
        bool_year = False
    if column_values[1] == "Only failed exams":
        exams_all_passed_failed = 2
    if column_values[1] == "Only passed exams":
        exams_all_passed_failed = 1
    if values[2] == "Closed":
        normal_closed_maximal = 1
    if values[2] == "Maximal":
        normal_closed_maximal = 2
    if values[3] == "Association Rules":
        sets_rules_patterns = 1
    if values[3] == "Sequence Patterns":
        sets_rules_patterns = 2

    # Create the output directory if it doesn't exist
    directory_path = "Results"
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)

    execute_script_func(
        bool_all,
        bool_courses,
        bool_year,
        exams_all_passed_failed,
        normal_closed_maximal,
        sets_rules_patterns,
        int(slider_min),
        int(slider_max),
        column_values,
        int(number_of_output_lines),
        bool_use_params,
        min_sup,
        min_conf,
        checkbox_data,
        students_basis_bool,
        bins_bool,
        bins_array,
        only_mandatory_boolean,
        semester_min,
        semester_max,
        bool_filter_fi_results,
        bool_filter_ar_results
    )

except Exception as e:
    print(f"Error in script: {str(e)}")
    raise

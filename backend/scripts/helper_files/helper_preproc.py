import pandas as pd
import csv
from .definitions import (
    create_aggregate_grades,
    check_if_mandatory,
    aggregate_courses,
    not_passed_prefix,
    mandatory_courses_arr,
)


def preprocess_csv(
    csv,
    bins_bool,
    fe_bool_courses,
    fe_bool_all_students,
    fe_slider_min,
    fe_slider_max,
    fe_bool_year,
    fe_exams_all_passed_failed,
    fe_column_values,
    fe_checkbox_data,
    fe_bins_array,
    fe_only_mandatory_boolean,
    fe_semester_min,
    fe_semester_max,
):
    work = pd.read_csv(csv)

    # Filter for column values
    if fe_column_values[2] != "All":
        work = work[work["gender"] == fe_column_values[2]]
    if fe_column_values[3] != "All":
        work = work[work["nationality"] == float(fe_column_values[3].split()[0])]
    if fe_column_values[4] != "All":
        work = work[work["universityId"] == float(fe_column_values[4].split()[0])]
    if fe_column_values[5] != "All":
        work = work[work["degree"] == fe_column_values[5]]
    if fe_column_values[6] != "All":
        work = work[work["subject"] == fe_column_values[6]]

    # Only students who passed all courses at RWTH
    if not fe_bool_all_students:
        in_between_step = work[
            (work["grade"] <= 4.0) & (work["course"].isin(mandatory_courses_arr))
        ]
        courses_count = in_between_step["subjectId"].value_counts()
        students_with_high_counts = courses_count[courses_count >= 18].index
        students_passed_at_rwth = in_between_step[
            in_between_step["subjectId"].isin(students_with_high_counts)
        ]

        in_between_get_included_ids = (
            students_passed_at_rwth.groupby("subjectId")["grade"].mean().reset_index()
        )
        included_ids = in_between_get_included_ids["subjectId"].tolist()
        # Only students who passed all mandatory courses at RWTH
        work = work[work["subjectId"].isin(included_ids)]

    # Filtering out 0 credits that passed
    work = work[((work["credits"] != 0) | (work["state"] != "Bestanden"))]

    # Filter for all checkboxes that are set: fe_checkbox_data
    remaining_subjects = filter_for_checkboxes(work, fe_checkbox_data)
    if len(remaining_subjects) == 0:
        print("WARNING: Empty dataset after filtering for checkboxes!")
        return
    work = work[work["subjectId"].isin(remaining_subjects)]

    # Filter for semester range
    work = work[
        (work["semester"] >= int(fe_semester_min))
        & (work["semester"] <= int(fe_semester_max))
    ]
    print("Semester range:", fe_semester_min, "to", fe_semester_max)

    # Add prefix (not passed) to all courses that have not been passed
    if work.shape[0] > 0:
        work["course"] = work.apply(rename_course, axis=1)

    # Extract means scores
    mean_scores = work.groupby("subjectId")["grade"].mean().reset_index()
    mean_scores.rename(columns={"grade": "mean_score"}, inplace=True)

    mean_range = mean_scores[
        mean_scores["mean_score"]
        >= mean_scores["mean_score"].quantile(fe_slider_min / 100)
    ]
    mean_range = mean_range[
        mean_scores["mean_score"]
        < mean_scores["mean_score"].quantile(fe_slider_max / 100)
    ]

    if fe_bool_year:
        work["semester"] = work["semester"].apply(rename_semester_to_year)

    # Filter for mean grade range
    work = pd.DataFrame((work[work["subjectId"].isin(mean_range["subjectId"])]))

    if fe_exams_all_passed_failed == 1:
        work = work[work["state"] == "Bestanden"]
    elif fe_exams_all_passed_failed == 2:
        work = work[work["state"] != "Bestanden"]

    print("Unique students in used dataset:", mean_range["subjectId"].nunique())

    print("Number of courses:", work.shape[0])
    if mean_range["subjectId"].nunique() > 0:
        print(
            "Mean number of courses taken by a student:",
            work.shape[0] / mean_range["subjectId"].nunique(),
        )
    print("Mean grade of mean grade of all students:", mean_range["mean_score"].mean())

    # Apply bins and categorise into mandatory/optional
    if bins_bool:
        if fe_bool_courses:
            # Will never be reached since bins_bool is always false if courses were picked
            work["course"] = work["course"].replace(aggregate_courses)
        else:
            aggregate_grades = create_aggregate_grades(fe_bins_array)
            work["grade"] = work["grade"].apply(lambda x: aggregate_grades.get(x, x))
    if fe_only_mandatory_boolean:
        if fe_bool_courses:
            work["course"] = work["course"].apply(
                lambda course: (
                    "Mandatory" if check_if_mandatory(course) else "Optional"
                )
            )
        else:
            work["grade"] = work.apply(
                lambda row: (
                    ("Mandatory: " + str(row["grade"]))
                    if check_if_mandatory(row["course"])
                    else ("Optional: " + str(row["grade"]))
                ),
                axis=1,
            )
    return work


# Even semesters correspond to summer -> substract one from even to make years
def rename_semester_to_year(entry):
    entry = int(entry)
    if entry % 2 == 0:
        return entry - 1
    return entry


# Function to add Prefix (not passed)
def rename_course(row):
    if row["state"] == "Bestanden":
        return row["course"]
    else:
        return not_passed_prefix + row["course"]


def determine_params_automatically(
    fe_sets_rules_patterns,
    fe_bool_year,
    fe_bool_passed_courses,
    fe_slider_min,
    fe_slider_max,
):
    fe_min_sup = 0.8
    fe_min_conf = 0.1
    if not fe_bool_year:
        if not fe_bool_passed_courses:
            fe_min_sup = 0.05
            if fe_slider_min > 0.8:
                fe_min_sup = 0.01
        elif fe_slider_min > 0.3 and fe_slider_max < 0.7:
            fe_min_sup = 0.9
        elif fe_slider_max < 0.2:
            fe_min_sup = 0.95
        else:
            fe_min_sup = 0.8
    if fe_sets_rules_patterns == 0:
        fe_min_sup = 0.4
    if fe_sets_rules_patterns == 1:
        fe_min_sup = 0.8
        fe_min_conf = 0.8
        if not fe_bool_year:
            if not fe_bool_passed_courses:
                fe_min_sup = 0.05
                fe_min_conf = 0.2
                if fe_slider_min > 0.8:
                    fe_min_sup = 0.01
                    fe_min_conf = 0.1
            elif fe_slider_min > 0.3 and fe_slider_max < 0.7:
                fe_min_sup = 0.9
                fe_min_conf = 0.9
            elif fe_slider_max < 0.2:
                fe_min_sup = 0.95
                fe_min_conf = 0.95
            else:
                fe_min_sup = 0.8
                fe_min_conf = 0.8
    if fe_sets_rules_patterns == 2:
        fe_min_sup = 0.1
        if fe_slider_min > 0.8:
            fe_min_sup = 0.2
        if not fe_bool_passed_courses:
            fe_min_sup = 0.03
    return fe_min_sup, fe_min_conf


# Not used because same output every time
def renaming(
    csv_file_input="./csv/edu-format.csv",
    csv_course_encodings="./csv/core_courses.csv",
    csv_file_path="./csv/work_renamed.csv",
    renamed_column=9,
):

    # Read encoding scheme
    # encoding_arr: [['code 1', ['Name 1 to turn into code 1', ...]], [...], ...]
    encoding_arr = []
    with open(csv_course_encodings, "r", encoding="utf-8") as file:
        enc_reader = csv.reader(file, delimiter="|")
        next(enc_reader)
        for row in enc_reader:
            # ID,[name]
            encoding_arr.append([row[0], row[1]])
        # Check if IDs unique
        for i in range(len(encoding_arr) - 1):
            for j in range(i + 1, len(encoding_arr)):
                if encoding_arr[i][0] == encoding_arr[j][0]:
                    print("ERROR: ", encoding_arr[i][0])
                    return

    # Open the CSV file
    with open(csv_file_input, "r", encoding="utf-8") as file:
        # Open the CSV file in write mode
        # Create a CSV reader object
        reader = csv.reader(file)

        with open(csv_file_path, "w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)

            for new_row in reader:
                writer.writerow(new_row)
                break
            for row in reader:
                new_row = row
                # Every row in encoding file
                for code_row in encoding_arr:
                    if row[renamed_column] in code_row[1]:
                        new_row[renamed_column] = code_row[0]
                        break
                writer.writerow(new_row)


# Not used anywhere
def create_all_distinct_courses_from_csv(
    csv_file_input="./csv/work_renamed.csv", grade_bool=False
):
    all_distinct_courses = []
    # Open the CSV file
    with open(csv_file_input, "r", encoding="utf-8") as file:
        # Create a CSV reader object
        reader = csv.DictReader(file)
        # Skip the first row
        next(reader)
        for row in reader:
            if grade_bool:
                course = row["grade"]
            else:
                course = row["course"]
            if course not in all_distinct_courses:
                all_distinct_courses.append(course)

    all_distinct_courses = sorted(all_distinct_courses)
    if not grade_bool:
        len_courses = len(all_distinct_courses)
        for i in range(len_courses):
            all_distinct_courses.insert(
                len_courses - i,
                not_passed_prefix + str(all_distinct_courses[len_courses - i - 1]),
            )

    return all_distinct_courses


def create_all_distinct_courses_from_df(df, grade_bool=False):
    if not grade_bool:
        all_distinct_courses = sorted(df["course"].unique().tolist())
        len_courses = len(all_distinct_courses)
        for i in range(len_courses):
            all_distinct_courses.insert(
                len_courses - i,
                not_passed_prefix + str(all_distinct_courses[len_courses - i - 1]),
            )
        return all_distinct_courses
    return sorted(df["grade"].unique().tolist())


def create_numbers_to_names(
    all_distinct_courses, numbers_to_names_path="./number_name.txt"
):
    with open(numbers_to_names_path, "w", newline="", encoding="utf-8") as file:
        for i in range(len(all_distinct_courses)):
            file.write(str(i) + " " + str(all_distinct_courses[i]) + "\n")


def filter_for_checkboxes(work, checkbox_data):
    # Uneven semesters are winter semesters
    lowest_semesters = work.groupby("subjectId")["semester"].min().reset_index()
    lowest_semesters.columns = ["subjectId", "lowest_semester"]
    if ("Started in winter" not in checkbox_data) and (
        "Started in summer" not in checkbox_data
    ):
        remaining_subjects = pd.Series([])
    elif "Started in winter" not in checkbox_data:
        remaining_subjects = lowest_semesters.loc[
            lowest_semesters["lowest_semester"] % 2 == 0, "subjectId"
        ]
    elif "Started in summer" not in checkbox_data:
        remaining_subjects = lowest_semesters.loc[
            lowest_semesters["lowest_semester"] % 2 != 0, "subjectId"
        ]
    else:
        remaining_subjects = lowest_semesters["subjectId"]
    remaining_subjects = set(remaining_subjects)
    # Filter out remaining not checked boxes
    if ("BA passed" not in checkbox_data) or ("BA not passed" not in checkbox_data):
        passed_bak = work.loc[
            (work["course"] == "BAK") & (work["state"] == "Bestanden"), "subjectId"
        ].unique()
        if "BA passed" not in checkbox_data:
            remaining_subjects = remaining_subjects - set(passed_bak)
        if "BA not passed" not in checkbox_data:
            remaining_subjects = remaining_subjects & set(passed_bak)
    if ("MA passed" not in checkbox_data) or ("MA not passed" not in checkbox_data):
        passed_msc = work.loc[
            (work["course"] == "MSc") & (work["state"] == "Bestanden"), "subjectId"
        ].unique()
        if "MA passed" not in checkbox_data:
            remaining_subjects = remaining_subjects - set(passed_msc)
        if "MA not passed" not in checkbox_data:
            remaining_subjects = remaining_subjects & set(passed_msc)
    return remaining_subjects

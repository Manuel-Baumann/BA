import pandas as pd
import csv
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori
from mlxtend.frequent_patterns import association_rules as arule
from spmf import Spmf
from pycaret.datasets import get_data
import datetime

mandatory_courses_arr = [
    "BAK",
    "FSAP",
    "LA",
    "AfI",
    "BuS",
    "BuK",
    "TI",
    "DS",
    "M",
    "P",
    "DSA",
    "MaLo",
    "ST",
    "DKS",
    "DBIS",
    "PSP",
    "ProS",
    "AS",
    "SPP",
]
all_distinct_courses = []
TRUNCATE_OUTPUT = 100  # Lines of output that will be shown / vizualized

aggregate_grades = {
    1.0: 1,
    1.3: 1,
    1.7: 1,
    2.0: 2,
    2.3: 2,
    2.7: 2,
    3.0: 3,
    3.3: 3,
    3.7: 3,
    4.0: 4,
    5.0: 5,
    0.0: 0,
}
aggregate_courses = {
    "MaLo": "Math",
    "DS": "Math",
    "LA": "Math",
    "AS": "Math",
    "TI": "CS",
    "BuK": "Theo Inf",
    "DBIS": "CS",
    "FSAP": "Theo Inf",
    "P": "CS",
    "DKS": "CS",
}
mand = "Mandatory Course"
mandatory_courses_dict = {
    "BAK": mand,
    "FSAP": mand,
    "LA": mand,
    "AfI": mand,
    "BuS": mand,
    "BuK": mand,
    "TI": mand,
    "DS": mand,
    "M": mand,
    "P": mand,
    "DSA": mand,
    "MaLo": mand,
    "ST": mand,
    "DKS": mand,
    "DBIS": mand,
    "PSP": mand,
    "ProS": mand,
    "AS": mand,
    "SPP": mand,
}
bins_bool = True
work_renamed = "./csv/work_renamed.csv"
not_passed_prefix = "(Not passed) "
seq_patt_spmf_algo_name = ""
min_sup_FE = 200
min_conf_FE = 200
bool_use_params = False


def execute_script_func(
    bool_all,
    bool_courses,
    bool_year,
    bool_all_courses,
    insights,
    sets_rules_patterns,
    slider_min,
    slider_max,
    column_values,
    number_of_output_lines,
    bool_use_params,
    min_sup,
    min_conf,
):
    print("Script started at:", datetime.datetime.now())
    if slider_min >= slider_max:
        print("Error: Check slider values, min:", slider_min, ">= max:", slider_max)
        return

    #################### Handle global vars based on input ####################
    global TRUNCATE_OUTPUT
    TRUNCATE_OUTPUT = number_of_output_lines
    if TRUNCATE_OUTPUT == 200:
        TRUNCATE_OUTPUT = 30000

    global seq_patt_spmf_algo_name
    if insights == 0:
        seq_patt_spmf_algo_name = "PrefixSpan"
    elif insights == 1:
        seq_patt_spmf_algo_name = "ClaSP"
    elif insights == 2:
        seq_patt_spmf_algo_name = "MaxSP"

    global min_sup_FE
    global min_conf_FE
    global bool_use_params_FE
    if bool_use_params == "False":
        bool_use_params = False
    else:
        bool_use_params = True
    bool_use_params_FE = bool_use_params
    if bool_use_params:
        min_sup_FE = float(min_sup) / 100
        min_conf_FE = float(min_conf) / 100
        print("Custom minimum support:", min_sup)
        print("Custom minimum confidence:", min_conf)

    ###########################################################################
    # Doesnt work for slidermin = 0.75, slidermax = 1
    min_sup = 0.8
    if not bool_year:
        if not bool_all_courses:
            min_sup = 0.05
            if slider_min > 0.8:
                min_sup = 0.01
        elif slider_min > 0.3 and slider_max < 0.7:
            min_sup = 0.9
        elif slider_max < 0.2:
            min_sup = 0.95
        else:
            min_sup = 0.8

    tmp = "./Results/tmp.txt"
    tmp2 = "./Results/tmp2.txt"
    tmp3 = "./Results/tmp3.txt"

    # renaming()
    edu_data = pd.read_csv(work_renamed)
    work = edu_data.copy()

    if bins_bool:
        if bool_courses:
            work["course"] = work["course"].replace(aggregate_courses)
        else:
            work["grade"] = work["grade"].apply(lambda x: aggregate_grades.get(x, x))

    if not bool_all:
        # Only students who passed all courses at RWTH
        in_between_step = work[
            (work["grade"] <= 4.0)
            & (
                (work["course"] == "BAK")
                | (work["course"] == "FSAP")
                | (work["course"] == "LA")
                | (work["course"] == "AfI")
                | (work["course"] == "BuS")
                | (work["course"] == "BuK")
                | (work["course"] == "TI")
                | (work["course"] == "DS")
                | (work["course"] == "M")
                | (work["course"] == "DS")
                | (work["course"] == "P")
                | (work["course"] == "DSA")
                | (work["course"] == "MaLo")
                | (work["course"] == "ST")
                | (work["course"] == "DKS")
                | (work["course"] == "DBIS")
                | (work["course"] == "PSP")
                | (work["course"] == "ProS")
            )
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

    # Filtering out 0 credits
    work = work[((work["credits"] != 0) | (work["state"] != "Bestanden"))]

    # Add prefix (not passed) to all courses that have not been passed
    work["course"] = work.apply(rename_course, axis=1)

    # Extract means scores
    mean_scores = work.groupby("subjectId")["grade"].mean().reset_index()
    mean_scores.rename(columns={"grade": "mean_score"}, inplace=True)

    mean_range = mean_scores[
        mean_scores["mean_score"]
        >= mean_scores["mean_score"].quantile(slider_min / 100)
    ]
    mean_range = mean_range[
        mean_scores["mean_score"] < mean_scores["mean_score"].quantile(slider_max / 100)
    ]

    print("Unique students in dataset:", mean_range["subjectId"].nunique())

    if bool_year:
        # Years basis: rename column term
        # Semester bases: leave as is
        work["term"] = work["term"].apply(rename_term)

    # Filter for mean grade range
    work = pd.DataFrame((work[work["subjectId"].isin(mean_range["subjectId"])]))

    if not bool_all_courses:
        work = work[work["state"] != "Bestanden"]

    str_course_grade = "course"
    if not bool_courses:
        str_course_grade = "grade"

    print("Number of courses:", work.shape[0])
    print(
        "Mean number of courses taken by a student:",
        work.shape[0] / mean_range["subjectId"].nunique(),
    )
    print("Mean grade of mean grade of all students:", mean_range["mean_score"].mean())

    ################################## Frequent Itemsets ##################################
    if sets_rules_patterns == 0:
        min_sup = 0.4
        student_courses_df = pd.DataFrame(
            work.groupby("subjectId")[str_course_grade].unique()
        )
        te1 = TransactionEncoder()
        bool_matr1 = te1.fit(student_courses_df[str_course_grade]).transform(
            student_courses_df[str_course_grade]
        )
        bool_matr1 = pd.DataFrame(bool_matr1, columns=te1.columns_)
        if bool_use_params_FE:
            min_sup = min_sup_FE
        frequent_itemset = apriori(bool_matr1, min_support=min_sup, use_colnames=True)
        # print("Number of rules before filtering:", frequent_itemset.shape[0])

        if bool_courses:
            print(
                '"""POSTPROCESSING"""Only frequent itemsets, that don\'t include any mandatory courses are shown.'
            )
            if frequent_itemset.shape[0] > 0:
                frequent_itemset = frequent_itemset[
                    ~frequent_itemset["itemsets"].apply(
                        lambda x: not x.isdisjoint(mandatory_courses_arr)
                    )
                ]
                frequent_itemset["itemsets"] = frequent_itemset["itemsets"].apply(list)
        else:
            print(
                '"""POSTPROCESSING"""Frequent Itemsets including grade 0.0 were removed.'
            )
            frequent_itemset = frequent_itemset[
                ~frequent_itemset["itemsets"].apply(lambda x: 0.0 in x)
            ]
        frequent_itemset = frequent_itemset.sort_values(by="support", ascending=False)
        print(
            "Number of frequent itemsets:",
            frequent_itemset.shape[0],
        )
        # Print df to output file, so that it can be visualized
        df_to_file(frequent_itemset, tmp)
        print("OUTPUT: FREQUENT ITEMSETS")
        print_output(tmp)

        ### Find frequent course/grade combinations within one semester/year ###
        sem_year = "semester"
        if bool_year:
            sem_year = "year"
        student_courses_df = pd.DataFrame(
            work.groupby("semester")[str_course_grade].unique()
        )
        te2 = TransactionEncoder()
        bool_matr2 = te2.fit(student_courses_df[str_course_grade]).transform(
            student_courses_df[str_course_grade]
        )
        bool_matr2 = pd.DataFrame(bool_matr2, columns=te2.columns_)
        if bool_use_params_FE:
            min_sup = min_sup_FE
        frequent_itemset = apriori(bool_matr2, min_support=min_sup, use_colnames=True)
        if frequent_itemset.shape[0] > 0:
            frequent_itemset = frequent_itemset[
                ~frequent_itemset["itemsets"].apply(
                    lambda x: x.issubset(mandatory_courses_arr)
                )
            ]
        frequent_itemset["itemsets"] = frequent_itemset["itemsets"].apply(list)
        frequent_itemset = frequent_itemset.sort_values(by="support", ascending=False)
        # if bool_courses:
        #    if frequent_itemset.shape[0] > 0:
        #       frequent_itemset = frequent_itemset[
        #          ~frequent_itemset["itemsets"].apply(
        #             lambda x: not x.isdisjoint(mandatory_courses_arr)
        #        )
        #   ]
        #  frequent_itemset["itemsets"] = frequent_itemset["itemsets"].apply(list)
        if not bool_courses:
            frequent_itemset = frequent_itemset[
                ~frequent_itemset["itemsets"].apply(lambda x: 0.0 in x)
            ]

        # Print df to output file, so that it can be visualized
        df_to_file(frequent_itemset, tmp)
        print(
            f"OUTPUT: FREQUENT {str_course_grade.upper()} combinations within one {sem_year.upper()}"
        )
        print_output(tmp)

    ################################## End: Frequent Itemsets ##################################
    grade_bool = not bool_courses
    global all_distinct_courses
    all_distinct_courses = create_all_distinct_courses_from_df(work, grade_bool)
    create_numbers_to_names()
    ################################## Association Rules ##################################
    if sets_rules_patterns == 1:
        min_sup = 0.8
        min_conf = 0.8
        if not bool_year:
            if not bool_all_courses:
                min_sup = 0.05
                min_conf = 0.2
                if slider_min > 0.8:
                    min_sup = 0.01
                    min_conf = 0.1
            elif slider_min > 0.3 and slider_max < 0.7:
                min_sup = 0.9
                min_conf = 0.9
            elif slider_max < 0.2:
                min_sup = 0.95
                min_conf = 0.95
            else:
                min_sup = 0.8
                min_conf = 0.8
        create_spmf_ass_rules_input(work, tmp, grade_bool, all_distinct_courses)

        # arguments: minsup, minconf
        if bool_use_params_FE:
            min_sup = min_sup_FE
            min_conf = min_conf_FE
        spmf = Spmf(
            "FPGrowth_association_rules",
            input_filename=tmp,
            output_filename=tmp2,
            arguments=[min_sup, min_conf],
            spmf_bin_location_dir="../../Data/spmf/",
        )
        spmf.run()
        if not grade_bool:
            decode_spmf_ass_rules(tmp2, tmp)
            # Filter out rules with only mandatory courses
            print(
                '"""POSTPROCESSING"""Rules that include only mandatory courses were filtered out.'
            )
            filter_only_mandatory_courses(tmp, tmp2)
            sort_spmf_ass_rules(tmp2)
        else:
            # Grades
            # arguments: minsup, max sequence length
            decode_spmf_ass_rules(tmp2, tmp)
            sort_spmf_ass_rules(tmp)
        make_support_relative(tmp, work["subjectId"].nunique())
        print('"""POSTPROCESSING"""Association Rules including grade 0.0 were removed.')
        remove_grade_zero(tmp)
        print("OUTPUT: ASSOCIATION RULES")
        print_output(tmp)
    ################################## End: Association Rules ##################################
    ################################## Sequential Patterns ##################################
    if sets_rules_patterns == 2:
        min_sup = 0.1
        if slider_min > 0.8:
            min_sup = 0.2
        if not bool_all_courses:
            min_sup = 0.03
        semester_basis = not bool_year
        if bool_use_params_FE:
            min_sup = min_sup_FE
        create_prefix_span_input_and_run(
            work, semester_basis, grade_bool, min_sup, 30, tmp, tmp2, tmp3
        )
        make_support_relative(tmp, work["subjectId"].nunique())
        if grade_bool:
            print(
                '"""POSTPROCESSING"""Sequential Patterns including grade 0.0 were removed.'
            )
            remove_grade_zero(tmp)
        print("OUTPUT: SEQUENTIAL PATTERNS")
        print_output(tmp)
    print("successful", datetime.datetime.now())


def create_all_distinct_courses_from_csv(csv_file_input=work_renamed, grade_bool=False):
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


def create_spmf_ass_rules_input(df, tmp, grade_bool, all_distinct_courses):
    subjects = []
    for i in range(5395):  # max value for subjectId is 5395
        subjects.append([])

    for index, row in df.iterrows():
        subject_id = int(row["subjectId"])
        if grade_bool:
            course = row["grade"]
        else:
            course = row["course"]
        semesters = subjects[subject_id - 1]
        if course not in semesters:
            subjects[subject_id - 1].append(course)

    ############# Begin writing in new file ##############
    with open(tmp, "w", newline="", encoding="utf-8") as file:
        for sub in subjects:
            if sub != []:
                for i in range(len(sub)):
                    sub[i] = all_distinct_courses.index(sub[i])
                sub = sorted(sub)
                for course in sub:
                    file.write(str(course) + " ")
                file.write("\n")


def decode_spmf_ass_rules(input_path, output_path):
    with open(input_path, "r", newline="", encoding="utf-8") as f:
        with open(output_path, "w", newline="", encoding="utf-8") as g:
            for line in f:
                words = line.split()
                for i in range(len(words)):
                    if words[i].startswith("#"):
                        g.write("          ")
                        for j in range(len(words) - i):
                            g.write(words[i + j] + " ")
                        break
                    elif words[i].isnumeric():
                        g.write(str(all_distinct_courses[int(words[i])]) + " ")
                    else:
                        g.write(words[i] + " ")

                g.write("\n")


def sort_spmf_ass_rules(output):
    lines = []
    supports = []
    index = 0
    with open(output, "r", newline="", encoding="utf-8") as f:
        for line in f:
            if len(line.split()) > 0:
                supports.append([line.split()[-1], index])
                lines.append(line)
                index += 1

    supports = sorted(supports, key=lambda x: x[0], reverse=True)

    with open(output, "w", newline="", encoding="utf-8") as g:
        for i in range(len(lines)):
            g.write(lines[supports[i][1]])


def filter_only_mandatory_courses(tmp2, output):
    with open(tmp2, "r", newline="", encoding="utf-8") as f:
        with open(output, "w", newline="", encoding="utf-8") as g:
            for line in f:
                words = line.split()
                bool_all_mandatory = True
                for i in range(len(words)):
                    if words[i].startswith("#"):
                        if not bool_all_mandatory:
                            g.write(line)
                        break
                    if words[i] not in mandatory_courses_arr:
                        bool_all_mandatory = False
                g.write("\n")


########## Functions for Sequential pattern mining
def sort_spmf_prefix_span_output(readable_output_path):
    lines = []
    supports = []
    index = 0
    with open(readable_output_path, "r", newline="", encoding="utf-8") as f:
        for line in f:
            supports.append([line.split()[-1], index])
            lines.append(line)
            index += 1

    supports = sorted(supports, key=lambda x: x[0], reverse=True)

    with open(readable_output_path, "w", newline="", encoding="utf-8") as g:
        for i in range(len(lines)):
            g.write(lines[supports[i][1]])


def create_numbers_to_names(numbers_to_names_path="./number_name.txt"):
    with open(numbers_to_names_path, "w", newline="", encoding="utf-8") as file:
        for i in range(len(all_distinct_courses)):
            file.write(str(i) + " " + str(all_distinct_courses[i]) + "\n")


def decode_prefix_span_output(input_path, readable_output_path):
    with open(input_path, "r", newline="", encoding="utf-8") as f:
        with open(readable_output_path, "w", newline="", encoding="utf-8") as g:
            for line in f:
                words = line.split()
                for i in range(len(words)):
                    if words[i] == "-1":
                        if not words[i + 1].startswith("#"):
                            g.write(" => ")
                        continue
                    if words[i].isnumeric():
                        last = " "
                        if words[i + 1] != "-1":
                            last = " || "
                        g.write(str(all_distinct_courses[int(words[i])]) + last)
                    elif words[i].startswith("#"):
                        g.write("          ")
                        for j in range(len(words) - i):
                            g.write(words[i + j] + " ")
                        break
                    else:
                        g.write("decoding ERROR!!!!!!!!!!!!!!!!")
                g.write("\n")
    sort_spmf_prefix_span_output(readable_output_path)


def run_prefix_span(input, output, min_support, max_len, readable_output_path):
    # arguments: minsup, max sequence length
    algo_args = []
    if seq_patt_spmf_algo_name == "PrefixSpan":
        algo_args = [min_support, max_len]
    else:
        algo_args = [min_support]
    spmf = Spmf(
        seq_patt_spmf_algo_name,
        input_filename=input,
        output_filename=output,
        arguments=algo_args,
        spmf_bin_location_dir="../../Data/spmf/",
    )
    spmf.run()
    # print(spmf.to_pandas_dataframe(pickle=True))
    # spmf.to_csv("./Data/Results/output_spmf_prefixSpan.csv")
    decode_prefix_span_output(output, readable_output_path)


def create_prefix_span_input_and_run(
    df,
    semester_basis,
    grade_bool,
    min_support,
    max_len,
    readable_output_path,
    output_file,
    file_path,
):
    # Create list in which: array[i] corresponds to subject with subjectId = i + 1
    #               [
    #                    [[semester, [courses_semester]], [semester, [courses_semester]], , , , , , ],
    #                    ...
    #               ]
    # For rows in which the subjectId does not exist, the value will be [subjectId, []]
    subjects = []
    for i in range(5395):  # max value for subjectId is 5395
        subjects.append([])
    for index, row in df.iterrows():
        if semester_basis:
            semester = int(row["semester"])
        else:
            semester = int(row["term"])
        subject_id = int(row["subjectId"])
        if grade_bool:
            course = row["grade"]
        else:
            course = row["course"]
        semesters = subjects[subject_id - 1]

        flag_already_exists = False
        for i in range(len(semesters)):
            # If semesters-array already exist, append course, otherwise create array for semester
            if semesters[i][0] == semester:
                flag_already_exists = True
                subjects[subject_id - 1][i][1].append(course)
                break
        if not flag_already_exists:
            subjects[subject_id - 1].append([semester, [course]])

    ############# Begin writing in new file ##############
    with open(file_path, "w", newline="", encoding="utf-8") as file:
        for sub in subjects:
            if sub != []:
                for sem in sub:
                    for i in range(len(sem[1])):
                        sem[1][i] = all_distinct_courses.index(sem[1][i])
                    sem[1] = sorted(sem[1])
                    for course in sem[1]:
                        file.write(str(course) + " ")
                    file.write("-1 ")
                file.write("-2\n")

    run_prefix_span(file_path, output_file, min_support, max_len, readable_output_path)


# Create years basis
def rename_term(entry):
    entry = str(entry)
    term_year = int(entry[:4])
    if len(entry) >= 5 and entry[4] == "S":
        term_year -= 1
    return term_year


# Function to add Prefix (not passed)
def rename_course(row):
    if row["state"] == "Bestanden":
        return row["course"]
    else:
        return not_passed_prefix + row["course"]


# Not used because same output every time
def renaming(
    csv_file_input="./csv/edu-format.csv",
    csv_course_encodings="./csv/core_courses.csv",
    csv_file_path=work_renamed,
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


def print_output(tmp):
    with open(tmp, "r", newline="", encoding="utf-8") as f:
        i = 1
        for line in f:
            print(line, end="")
            i += 1
            if i > TRUNCATE_OUTPUT:
                break


def make_support_relative(tmp, number_of_rules):
    with open(tmp, "r") as file:
        lines = file.readlines()
    new_lines = []
    for line in lines:
        words = line.split()
        for i in range(len(words) - 1):
            if words[i] == "#SUP:":
                words[i + 1] = str(int(words[i + 1]) / number_of_rules)
                break
        for i in range(len(words)):
            if words[i] == "#SUP:" or words[i] == "#CONF:":
                words[i + 1] = "{:10.4f}".format(float(words[i + 1]))
        if len(words) > 0:
            new_lines.append(" ".join(words) + "\n")
    with open(tmp, "w") as file:
        file.writelines(new_lines)


def remove_grade_zero(tmp):
    with open(tmp, "r") as file:
        lines = file.readlines()
    new_lines = []
    for line in lines:
        words = line.split()
        flag_zero = False
        for i in range(len(words)):
            if words[i] == "0.0":
                flag_zero = True
        if not flag_zero:
            new_lines.append(" ".join(words) + "\n")
    with open(tmp, "w") as file:
        file.writelines(new_lines)


def df_to_file(df, file_path):
    with open(file_path, "w", newline="", encoding="utf-8") as file:
        for _, row in df.iterrows():
            itemset_str = " || ".join(list(map(str, list(row["itemsets"]))))
            support_relative = row["support"]
            file.write(f"{itemset_str} #SUP:{support_relative}\n")

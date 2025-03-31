from spmf import Spmf  # type: ignore
import pandas as pd  # type: ignore
from mlxtend.frequent_patterns import fpmax  # type: ignore
from mlxtend.frequent_patterns import apriori  # type: ignore
from .definitions import tmp, tmp2, tmp4, MAX_VALUE_OF_SUBJECT_ID, mandatory_courses_arr


def execute_freq_itemset_algorithm(
    work,
    normal_closed_maximal,
    bool_courses,
    min_sup,
    bool_matr,
    df_to_file_function,
    grade_bool,
    all_distinct_courses,
    semesters_basis_bool,
    remove_all_mand_fi_bool,
):
    frequent_itemset = None
    # Run the algorithm
    if normal_closed_maximal == 1:
        relative_support_divisor = create_input_file(
            work, tmp2, grade_bool, all_distinct_courses, semesters_basis_bool
        )
        execute_closed_freq_itemset_algorithm(
            min_sup,
            relative_support_divisor,  # work["subjectId"].nunique(),
            tmp2,
            tmp,
            all_distinct_courses,
            grade_bool,
        )
    else:
        if normal_closed_maximal == 0:
            frequent_itemset = apriori(
                bool_matr, min_support=min_sup, use_colnames=True
            )

        elif normal_closed_maximal == 2:
            frequent_itemset = fpmax(bool_matr, min_support=min_sup, use_colnames=True)

        # print("Number of rules before filtering:", frequent_itemset.shape[0])
        if bool_courses and normal_closed_maximal == 0 and remove_all_mand_fi_bool:
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
        elif not bool_courses:
            print(
                '"""POSTPROCESSING""" Frequent Itemsets including grade 0.0 were removed.'
            )
            frequent_itemset = frequent_itemset[
                ~frequent_itemset["itemsets"].apply(lambda x: "0.0" in str(x))
            ]

        if frequent_itemset.shape[0] == 0:
            print("WARNING: No frequent itemsets with given minimum support found.")
            return
        frequent_itemset = frequent_itemset.sort_values(by="support", ascending=False)

        print(
            "Number of frequent itemsets:",
            frequent_itemset.shape[0],
        )
        # Print df to output file, so that it can be visualized
        df_to_file_function(frequent_itemset, tmp)

        if frequent_itemset.shape[0] > 0 and normal_closed_maximal != 0:
            frequent_itemset = frequent_itemset[
                ~frequent_itemset["itemsets"].apply(
                    lambda x: x.issubset(mandatory_courses_arr)
                )
            ]
        frequent_itemset["itemsets"] = frequent_itemset["itemsets"].apply(list)
        frequent_itemset = frequent_itemset.sort_values(by="support", ascending=False)

        if not bool_courses:
            frequent_itemset = frequent_itemset[
                ~frequent_itemset["itemsets"].apply(lambda x: 0.0 in x)
            ]
        # Print df to output file, so that it can be visualized
        df_to_file_function(frequent_itemset, tmp2)


def create_input_file(df, file, grade_bool, all_distinct_courses, semesters_basis_bool):
    subjects = []
    for i in range(MAX_VALUE_OF_SUBJECT_ID):
        subjects.append([])
    str_grade_course = ""
    if grade_bool:
        str_grade_course = "grade"
    else:
        str_grade_course = "course"

    for index, row in df.iterrows():
        subject_id = int(row["subjectId"])
        course = row[str_grade_course]
        semesters = subjects[subject_id - 1]

        if semesters_basis_bool:
            semester = int(row["semester"])
            flag_already_exists = False
            for i in range(len(semesters)):
                if semesters[i][0] == semester:
                    flag_already_exists = True
                    subjects[subject_id - 1][i][1].append(course)
                    break
            if not flag_already_exists:
                subjects[subject_id - 1].append([semester, [course]])
        else:
            if course not in semesters:
                subjects[subject_id - 1].append(course)

    ############# Begin writing in new file ##############
    relative_support_divisor = 0
    with open(file, "w", newline="", encoding="utf-8") as file:
        for sub in subjects:
            if sub != []:
                if not semesters_basis_bool:
                    len_sub = len(sub)
                    for i in range(len_sub):
                        sub[i] = all_distinct_courses.index(sub[i])
                    sub = sorted(sub)
                    for course in sub:
                        file.write(str(course) + " ")
                    file.write("\n")
                else:
                    for sem in sub:
                        for i in range(len(sem[1])):
                            sem[1][i] = all_distinct_courses.index(sem[1][i])
                        sem[1] = sorted(sem[1])
                        for course in sem[1]:
                            file.write(str(course) + " ")
                        relative_support_divisor += 1
                        file.write("\n")
    if not semesters_basis_bool:
        return df["subjectId"].nunique()
    return relative_support_divisor


# For the second algorithm - Based on semesters/years and not on students
def create_second_input_file(work, file, grade_bool, all_distinct_courses):
    subjects = []
    for i in range(5395):  # max value for subjectId is 5395
        subjects.append([])

    for index, row in work.iterrows():
        subject_id = int(row["subjectId"])
        if grade_bool:
            course = row["grade"]
        else:
            course = row["course"]
        semesters = subjects[subject_id - 1]
        if course not in semesters:
            subjects[subject_id - 1].append(course)

    ############# Begin writing in new file ##############
    with open(file, "w", newline="", encoding="utf-8") as file:
        for sub in subjects:
            if sub != []:
                len_sub = len(sub)
                for i in range(len_sub):
                    sub[i] = all_distinct_courses.index(sub[i])
                sub = sorted(sub)
                for course in sub:
                    file.write(str(course) + " ")
                file.write("\n")


def decode_output(input_path, output_path, all_distinct_courses):
    with open(input_path, "r", newline="", encoding="utf-8") as f:
        with open(output_path, "w", newline="", encoding="utf-8") as g:
            for line in f:
                words = line.split()
                len_words = len(words)
                for i in range(len_words):
                    if words[i].startswith("#"):
                        g.write(" ")
                        for j in range(len_words - i):
                            g.write(words[i + j] + " ")
                        break
                    elif words[i].isnumeric():
                        bars = ""
                        if not words[i + 1].startswith("#"):
                            bars = " || "
                        g.write(str(all_distinct_courses[int(words[i])]) + bars)
                    else:
                        g.write(words[i] + " ")

                g.write("\n")


def sort_itemsets_by_support(input):
    lines = []
    supports = []
    index = 0
    with open(input, "r", newline="", encoding="utf-8") as f:
        for line in f:
            if len(line.split()) > 0:
                supports.append([line.split()[-1], index])
                lines.append(line)
                index += 1

    supports = sorted(supports, key=lambda x: x[0], reverse=True)

    with open(input, "w", newline="", encoding="utf-8") as g:
        for i in range(len(lines)):
            g.write(lines[supports[i][1]])


def make_support_relative(input, number_of_rules):
    with open(input, "r") as file:
        lines = file.readlines()
    new_lines = []
    for line in lines:
        words = line.split()
        for i in range(len(words) - 1):
            if words[i] == "#SUP:":
                words[i + 1] = str(int(words[i + 1]) / number_of_rules)
                break
        len_words = len(words)
        for i in range(len_words):
            if words[i] == "#SUP:" or words[i] == "#CONF:":
                words[i + 1] = "{:10.4f}".format(float(words[i + 1]))
        if len_words > 0:
            new_lines.append(" ".join(words) + "\n")
    with open(input, "w") as file:
        file.writelines(new_lines)


def remove_grade_zero(input):
    with open(input, "r") as file:
        lines = file.readlines()
    new_lines = []
    for line in lines:
        words = line.split()
        flag_zero = False
        len_words = len(words)
        for i in range(len_words):
            if words[i] == "0.0":
                flag_zero = True
        if not flag_zero:
            new_lines.append(" ".join(words) + "\n")
    with open(input, "w") as file:
        file.writelines(new_lines)


# Handle spmf lib and dont touch tmp, only tmp2 and tmp3
def execute_closed_freq_itemset_algorithm(
    min_sup, unique_students, input_file, output_file, all_distinct_courses, grade_bool
):
    spmf = Spmf(
        "AprioriClose",
        input_filename=input_file,
        output_filename=tmp4,
        arguments=[min_sup],
        spmf_bin_location_dir="C:/Users/lenaf/Documents/Uni/BA/BA/Data/spmf",
    )
    spmf.run()

    decode_output(tmp4, output_file, all_distinct_courses)
    sort_itemsets_by_support(output_file)
    make_support_relative(output_file, unique_students)
    if grade_bool:
        remove_grade_zero(output_file)

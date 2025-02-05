from spmf import Spmf

from .definitions import MAX_VALUE_OF_SUBJECT_ID


def create_spmf_ass_rules_input(
    df, file, grade_bool, all_distinct_courses, semesters_basis_bool
):
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


def decode_spmf_ass_rules(input_path, output_path, all_distinct_courses):
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
                        last = " "
                        if words[i + 1].isnumeric():
                            last = " || "
                        g.write(str(all_distinct_courses[int(words[i])]) + last)
                    else:
                        g.write(words[i] + " ")
                g.write("\n")


def run_spmf_association_rules(algo_name, input, output, minsup, minconf):
    spmf = Spmf(
        algo_name,
        input_filename=input,
        output_filename=output,
        arguments=[minsup, minconf],
        spmf_bin_location_dir="../../Data/spmf/",
    )
    spmf.run()


def sort_spmf_ass_rules(output):
    lines = []
    supports = []

    with open(output, "r", newline="", encoding="utf-8") as f:
        for index, line in enumerate(f):
            parts = line.strip().split()
            if "#SUP:" in parts and "#CONF:" in parts:
                try:
                    # Extract support value
                    sup_index = parts.index("#SUP:") + 1
                    support_value = float(parts[sup_index])  # Convert to float
                    supports.append((support_value, index))
                    lines.append(line)
                except (ValueError, IndexError):
                    continue  # Skip malformed lines

    # Sort descending by support value
    supports.sort(key=lambda x: x[0], reverse=True)

    with open(output, "w", newline="", encoding="utf-8") as g:
        for _, index in supports:
            g.write(lines[index])  # Write the correctly sorted lines

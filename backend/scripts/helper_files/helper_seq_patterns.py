from spmf import Spmf


def sort_spmf_seq_pat_algo_output(readable_output_path):
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


def decode_seq_pat_algo_output(input_path, readable_output_path, all_distinct_courses):
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


def run_spmf_seq_pat_algo(input, output, min_support, max_len, algo_name):
    # arguments: minsup, max sequence length
    algo_args = []
    if algo_name == "PrefixSpan":
        algo_args = [min_support, max_len]
    else:
        algo_args = [min_support]
    spmf = Spmf(
        algo_name,
        input_filename=input,
        output_filename=output,
        arguments=algo_args,
        spmf_bin_location_dir=r"C:\Users\lenaf\Documents\Uni\BA\BA\Data\spmf",
    )
    spmf.run()
    # print(spmf.to_pandas_dataframe(pickle=True))
    # spmf.to_csv("./Data/Results/output_spmf_prefixSpan.csv")


def create_seq_pat_algo_input(df, grade_bool, file_path, all_distinct_courses):
    # Create list in which: array[i] corresponds to subject with subjectId = i + 1
    #               [
    #                    [[semester, [courses_semester]], [semester, [courses_semester]], , , , , , ],
    #                    ...
    #               ]
    # For rows in which the subjectId does not exist, the value will be [subjectId, []]
    subjects = []
    for i in range(5395):  # max value for subjectId is 5395
        subjects.append([])

    str_grade_course = ""
    if grade_bool:
        str_grade_course = "grade"
    else:
        str_grade_course = "course"

    for index, row in df.iterrows():
        semester = int(row["semester"])
        subject_id = int(row["subjectId"])
        course = row[str_grade_course]
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

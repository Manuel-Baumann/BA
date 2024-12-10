from spmf import Spmf


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
                len_sub = len(sub)
                for i in range(len_sub):
                    sub[i] = all_distinct_courses.index(sub[i])
                sub = sorted(sub)
                for course in sub:
                    file.write(str(course) + " ")
                file.write("\n")


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
                        g.write(str(all_distinct_courses[int(words[i])]) + " ")
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

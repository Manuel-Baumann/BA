from helper_files.definitions import mandatory_courses_arr

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


def df_to_file(df, file_path):
    with open(file_path, "w", newline="", encoding="utf-8") as file:
        for _, row in df.iterrows():
            itemset_str = " || ".join(list(map(str, list(row["itemsets"]))))
            support_relative = row["support"]
            file.write(f"{itemset_str} #SUP:{support_relative}\n")


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


def print_output(tmp, truncate_output):
    with open(tmp, "r", newline="", encoding="utf-8") as f:
        i = 1
        for line in f:
            print(line, end="")
            i += 1
            if i > truncate_output:
                break


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
                    if words[i] not in mandatory_courses_arr and words[i] != "==>":
                        bool_all_mandatory = False
                g.write("\n")

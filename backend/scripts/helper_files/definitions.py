tmp = "./Results/tmp.txt"
tmp2 = "./Results/tmp2.txt"
tmp3 = "./Results/tmp3.txt"
tmp4 = "./Results/tmp4.txt"
tmp5 = "./Results/tmp4.txt"

not_passed_prefix = "(Not passed) "
MAX_VALUE_OF_SUBJECT_ID = 5395

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
"""
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
}"""

all_grades = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0, 5.0]


def create_aggregate_grades(bins_array):
    aggregate_grades = {0.0: 0}
    current_name = 1
    for i in range(len(all_grades)):
        aggregate_grades[all_grades[i]] = current_name
        if str(all_grades[i]) in bins_array:
            current_name += 1
    # for key, value in aggregate_grades.items():
    #    print("key, value", key, value)
    return aggregate_grades

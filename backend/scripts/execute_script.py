import pandas as pd
from helper_files.helper_freq_itemsets import (
    execute_freq_itemset_algorithm,
)
from helper_files.helper_preproc import (
    create_numbers_to_names,
    determine_params_automatically,
    preprocess_csv,
    renaming,
    create_all_distinct_courses_from_df,
)
from helper_files.helper_seq_patterns import (
    create_seq_pat_algo_input,
    decode_seq_pat_algo_output,
    run_spmf_seq_pat_algo,
    sort_spmf_seq_pat_algo_output,
)
from helper_files.helper_ass_rules import (
    create_spmf_ass_rules_input,
    decode_spmf_ass_rules,
    run_spmf_association_rules,
    sort_spmf_ass_rules,
)
from helper_files.helper_postproc import (
    df_to_file,
    filter_only_mandatory_courses,
    make_support_relative,
    print_output,
    remove_grade_zero,
)
from mlxtend.preprocessing import TransactionEncoder
from mlxtend.frequent_patterns import apriori
from mlxtend.frequent_patterns import association_rules as arule
from mlxtend.frequent_patterns import fpmax
from spmf import Spmf
import datetime
from helper_files.definitions import tmp, tmp2, tmp3, mandatory_courses_arr

all_distinct_courses = []
TRUNCATE_OUTPUT = 100  # Lines of output that will be shown / vizualized

##################    Temporary booleans ################
BINS_BOOL = False
USE_S_OR_Y_AS_BASIS_FOR_FI_AR = True
REMOVE_ALL_MAND_COURSES_FI = False

work_renamed = "./csv/work_renamed.csv"
algo_name = ""
global_min_sup = 200
global_min_conf = 200
bool_use_params = False


def execute_script_func(
    fe_bool_all_students,
    fe_bool_courses,
    fe_bool_year,
    fe_bool_passed_courses,
    fe_normal_closed_maximal,
    fe_sets_rules_patterns,
    fe_slider_min,
    fe_slider_max,
    fe_column_values,
    fe_number_of_output_lines,
    fe_bool_use_params,
    fe_min_sup,
    fe_min_conf,
    fe_checkbox_data,
    fe_students_basis_bool,
    fe_bins_bool,
):
    print("Script started at:", datetime.datetime.now())
    if fe_slider_min >= fe_slider_max:
        print(
            "Error: Check slider values, min:", fe_slider_min, ">= max:", fe_slider_max
        )
        return

    #################### Handle global vars based on input ####################
    global TRUNCATE_OUTPUT
    TRUNCATE_OUTPUT = fe_number_of_output_lines
    if TRUNCATE_OUTPUT == 200:
        TRUNCATE_OUTPUT = 30000

    global algo_name
    if fe_sets_rules_patterns == 1:
        if fe_normal_closed_maximal == 0:
            algo_name = "FPGrowth_association_rules"
        elif fe_normal_closed_maximal == 1:
            algo_name = "Closed_association_rules"
        elif fe_normal_closed_maximal == 2:
            print(
                '"""POSTPROCESSING"""Calculating minimal non-redundant association rules.'
            )
            algo_name = "MNR"
    elif fe_sets_rules_patterns == 2:
        if fe_normal_closed_maximal == 0:
            algo_name = "PrefixSpan"
        elif fe_normal_closed_maximal == 1:
            algo_name = "ClaSP"
        elif fe_normal_closed_maximal == 2:
            algo_name = "MaxSP"

    global global_min_sup
    global global_min_conf
    global bool_use_params_FE
    if fe_bool_use_params == "False":
        fe_bool_use_params = False
    else:
        fe_bool_use_params = True
    bool_use_params_FE = fe_bool_use_params
    if fe_bool_use_params:
        global_min_sup = float(fe_min_sup) / 100
        global_min_conf = float(fe_min_conf) / 100
        print("Custom minimum support:", fe_min_sup)
        print("Custom minimum confidence:", fe_min_conf)
    else:
        global_min_sup, global_min_conf = determine_params_automatically(
            fe_sets_rules_patterns,
            fe_bool_year,
            fe_bool_passed_courses,
            fe_slider_min,
            fe_slider_max,
        )
        print("Automatic minimum support:", global_min_sup)
        print("Automatic minimum confidence:", global_min_conf)
    global USE_S_OR_Y_AS_BASIS_FOR_FI_AR
    global BINS_BOOL
    if fe_students_basis_bool == "False":
        USE_S_OR_Y_AS_BASIS_FOR_FI_AR = True
    else:
        USE_S_OR_Y_AS_BASIS_FOR_FI_AR = False
    if fe_bins_bool == "True":
        BINS_BOOL = True
    else:
        BINS_BOOL = False
    # renaming()

    ######################  Process input csv file  ############################
    work = preprocess_csv(
        work_renamed,
        BINS_BOOL,
        fe_bool_courses,
        fe_bool_all_students,
        fe_slider_min,
        fe_slider_max,
        fe_bool_year,
        fe_bool_passed_courses,
        fe_column_values,
        fe_checkbox_data,
    )
    if work is None or work.empty or work.shape[0] == 0:
        print("WARNING: Empty dataset!")
        return

    str_course_grade = "course"
    if not fe_bool_courses:
        str_course_grade = "grade"

    grade_bool = not fe_bool_courses
    global all_distinct_courses
    all_distinct_courses = create_all_distinct_courses_from_df(work, grade_bool)
    create_numbers_to_names(all_distinct_courses)

    ################################## Frequent Itemsets ##################################
    if fe_sets_rules_patterns == 0:
        te = TransactionEncoder()
        if not USE_S_OR_Y_AS_BASIS_FOR_FI_AR:
            student_courses_df = pd.DataFrame(
                work.groupby("subjectId")[str_course_grade].unique()
            )
        else:
            ### Find frequent course/grade combinations within one semester/year ###
            # Column semester is already updated depending on fe_bool_year
            student_courses_df = pd.DataFrame(
                work.groupby(["subjectId", "semester"])[str_course_grade].unique()
            )
        bool_matr = te.fit(student_courses_df[str_course_grade]).transform(
            student_courses_df[str_course_grade]
        )
        bool_matr = pd.DataFrame(bool_matr, columns=te.columns_)

        # Run the algorithm
        # Writes output for first algo into tmp and second into tmp2
        # Then prints the output
        execute_freq_itemset_algorithm(
            work,
            fe_normal_closed_maximal,
            fe_bool_courses,
            mandatory_courses_arr,
            global_min_sup,
            bool_matr,
            df_to_file,
            grade_bool,
            all_distinct_courses,
            USE_S_OR_Y_AS_BASIS_FOR_FI_AR,
            REMOVE_ALL_MAND_COURSES_FI,
        )
        print("OUTPUT: FREQUENT ITEMSETS")
        print_output(tmp, TRUNCATE_OUTPUT)

    ################################## Association Rules ##################################
    if fe_sets_rules_patterns == 1:
        print('"""POSTPROCESSING""" Ass Rules algo:', algo_name)

        relative_support_divisor = create_spmf_ass_rules_input(
            work, tmp, grade_bool, all_distinct_courses, USE_S_OR_Y_AS_BASIS_FOR_FI_AR
        )
        run_spmf_association_rules(
            algo_name, tmp, tmp2, global_min_sup, global_min_conf
        )
        decode_spmf_ass_rules(tmp2, tmp, all_distinct_courses)
        final_file = ""
        if not grade_bool:
            # Filter out rules with only mandatory courses
            print(
                '"""POSTPROCESSING"""Rules that include only mandatory courses were filtered out.'
            )
            filter_only_mandatory_courses(tmp, tmp2, mandatory_courses_arr)
            final_file = tmp2
        else:
            final_file = tmp
        sort_spmf_ass_rules(final_file)
        make_support_relative(final_file, relative_support_divisor)
        print('"""POSTPROCESSING"""Association Rules including grade 0.0 were removed.')
        remove_grade_zero(final_file)
        print("OUTPUT: ASSOCIATION RULES")

        print_output(final_file, TRUNCATE_OUTPUT)
    ################################## End: Association Rules ##################################
    ################################## Sequential Patterns ##################################
    if fe_sets_rules_patterns == 2:
        create_seq_pat_algo_input(work, grade_bool, tmp3, all_distinct_courses)
        run_spmf_seq_pat_algo(tmp3, tmp2, global_min_sup, 100, algo_name)
        decode_seq_pat_algo_output(tmp2, tmp, all_distinct_courses)
        sort_spmf_seq_pat_algo_output(tmp)
        make_support_relative(tmp, work["subjectId"].nunique())
        if grade_bool:
            print(
                '"""POSTPROCESSING"""Sequential Patterns including grade 0.0 were removed.'
            )
            remove_grade_zero(tmp)
        print("OUTPUT: SEQUENTIAL PATTERNS")
        print_output(tmp, TRUNCATE_OUTPUT)
    print('"""POSTPROCESSING"""Script finished successfully: ', datetime.datetime.now())

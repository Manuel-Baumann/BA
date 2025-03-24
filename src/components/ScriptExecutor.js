import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Slider from 'rc-slider';
import { IcicleWithHover, BarChartWithTransitions, DiffChart } from './Graph';
import 'rc-slider/assets/index.css';
import '../css/ScriptExecutor.css';
import { buildFrequentItemsetHierarchy } from './helperFunctionsFreqItemsets';
import { buildAssRulesIcicleHierarchy } from './helperFunctionsAssRules';
import { buildIcicleHierarchySeqPats } from './helperFunctionsSeqPatterns';
import GradeLine from './GradeLine';

// New data structure for dynamic radio button groups
// values: [options1, options2, ...]
const radioGroupData = [
    {
        groupName: "Set of students",
        options: ['All students', 'Only students who graduated at RWTH'],
        info: "Only students who graduated at RWTH: Filtering for students who have passed all mandatory courses at RWTH, including the bachelor`s thesis."
    },
    /*{
        groupName: "Choose data filtering options",
        options: ['Prefiltered (no 0 credits and passed)', 'All data'],
        info: "Prefiltered (no 0 credits and passed): For some courses the students got 0 credits and passed, those are left out."
    },*/
    {
        groupName: "Type of academic data",
        options: ['Courses', 'Grades'],
        info: "Choose wether to run the algorithm on the courses names or the grades that the students got. Putting values into bins means for " +
            "grades, 1.0, 1.3, 1.7 -> 1 ... - and for courses putting math subjects into the Math-Bin and so on."
    },
    {
        groupName: "Time period",
        options: ['Year', 'Semester'],
        info: "Choose wether to run the algorithm on a semester`s basis or a year`s basis.",
    },
    {
        groupName: "Set of courses",
        options: ['All courses', 'Only not passed courses'],
        info: "Choose whether to include all courses or only failed courses."
    },
    { groupName: "Insights", options: ['Normal', 'Closed', 'Maximal'], info: "Choose which kind of ouput you want" },
    {
        groupName: "Analysis method",
        options: ['Frequent Itemsets', 'Association Rules', 'Sequence Patterns'],
        info: "Choose one of the three different types of information to be shown. Having Students as basis means not treating each" +
            " semester/year individually, but only each student.",
    },
];
// columnValues: [options1, options2, ...]
const radioGroupColumnData = [
    {
        options: ['All', 'm', 'w', 'x'],
        info: '',
        header: 'Gender'
    },
    {
        options: ['All', '1.0 (EU?)', '3.0 (Non-EU?)'],
        info: '',
        header: 'Nationality'
    },
    {
        options: ['All', '0 (RWTH University?)'],
        info: '',
        header: 'University'
    },
    {
        options: ['All', 'Bachelor of Science', 'Master of Science'],
        info: '',
        header: 'Degree'
    },
    {
        options: ['All', 'Informatik'],
        info: '',
        header: 'Subject'
    },
]
const infoMinMax = "Students will be sorted by their mean grade. Only those within the range (in %) will be considered."
const infoSemesters = "Only courses taken within the specified range will be considered."
const checkBoxGroupColumnData = [
    "BA passed",
    "BA not passed",
    "MA passed",
    "MA not passed",
    "Started in winter",
    "Started in summer"
]
let sizeOfData1 = 0
let sizeOfData2 = 0
let sizeOfDiffData = 0
let sizeOfDiffLeftData = 0
let sizeOfDiffRightData = 0
const allGrades = ['1.0', '1.3', '1.7', '2.0', '2.3', '2.7', '3.0', '3.3', '3.7', '4.0', '5.0']
const marksObj = { 0: '1.0', 1: '1.3', 2: '1.7', 3: '2.0', 4: '2.3', 5: '2.7', 6: '3.0', 7: '3.3', 8: '3.7', 9: '4.0', 10: '5.0' }

const amountOfUniqueStudentsInDatasetGLOBAL = 4260
const amountOfUniqueSemestersGLOBAL = 13701

const ScriptExecutor = () => {
    const [output1, setOutput1] = useState('');
    const [output2, setOutput2] = useState('');
    const [postProcOutput1, setPostProcOutput1] = useState('');  // Postproc output for column 1
    const [postProcOutput2, setPostProcOutput2] = useState('');  // Postproc output for column 2
    const [preOutput1, setPreOutput1] = useState('')
    const [preOutput2, setPreOutput2] = useState('')
    const [diffOutputLeft, setDiffOutputLeft] = useState('')
    const [diffOutputMiddle, setDiffOutputMiddle] = useState('')
    const [diffOutputRight, setDiffOutputRight] = useState('')
    const [diffData, setDiffData] = useState({})
    const [diffLeftData, setDiffLeftData] = useState({})
    const [diffRightData, setDiffRightData] = useState({})
    const [showDiffBool, setShowDiffBool] = useState(false)
    const [data1, setData1] = useState({});//buildIcicleHierarchy(["A#SUP:1", "A=>Y=>C#SUP:0.4", "A=>Y#SUP:0.9", "A=>Y=>K#SUP:0.1", "A=>Y=>L#SUP:0.1", "A=>Y=>M#SUP:0.1", "A=>Y=>M=>N#SUP:0.2"])
    const [data2, setData2] = useState({});
    const [lastExecuted1, setLastExecuted1] = useState(-1)
    const [lastExecuted2, setLastExecuted2] = useState(-1)
    const [numberOfOutputLines, setNumberOfOutputLines] = useState(200);
    const [rangeValues, setRangeValues] = useState({
        column1: [0, 100],  // Initial min and max values for Column 1
        column2: [0, 100]   // Initial min and max values for Column 2
    });
    const [semesters, setSemesters] = useState({
        column1: [60, 105],  // Initial min and max values for Column 1
        column2: [60, 105]   // Initial min and max values for Column 2
    });
    // Updated options for six dropdowns
    const [selectedValues, setSelectedValues] = useState(
        radioGroupData.map(group => group.options[0])  // Set the first option as the default
    );
    const [selectedColumnValues, setSelectedColumnValues] = useState({
        column1: radioGroupColumnData.map(group => group.options[0]),  // Set the first option for each group
        column2: radioGroupColumnData.map(group => group.options[0])   // Set the first option for each group
    });
    const [minSups, setMinSups] = useState({
        column1: 100,
        column2: 100
    })
    const [minConfs, setMinConfs] = useState({
        column1: 100,
        column2: 100
    })
    const [selectedCheckboxColumnValues, setSelectedCheckboxColumnValues] = useState({
        column1: checkBoxGroupColumnData.reduce((acc, option) => {
            acc[option] = true;
            return acc;
        }, {}),
        column2: checkBoxGroupColumnData.reduce((acc, option) => {
            acc[option] = true;
            return acc;
        }, {}),
    });
    const [studentsBasis, setStudentsBasis] = useState(false)
    const [filterFIOnlyOptional, setFilterFIOnlyOptional] = useState(false)
    const [binsBool, setBinsBool] = useState(false)
    const [binsArr, setBinsArr] = useState(['1.7', '2.7', '3.7', '4.0', '5.0'])
    const [currentBin, setCurrentBin] = useState('1.0')
    const resetRemainingGrades = () => {
        const filteredEntries = Object.entries(marksObj).filter(
            ([, value]) => !binsArr.includes(value)
        );
        const result = Object.fromEntries(
            filteredEntries.map(([_, value], index) => [index, value])
        );
        return result;
    }
    const [remainingGradesObj, setRemainingGradesObj] = useState(resetRemainingGrades())
    const [onlyMandatoryBool, setOnlyMandatoryBool] = useState(false)
    const [basisForSupport, setBasisForSupport] = useState(-1)
    const [basisForSupportLeft, setBasisForSupportLeft] = useState(-1)
    const [basisForSupportRight, setBasisForSupportRight] = useState(-1)
    const [isLoadingLeft, setIsLoadingLeft] = useState(false)
    const [isLoadingRight, setIsLoadingRight] = useState(false)

    // Execute Button was pressed
    const executeScript = async (columnIndex) => {
        const values = selectedValues
        const columnValues = columnIndex === 1 ? selectedColumnValues.column1 : selectedColumnValues.column2;
        const checkboxColumnData = columnIndex === 1 ? selectedCheckboxColumnValues.column1 : selectedCheckboxColumnValues.column2;
        const range = rangeValues[`column${columnIndex}`];
        const semesterRange = semesters[`column${columnIndex}`];
        let response = ''
        const binsBooleanForAlgorithm = values.at(1) === "Grades" ? binsBool : false
        const minS1 = minSups.column1[0] ? minSups.column1[0] : minSups.column1
        const minC1 = minConfs.column1[0] ? minConfs.column1[0] : minConfs.column1
        const minS2 = minSups.column2[0] ? minSups.column2[0] : minSups.column2
        const minC2 = minConfs.column2[0] ? minConfs.column2[0] : minConfs.column2
        try {
            // Execute the python script
            columnIndex === 1 ? setIsLoadingLeft(true) : setIsLoadingRight(true)
            response = await axios.post('http://localhost:5000/execute', {
                column: columnIndex,
                values: values,
                columnValues: columnValues,
                sliderMin: range[0],
                sliderMax: range[1],
                numberOfOutputLines,
                algoParams: {
                    toBeUsed: true,// boolean to use custom parameters for algorithms
                    minSup: columnIndex === 1 ? minS1 : minS2,
                    minConf: columnIndex === 1 ? minC1 : minC2
                },
                checkBoxData: Object.keys(checkboxColumnData).filter(k => checkboxColumnData[k]),
                studentsBasisBoolean: studentsBasis,
                binsBoolean: binsBooleanForAlgorithm,
                binsArray: binsArr,
                onlyMandatoryBoolean: onlyMandatoryBool,
                semesterMin: semesterRange[0],
                semesterMax: semesterRange[1],
                filterFIResults: filterFIOnlyOptional
            });
        } catch (error) {
            const errorMessage = `Error while executing script: ${error.message}`
            if (columnIndex === 1) {
                setOutput1(errorMessage);
                setPostProcOutput1('');
            } else {
                setOutput2(errorMessage);
                setPostProcOutput2('');
            }
        }
        try {
            let responseLines = response.data.output.split('\n');
            // Remove automatically generated output by spmf algorithm
            let i = 0;
            let first = 0;
            let last = 0;
            let leaveIn = 0;
            while (i < responseLines.length && i < 30) {
                // Remove .jar file filepath and all lines from first ====== to last ======
                if (responseLines[i].startsWith('=====') && first === 0) {
                    first = i - 2;
                }
                else if (responseLines[i].startsWith('=====') && first !== 0) {
                    last = i;
                }
                // Leave in important information
                if (responseLines[i].startsWith(' Number of association rules ') || responseLines[i].startsWith(' Pattern count')) {
                    leaveIn = i;
                }
                if (responseLines[i].startsWith('WARNING')) {
                    if (columnIndex === 1) {
                        setPreOutput1(responseLines[i])
                        setOutput1(responseLines[i]);
                        sizeOfData1 = 0
                        setData1(buildIcicleHierarchySeqPats([]))
                        setPostProcOutput1('');
                    } else {
                        setPreOutput2(responseLines[i])
                        setOutput2(responseLines[i]);
                        sizeOfData2 = 0
                        setData2(buildIcicleHierarchySeqPats([]))
                        setPostProcOutput2('');
                    }
                    throw new Error(responseLines[i])
                }
                i++;
            }
            if (first !== 0) {
                // Remove all lines from first to last, but leave in important information and the last ======
                responseLines = responseLines.slice(0, first).concat(responseLines[leaveIn].trim()).concat(responseLines[leaveIn + 1]).concat(responseLines.slice(last + 1));
            }

            // Get basis number of students/semesters (transactions) of algorithm
            const basisForSupportFromOutput = responseLines.filter(line => line.startsWith('Unique students in used dataset'))[0].split(':')[1].trim()
            setBasisForSupport(basisForSupportFromOutput)
            if (columnIndex === 1) {
                setBasisForSupportLeft(basisForSupportFromOutput)
            } else {
                setBasisForSupportRight(basisForSupportFromOutput)
            }

            // Filter POSTPROCESSING information and actual output and remove prefix for postprocessing
            const mainOutput = responseLines.filter(line => !line.startsWith('"""POSTPROCESSING"""')).join('\n');
            const preprocOutput = responseLines.filter(line => line.startsWith('"""POSTPROCESSING"""')).map(line => line.slice(20)).join('\n\n');

            // Set data for Graph
            let icicleData = {}
            const mainOutputSplitted = mainOutput.split('\n')

            // Only get output lines
            const index = mainOutputSplitted.findIndex(line => line.startsWith('OUTPUT:'))
            let onlyOutput = mainOutputSplitted.slice(index + 1).filter(line => line.trim() !== '')
            const preOutput = mainOutputSplitted.slice(0, index + 1).filter(line => line.trim() !== '')

            // Fine tune data based on the algorithm that was selected
            let lastExecuted = -1
            // Apply renaming if bins were applied
            if (binsBooleanForAlgorithm) {
                onlyOutput = renameOutputToBinsName(onlyOutput)
            }
            if (selectedValues.at(-1) === 'Sequence Patterns') {
                icicleData = buildIcicleHierarchySeqPats(onlyOutput, basisForSupportFromOutput, amountOfUniqueStudentsInDatasetGLOBAL);
                lastExecuted = 2
            } else if (selectedValues.at(-1) === 'Association Rules') {
                icicleData = buildAssRulesIcicleHierarchy(onlyOutput.map(str => str.replace(/==>/g, '=>')), basisForSupportFromOutput, amountOfUniqueStudentsInDatasetGLOBAL)
                lastExecuted = 1

            } else if (selectedValues.at(-1) === 'Frequent Itemsets') {
                icicleData = buildFrequentItemsetHierarchy(onlyOutput, basisForSupportFromOutput, amountOfUniqueStudentsInDatasetGLOBAL)
                lastExecuted = 0
            }

            // Set output in respective column
            if (columnIndex === 1) {
                setPostProcOutput1(preprocOutput);
                setPreOutput1(preOutput.join('\n'));
                setOutput1(onlyOutput.join('\n'));
                sizeOfData1 = icicleData.length
                setLastExecuted1(lastExecuted)
                setData1(icicleData);
            } else {
                setPostProcOutput2(preprocOutput);
                setPreOutput2(preOutput.join('\n'))
                setOutput2(onlyOutput.join('\n'));
                sizeOfData2 = icicleData.length
                setLastExecuted2(lastExecuted)
                setData2(icicleData);
            }
            setShowDiffBool(false)
        } catch (error) {
            const errorMessage = `Error while visualizing data: ${error.message}`
            let responseLines = response.data.output.split('\n')
            let warningLine = ''

            for (let i = 0; i < responseLines.length; i++) {
                if (responseLines[i].startsWith('WARNING')) {
                    warningLine = responseLines[i]
                    responseLines = responseLines.slice(0, i)
                    break
                }
            }
            if (columnIndex === 1) {
                setPreOutput1(responseLines.join("\n") + '\n\n' + warningLine.replace('WARNING', 'Result'))
                setOutput1(errorMessage);
                const icicleData = buildFrequentItemsetHierarchy(["Empty dataset #SUP:1"], 1, 1)
                sizeOfData1 = icicleData.length
                setData1(icicleData)
                setPostProcOutput1('');
            } else {
                setPreOutput2(responseLines.join("\n") + '\n\n' + warningLine.replace('WARNING', 'Result'))
                setOutput2(errorMessage);
                const icicleData = buildFrequentItemsetHierarchy(["Empty dataset #SUP:1"], 1, 1)
                sizeOfData2 = icicleData.length
                setData2(icicleData)
                setPostProcOutput2('');
            }
        }
        columnIndex === 1 ? setIsLoadingLeft(false) : setIsLoadingRight(false)
    };

    const compareOutputs = () => {
        if (lastExecuted1 === 0) { // Frequent Itemsets
            // Execute 
            const outputLines1 = output1.split('\n');
            const outputLines2 = output2.split('\n');

            const split1 = outputLines1.map((l, i) => [l.split('#SUP:')[0].trim().split(' || ').sort().join(' && '), l.split('#SUP:')[1].trim()])
            const split2 = outputLines2.map((l, i) => [l.split('#SUP:')[0].trim().split(' || ').sort().join(' && '), l.split('#SUP:')[1].trim()])
            const setOfStrings1 = new Set(split1.map(([str]) => str))
            const setOfStrings2 = new Set(split2.map(([str]) => str))
            const setOfNonUniqueStrings = new Set([...setOfStrings1].filter(item => setOfStrings2.has(item)))
            const setUnique1 = new Set([...setOfStrings1].filter(item => !setOfStrings2.has(item)))
            const setUnique2 = new Set([...setOfStrings2].filter(item => !setOfStrings1.has(item)))
            const arrayOfNonUniqueObjects = [...setOfNonUniqueStrings].map(item => ({ label: item, leftValue: split1.find(([str]) => str === item)?.[1], rightValue: split2.find(([str]) => str === item)?.[1], leftValueWithDifferentBasis: parseFloat(split1.find(([str]) => str === item)?.[1] * basisForSupportLeft / amountOfUniqueStudentsInDatasetGLOBAL), rightValueWithDifferentBasis: parseFloat(split2.find(([str]) => str === item)?.[1] * basisForSupportRight / amountOfUniqueStudentsInDatasetGLOBAL) }))
            const arrayOfUniqueObjectsLeft = [...setUnique1].map(item => ({ label: item, value: split1.find(([str]) => str === item)?.[1], valueWithDifferentBase: split1.find(([str]) => str === item)?.[1] * basisForSupportLeft / amountOfUniqueStudentsInDatasetGLOBAL }))
            const arrayOfUniqueObjectsRight = [...setUnique2].map(item => ({ label: item, value: split2.find(([str]) => str === item)?.[1], valueWithDifferentBase: split2.find(([str]) => str === item)?.[1] * basisForSupportRight / amountOfUniqueStudentsInDatasetGLOBAL }))
            // console.log(split1, split2, setOfStrings1, setOfStrings2)


            const uniqueToColumn1 = split1.filter(([str]) => !setOfStrings2.has(str));
            const uniqueToColumn2 = split2.filter(([str]) => !setOfStrings1.has(str));

            const o1 = uniqueToColumn1.map(([str, sup]) => `${str}       Support: ${sup}`)
            const o2 = arrayOfNonUniqueObjects.map((item) => `${item.label}       Support: left->${item.leftValue}  right->${item.rightValue}`)
            const o3 = uniqueToColumn2.map(([str, sup]) => `${str}       Support: ${sup}`)

            sizeOfDiffData = o2.length
            sizeOfDiffLeftData = o1.length
            sizeOfDiffRightData = o2.length
            setDiffData(arrayOfNonUniqueObjects)
            setDiffLeftData(arrayOfUniqueObjectsLeft)
            setDiffRightData(arrayOfUniqueObjectsRight)
            setDiffOutputLeft(o1.join('\n'));
            setDiffOutputMiddle(o2.join('\n'));
            setDiffOutputRight(o3.join('\n'));
            setShowDiffBool(true)
        }
        else if (lastExecuted1 == 2) {
            const outputLines1 = output1.split('\n')
            const outputLines2 = output2.split('\n')

            const split1 = outputLines1.map((l, i) => [l.split('#SUP:')[0].trim().split(' => ').map(side => side.split(' || ').sort().join(' && ')).join(' => '), l.split('#SUP:')[1].trim()])
            const split2 = outputLines2.map((l, i) => [l.split('#SUP:')[0].trim().split(' => ').map(side => side.split(' || ').sort().join(' && ')).join(' => '), l.split('#SUP:')[1].trim()])
            const setOfStrings1 = new Set(split1.map(([str]) => str))
            const setOfStrings2 = new Set(split2.map(([str]) => str))
            const setOfNonUniqueStrings = new Set([...setOfStrings1].filter(item => setOfStrings2.has(item)))
            const setUnique1 = new Set([...setOfStrings1].filter(item => !setOfStrings2.has(item)))
            const setUnique2 = new Set([...setOfStrings2].filter(item => !setOfStrings1.has(item)))
            const arrayOfNonUniqueObjects = [...setOfNonUniqueStrings].map(item => ({ label: item, leftValue: split1.find(([str]) => str === item)?.[1], rightValue: split2.find(([str]) => str === item)?.[1], leftValueWithDifferentBasis: parseFloat(split1.find(([str]) => str === item)?.[1] * basisForSupportLeft / amountOfUniqueStudentsInDatasetGLOBAL), rightValueWithDifferentBasis: parseFloat(split2.find(([str]) => str === item)?.[1] * basisForSupportRight / amountOfUniqueStudentsInDatasetGLOBAL) }))
            const arrayOfUniqueObjectsLeft = [...setUnique1].map(item => ({ label: item, value: split1.find(([str]) => str === item)?.[1], valueWithDifferentBase: split1.find(([str]) => str === item)?.[1] * basisForSupportLeft / amountOfUniqueStudentsInDatasetGLOBAL }))
            const arrayOfUniqueObjectsRight = [...setUnique2].map(item => ({ label: item, value: split2.find(([str]) => str === item)?.[1], valueWithDifferentBase: split2.find(([str]) => str === item)?.[1] * basisForSupportRight / amountOfUniqueStudentsInDatasetGLOBAL }))

            const uniqueToColumn1 = split1.filter(([str]) => !setOfStrings2.has(str));
            const uniqueToColumn2 = split2.filter(([str]) => !setOfStrings1.has(str));

            const o1 = uniqueToColumn1.map(([str, sup]) => `${str}       Support: ${sup}`)
            const o2 = arrayOfNonUniqueObjects.map((item) => `${item.label}       Support: left->${item.leftValue}  right->${item.rightValue}`)
            const o3 = uniqueToColumn2.map(([str, sup]) => `${str}       Support: ${sup}`)

            sizeOfDiffData = o2.length
            sizeOfDiffLeftData = o1.length
            sizeOfDiffRightData = o2.length
            setDiffData(arrayOfNonUniqueObjects)
            setDiffLeftData(arrayOfUniqueObjectsLeft)
            setDiffRightData(arrayOfUniqueObjectsRight)
            setDiffOutputLeft(o1.join('\n'));
            setDiffOutputMiddle(o2.join('\n'));
            setDiffOutputRight(o3.join('\n'));
            setShowDiffBool(true)
        }
        // Association Rules
        else {
            const outputLines1 = output1.split('\n')
            const outputLines2 = output2.split('\n')
            const split1 = outputLines1.map((l, i) => [l.split('#SUP:')[0].trim().split(' => ').map(side => side.split(' || ').sort().join(' && ')).join(' => '), l.split('#SUP:')[1].split('#CONF:')[0].trim(), l.split('#CONF:')[1].trim()])
            const split2 = outputLines2.map((l, i) => [l.split('#SUP:')[0].trim().split(' => ').map(side => side.split(' || ').sort().join(' && ')).join(' => '), l.split('#SUP:')[1].split('#CONF:')[0].trim(), l.split('#CONF:')[1].trim()])

            const setOfStrings1 = new Set(split1.map(([str]) => str))
            const setOfStrings2 = new Set(split2.map(([str]) => str))
            const setOfNonUniqueStrings = new Set([...setOfStrings1].filter(item => setOfStrings2.has(item)))
            const setUnique1 = new Set([...setOfStrings1].filter(item => !setOfStrings2.has(item)))
            const setUnique2 = new Set([...setOfStrings2].filter(item => !setOfStrings1.has(item)))
            const arrayOfNonUniqueObjects = [...setOfNonUniqueStrings].map(item => ({
                label: item,
                leftValue: split1.find(([str]) => str === item)?.[1],
                rightValue: split2.find(([str]) => str === item)?.[1],
                leftValueWithDifferentBasis: parseFloat(split1.find(([str]) => str === item)?.[1] * basisForSupportLeft / amountOfUniqueStudentsInDatasetGLOBAL),
                rightValueWithDifferentBasis: parseFloat(split2.find(([str]) => str === item)?.[1] * basisForSupportRight / amountOfUniqueStudentsInDatasetGLOBAL),
                leftConfidence: split1.find(([str]) => str === item)?.[2],
                rightConfidence: split2.find(([str]) => str === item)?.[2],
                leftConfidenceWithDifferentBase: parseFloat(split1.find(([str]) => str === item)?.[2] * basisForSupportLeft / amountOfUniqueStudentsInDatasetGLOBAL),
                rightConfidenceWithDifferentBase: parseFloat(split2.find(([str]) => str === item)?.[2] * basisForSupportRight / amountOfUniqueStudentsInDatasetGLOBAL)
            }))
            const arrayOfUniqueObjectsLeft = [...setUnique1].map(item => ({
                label: item,
                value: split1.find(([str]) => str === item)?.[1],
                valueWithDifferentBase: split1.find(([str]) => str === item)?.[1] * basisForSupportLeft / amountOfUniqueStudentsInDatasetGLOBAL,
                confidence: split1.find(([str]) => str === item)?.[2],
                confidenceWithDifferentBase: split1.find(([str]) => str === item)?.[2] * basisForSupportLeft / amountOfUniqueStudentsInDatasetGLOBAL
            }))
            const arrayOfUniqueObjectsRight = [...setUnique2].map(item => ({
                label: item,
                value: split2.find(([str]) => str === item)?.[1],
                valueWithDifferentBase: split2.find(([str]) => str === item)?.[1] * basisForSupportRight / amountOfUniqueStudentsInDatasetGLOBAL,
                confidence: split2.find(([str]) => str === item)?.[2],
                confidenceWithDifferentBase: split2.find(([str]) => str === item)?.[2] * basisForSupportLeft / amountOfUniqueStudentsInDatasetGLOBAL
            }))

            const uniqueToColumn1 = split1.filter(([str]) => !setOfStrings2.has(str));
            const uniqueToColumn2 = split2.filter(([str]) => !setOfStrings1.has(str));

            const o1 = uniqueToColumn1.map(([str, sup]) => `${str}       Support: ${sup}`)
            const o2 = arrayOfNonUniqueObjects.map((item) => `${item.label}       Support: left->${item.leftValue}  right->${item.rightValue}`)
            const o3 = uniqueToColumn2.map(([str, sup]) => `${str}       Support: ${sup}`)

            sizeOfDiffData = o2.length
            sizeOfDiffLeftData = o1.length
            sizeOfDiffRightData = o2.length
            setDiffData(arrayOfNonUniqueObjects)
            setDiffLeftData(arrayOfUniqueObjectsLeft)
            setDiffRightData(arrayOfUniqueObjectsRight)
            setDiffOutputLeft(o1.join('\n'));
            setDiffOutputMiddle(o2.join('\n'));
            setDiffOutputRight(o3.join('\n'));
            setShowDiffBool(true)
        }
    };

    const handleGroupSelection = (groupIndex, value) => {
        const updatedSelections = [...selectedValues];
        updatedSelections[groupIndex] = value;
        setSelectedValues(updatedSelections);
    };

    // Handle the range slider change for both columns
    const handleRangeChange = (values, columnIndex) => {
        const newRangeValues = { ...rangeValues };
        newRangeValues[`column${columnIndex}`] = values;
        setRangeValues(newRangeValues);
    };
    // Handle the range slider change for both columns
    const handleMinSupChange = (value, columnIndex) => {
        const newMinSupValues = { ...minSups };
        newMinSupValues[`column${columnIndex}`] = value;
        setMinSups(newMinSupValues);
    };
    const handleMinConfChange = (value, columnIndex) => {
        const newMinConfValues = { ...minConfs }
        newMinConfValues[`column${columnIndex}`] = value
        setMinConfs(newMinConfValues)
    }
    const handleCheckboxColumnValueChange = (event, columnIndex) => {
        const { name, checked } = event.target;
        setSelectedCheckboxColumnValues((prev) => ({
            ...prev,
            [`column${columnIndex}`]: {
                ...prev[`column${columnIndex}`],
                [name]: checked,
            },
        }));
    };

    const handleSetStudentsBasisChange = () => {
        setStudentsBasis((prev) => !prev);
    };
    const handleFilterFIResultsChange = () => {
        setFilterFIOnlyOptional((prev) => !prev)
    }
    const handleBinsBoolChange = () => {
        setBinsBool((prev) => !prev);
    };

    useEffect(() => {
        if (remainingGradesObj[0]) { setCurrentBin(remainingGradesObj[0]) }
    }, [remainingGradesObj])

    useEffect(() => {
        const updatedRemainingGrades = resetRemainingGrades();
        setRemainingGradesObj(updatedRemainingGrades)
    }, [binsArr])

    const addBinHandler = () => {
        setBinsArr((prev) => {
            let insertIndex = 0;
            for (const grade of prev) {
                if (grade < currentBin) insertIndex++;
                else if (grade === currentBin) return prev;
                else break;
            }
            const updatedBinsArr = [...prev.slice(0, insertIndex), currentBin, ...prev.slice(insertIndex)];
            return updatedBinsArr;
        });
    };
    const getBinOfItem = (item, index) => {
        const lastIndex = allGrades.findIndex(el => el === item) + 1
        const firstIndex = index === 0 ? 0 : allGrades.findIndex(el => el === binsArr[index - 1]) + 1
        return allGrades.slice(firstIndex, lastIndex).join(", ")
    }
    const handleDeleteBin = (index) => {
        setBinsArr(binsArr.slice(0, index).concat(binsArr.slice(index + 1)))
    }
    const renameOutputToBinsName = (data) => {
        const renameDataObj = {}
        const numRows = binsArr.length
        for (let i = 0; i < numRows; i++) {
            const inputElement = document.getElementById(`row-${i}`);
            if (inputElement) {
                renameDataObj[`${i + 1}.0`] = inputElement.value || inputElement.placeholder;
            }
        }
        return data.map((str) => {
            const firstHashIndex = str.indexOf('#')
            const rule = str.slice(0, firstHashIndex)
            const supportAndConfidence = str.slice(firstHashIndex)
            let updatedRule = rule
            Object.keys(renameDataObj).forEach((key) => {
                if (updatedRule.includes(key)) {
                    updatedRule = updatedRule.replace(new RegExp(key, "g"), renameDataObj[key]);
                }
            });
            return supportAndConfidence ? `${updatedRule}${supportAndConfidence}` : updatedRule;
        });
    }
    const handleOnlyMandatoryBoolChange = () => {
        setOnlyMandatoryBool((prev) => !prev)
    }
    const semesterToTerm = (semester) => {
        const year = 2000 + Math.floor((semester - 60) / 2);
        const term = semester % 2 === 0 ? 'S' : 'W';
        return year + term;
    };
    const handleSemesterChange = (values, columnIndex) => {
        const newRangeValues = { ...semesters };
        newRangeValues[`column${columnIndex}`] = values;
        setSemesters(newRangeValues);
    };

    return (
        <div className="container">

            {/* Dynamic Grouping of RadioButtons */}
            <h2>Options for both Cohorts</h2>
            <div className="radio-group-container">
                {radioGroupData.map((group, groupIndex) => (
                    <div key={groupIndex} className="radio-group">
                        <h3>{group.groupName}<span className="info-icon"> ℹ️
                            <span className="tooltip-text">{group.info}</span>
                        </span></h3>
                        {group.options.map((option, optionIndex) => (
                            <label key={optionIndex}>
                                <input
                                    type="radio"
                                    name={`group-${groupIndex}`}
                                    value={option}
                                    checked={selectedValues[groupIndex] === option}
                                    onChange={() => handleGroupSelection(groupIndex, option)}
                                />
                                {option}
                            </label>
                        ))}
                        {selectedValues.at(-1) !== 'Sequence Patterns' && group.groupName === 'Analysis method' ? <div className="checkbox-container">
                            <div key="Set Students as Basis">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="Set Students as basis"
                                        checked={studentsBasis}
                                        onChange={handleSetStudentsBasisChange}
                                    />
                                    Set Students as basis
                                </label>
                            </div>
                        </div> : null}
                        {selectedValues.at(-1) === 'Frequent Itemsets' && group.groupName === 'Analysis method' && selectedValues.at(1) === 'Courses' && selectedValues.at(-2) == 'Normal' ? <div className="checkbox-container">
                            <div key="FI filter only optional">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="FI filter only optional"
                                        checked={filterFIOnlyOptional}
                                        onChange={handleFilterFIResultsChange}
                                    />
                                    Filter results: Only non-mandatory
                                </label>
                            </div>
                        </div> : null}
                        {group.groupName === 'Type of academic data' ? <div key="OnlyMandatoryBool">
                            <label><input type="checkbox" name="Categorise: Mandatory / Optional" checked={onlyMandatoryBool} onChange={handleOnlyMandatoryBoolChange} />Categorise: Mandatory / Optional</label>
                        </div>
                            : null}
                        {selectedValues.at(1) === "Grades" && group.groupName === 'Type of academic data' ? <div className="checkbox-container">
                            <div key="Put values into bins">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="Put values into bins"
                                        checked={binsBool}
                                        onChange={handleBinsBoolChange}
                                    />
                                    Put values into bins
                                    <span className="info-icon">ℹ️
                                        <span className="tooltip-text">By choosing bins, you tell the algorithm to treat values as if they were different ones. For example, the default bins put '1.0', '1.3', '1.7' into the bin named '1', meaning they are treated as if they were the value '1'. You can rename the bins. </span>
                                    </span>
                                </label>
                                {binsBool ? <>
                                    <GradeLine addBinHandler={addBinHandler} handleDeleteBin={handleDeleteBin} binsArr={binsArr} setBinsArr={setBinsArr} allGrades={allGrades} setCurrentBin={setCurrentBin} currentBin={currentBin} />
                                    <table className="bins-table">
                                        <tbody>
                                            <tr>
                                                <th>Name of bin</th>
                                                <th>Content</th>
                                            </tr>
                                            {
                                                binsArr.map((item, index) =>
                                                    <tr key={(index + 1) * 4}>
                                                        <th><input type="text" id={`row-${index}`} key={`row-${index}`} maxLength={8} size="10" placeholder={index + 1} /></th>
                                                        <th><label key={(index + 1) * 2}> {getBinOfItem(item, index)} </label></th>
                                                    </tr>)
                                            }</tbody>
                                    </table>
                                </> : null}
                            </div>
                        </div> : null}
                    </div>

                ))}
                {/* Slider for Number of ouput lines */}
                <div className="slider-container">
                    <label>Output size: {numberOfOutputLines}  <span className="info-icon">ℹ️
                        <span className="tooltip-text">Amount of lines of output to be vizualized (200 -&gt; All produced output)</span>
                    </span></label>
                    <Slider
                        range
                        min={0}
                        max={200}
                        value={numberOfOutputLines}
                        onChange={(value) => setNumberOfOutputLines(value)}
                    />
                </div>
            </div>

            <div className="columns-container">
                <div className="column">
                    <h2>Cohort 1</h2>
                    {radioGroupColumnData.map((group, groupIndex) => (
                        <div key={groupIndex} className="radio-group">
                            <h3>{group.header}</h3>
                            {group.options.map((option, optionIndex) => (
                                <label key={optionIndex}>
                                    <input
                                        type="radio"
                                        name={`column1-group-${groupIndex}`}
                                        value={option}
                                        checked={selectedColumnValues.column1[groupIndex] === option}
                                        onChange={() => {
                                            const updatedValues = [...selectedColumnValues.column1];
                                            updatedValues[groupIndex] = option;
                                            setSelectedColumnValues({ ...selectedColumnValues, column1: updatedValues });
                                        }}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    ))}
                    <div className="checkbox-container">
                        <h3>Include the following students:<span className="info-icon">ℹ️
                            <span className="tooltip-text"><h4>If you exclude a group of students, they won't be considered by the algorithm. Don't exclude two groups that won't leave any students for the algorithm to run on.</h4></span>
                        </span></h3>
                        {checkBoxGroupColumnData.map((item, ind) => (
                            <div key={item}>
                                <label>
                                    <input
                                        type="checkbox"
                                        name={item}
                                        checked={selectedCheckboxColumnValues.column1[item]}
                                        onChange={(e) => handleCheckboxColumnValueChange(e, 1)}
                                    />
                                    {item}
                                </label>
                                {ind % 2 == 1 ? <hr className='checkbox' /> : null}
                            </div>
                        ))}
                    </div>
                    {/* Slider for Column 1 */}
                    < div className="slider-container" >
                        <label>Semesters:    Min: {semesterToTerm(semesters.column1[0])} | Max: {semesterToTerm(semesters.column1[1])}<span className="info-icon">ℹ️
                            <span className="tooltip-text">{infoSemesters}</span>
                        </span></label>
                        <Slider
                            range
                            min={60}
                            max={105}
                            value={semesters.column1}
                            onChange={(values) => handleSemesterChange(values, 1)}
                        />
                        <label>Students mean grades:    Min: {rangeValues.column1[0]} | Max: {rangeValues.column1[1]}<span className="info-icon">ℹ️
                            <span className="tooltip-text">{infoMinMax}</span>
                        </span></label>
                        <Slider
                            range
                            min={0}
                            max={100}
                            value={rangeValues.column1}
                            onChange={(values) => handleRangeChange(values, 1)}
                        />
                    </div>
                    {/* Checkbox and Slider for min_sup/min_conf  */}
                    <div>
                        <div className="slider-container">
                            <label>Minimum support: {minSups.column1}% <span className="info-icon">ℹ️
                                <span className="tooltip-text"> Choose the minimum support for the frequent itemsets </span>
                            </span> </label>
                            <Slider
                                range
                                min={1}
                                max={100}
                                value={minSups.column1}
                                onChange={(value) => handleMinSupChange(value, 1)}
                            />
                            {selectedValues.at(-1) === 'Association Rules' ? <div>

                                <label> Minimum confidence: {minConfs.column1}% <span className="info-icon">ℹ️
                                    <span className="tooltip-text"> Choose the minimum confidence for the association rules </span>
                                </span></label>
                                <Slider
                                    range
                                    min={0}
                                    max={100}
                                    value={minConfs.column1}
                                    onChange={(value) => handleMinConfChange(value, 1)}
                                />
                            </div> : null}
                        </div>
                    </div>
                    <button className="execute-button" onClick={() => executeScript(1)} disabled={isLoadingLeft}>
                        Execute Algorithm
                    </button>
                    <div>
                        <h3>Postprocessing:</h3>
                        <pre className="pre">{postProcOutput1}</pre>  {/* Extra output for column 1 */}
                        <h3>Information about the algorithm:</h3>
                        <pre className="pre">{preOutput1}</pre>  {/* Extra output for column 1 */}
                        {/* Graph */}
                        {lastExecuted1 !== 0 ?
                            lastExecuted1 === -1 ? <></> :
                                <div className='graph-container' style={{ width: '80%', height: '80%', margin: '0 auto' }}>
                                    <IcicleWithHover data={data1} setData={setData1} basisForSupport={basisForSupportLeft} />
                                </div> : <div className='graph-container' style={{ width: '80%', height: '80%', margin: '0 auto' }}>
                                <BarChartWithTransitions data={data1} sizeOfData={sizeOfData1} setData={setData1} basisForSupport={basisForSupportLeft} />
                            </div>}
                        {/*<h3>Output as text:</h3>
                        <pre>{output1}</pre>*/}
                    </div>
                </div>

                <div className="column">
                    <h2>Cohort 2</h2>
                    {radioGroupColumnData.map((group, groupIndex) => (
                        <div key={groupIndex} className="radio-group">
                            <h3>{group.header}</h3>
                            {group.options.map((option, optionIndex) => (
                                <label key={optionIndex}>
                                    <input
                                        type="radio"
                                        name={`column2-group-${groupIndex}`}
                                        value={option}
                                        checked={selectedColumnValues.column2[groupIndex] === option}
                                        onChange={() => {
                                            const updatedValues = [...selectedColumnValues.column2];
                                            updatedValues[groupIndex] = option;
                                            setSelectedColumnValues({ ...selectedColumnValues, column2: updatedValues });
                                        }}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>
                    ))}
                    <div className="checkbox-container">
                        <h3>Include the following students:<span className="info-icon">ℹ️
                            <span className="tooltip-text"><h4>If you exclude a group of students, they won't be considered by the algorithm. Don't exclude two groups that won't leave any students for the algorithm to run on.</h4></span>
                        </span></h3>
                        {checkBoxGroupColumnData.map((item, ind) => (
                            <div key={item}>
                                <label>
                                    <input
                                        type="checkbox"
                                        name={item}
                                        checked={selectedCheckboxColumnValues.column2[item]}
                                        onChange={(e) => handleCheckboxColumnValueChange(e, 2)}
                                    />
                                    {item}
                                </label>
                                {ind % 2 == 1 ? <hr className='checkbox' /> : null}
                            </div>
                        ))}
                    </div>
                    {/* Slider for Column 2 */}
                    <div className="slider-container">
                        <label>Semesters:    Min: {semesterToTerm(semesters.column2[0])} | Max: {semesterToTerm(semesters.column2[1])}<span className="info-icon">ℹ️
                            <span className="tooltip-text">{infoSemesters}</span>
                        </span></label>
                        <Slider
                            range
                            min={60}
                            max={105}
                            value={semesters.column2}
                            onChange={(values) => handleSemesterChange(values, 2)}
                        />
                        <label>Students mean grades:    Min: {rangeValues.column2[0]} | Max: {rangeValues.column2[1]} <span className="info-icon">ℹ️
                            <span className="tooltip-text">{infoMinMax}</span>
                        </span> </label>
                        <Slider
                            range
                            min={1}
                            max={100}
                            value={rangeValues.column2}
                            onChange={(values) => handleRangeChange(values, 2)}
                        />
                    </div>
                    {/* Checkbox and Slider for min_sup/min_conf  */}
                    <div>
                        <div className="slider-container">

                            <label>Minimum support: {minSups.column2}% <span className="info-icon">ℹ️
                                <span className="tooltip-text"> Choose the minimum support for the frequent itemsets </span>
                            </span> </label>
                            <Slider
                                range
                                min={1}
                                max={100}
                                value={minSups.column2}
                                onChange={(value) => handleMinSupChange(value, 2)}
                            />
                            {selectedValues.at(-1) === 'Association Rules' ? <div>

                                <label>Minimum confidence: {minConfs.column2}% <span className="info-icon">ℹ️
                                    <span className="tooltip-text"> Choose the minimum confidence for the association rules </span>
                                </span> </label>
                                <Slider
                                    range
                                    min={0}
                                    max={100}
                                    value={minConfs.column2}
                                    onChange={(value) => handleMinConfChange(value, 2)}
                                />
                            </div> : null}
                        </div>
                    </div>
                    <button className="execute-button" onClick={() => executeScript(2)} disabled={isLoadingRight}>
                        Execute Algorithm
                    </button>
                    <div>
                        <h3>Postprocessing:</h3>
                        <pre className="pre">{postProcOutput2}</pre>  {/* Extra output for column 2 */}
                        <h3>Information about the algorithm:</h3>
                        <pre className="pre">{preOutput2}</pre>  {/* Extra output for column 1 */}
                        {/* Graph */}
                        {lastExecuted2 !== 0 ?
                            lastExecuted2 === -1 ? <></> :
                                <div className='graph-container' style={{ width: '80%', height: '80%', margin: '0 auto' }}>
                                    <IcicleWithHover data={data2} setData={setData2} basisForSupport={basisForSupportRight} />
                                </div> : <div className='graph-container' style={{ width: '80%', height: '80%', margin: '0 auto' }}>
                                <BarChartWithTransitions data={data2} sizeOfData={sizeOfData2} setData={setData2} basisForSupport={basisForSupportRight} />
                            </div>}
                        {/*<h3>Output as text:</h3>
                        <pre>{output2}</pre>*/}
                    </div>
                </div>
            </div>

            {/* Comparison Output Field */}
            {/* Only shows if compare-button was pressed */}
            {/* Compare-button only shows if both columns last executed the same algorithm*/}
            {showDiffBool ? (
                <><hr />
                    <h3>Compare Outputs</h3>
                    <div className="compare-output">
                        <pre style={{ width: '20%' }}><h4>Only in left column <span className="info-icon">ℹ️
                            <span className="tooltip-text"> This graph shows itemsets and their support. You can hover over the itemsets and get information about them. </span>
                        </span></h4>{diffOutputLeft && diffOutputLeft.length > 0 ? <div className='compare-container'>{/*diffOutputLeft*/}<BarChartWithTransitions data={diffLeftData} sizeOfData={sizeOfDiffLeftData} setData={setDiffLeftData} basisForSupport={basisForSupportLeft} /></div> : <></>}</pre>
                        <pre style={{ width: '60%' }}><h4>In both columns<span className="info-icon">ℹ️
                            <span className="tooltip-text"> This graph shows itemsets, rules or patterns that exist in both the output on the left cohort AND the right cohort. Blue bars show the difference in support between the cohorts. Hover over the bars to find out information on the itemsets.</span>
                        </span></h4>{diffOutputMiddle ? <div className="compare-container"><DiffChart data={diffData} sizeOfData={sizeOfDiffData} setData={setDiffData} basisForSupportLeft={basisForSupportLeft} basisForSupportRight={basisForSupportRight} /></div> : <></>}</pre>
                        <pre style={{ width: '20%' }}><h4>Only in right column <span className="info-icon">ℹ️
                            <span className="tooltip-text"> This graph shows itemsets and their support. You can hover over the itemsets and get information about them. </span>
                        </span></h4>{diffOutputRight && diffOutputRight.length > 0 ? <div className='compare-container'>{/*diffOutputRight*/}<BarChartWithTransitions data={diffRightData} sizeOfData={sizeOfDiffRightData} setData={setDiffRightData} basisForSupport={basisForSupportRight} /></div> : <></>}</pre>
                    </div></>
            ) : lastExecuted1 === lastExecuted2 && lastExecuted1 != -1 ? <button className="compare-button" onClick={compareOutputs}>Show the difference between columns</button> : <></>
            }
        </div>
    );
};

export default ScriptExecutor;

import React, { useState } from 'react';
import axios from 'axios';
import Slider from 'rc-slider';
import { IcicleWithHover } from './Graph';
import 'rc-slider/assets/index.css';
import '../css/ScriptExecutor.css';
import { buildFrequentItemsetHierarchy } from './helperFunctionsFreqItemsets';
import { buildAssRulesIcicleHierarchy } from './helperFunctionsAssRules';
import { buildIcicleHierarchySeqPats } from './helperFunctionsSeqPatterns';

// New data structure for dynamic radio button groups
// values: [options1, options2, ...]
const radioGroupData = [
    {
        groupName: "Select the category of students",
        options: ['All students', 'Only students who graduated at RWTH'],
        info: "Only students who graduated at RWTH: Filtering for students who have passed all mandatory courses at RWTH, including the bachelor`s thesis."
    },
    /*{
        groupName: "Choose data filtering options",
        options: ['Prefiltered (no 0 credits and passed)', 'All data'],
        info: "Prefiltered (no 0 credits and passed): For some courses the students got 0 credits and passed, those are left out."
    },*/
    {
        groupName: "Select the type of academic data",
        options: ['Courses', 'Grades'],
        info: "Choose wether to run the algorithm on the courses names or the grades that the students got."
    },
    {
        groupName: "Select the time period",
        options: ['Year', 'Semester'],
        info: "Choose wether to run the algorithm on a semester`s basis or a year`s basis.",
    },
    {
        groupName: "Select the set of courses",
        options: ['All courses', 'Only not passed courses'],
        info: "Choose whether to include all courses or only failed courses."
    },
    { groupName: "Insights", options: ['Normal', 'Closed', 'Maximal'], info: "Choose which kind of ouput you want" },
    {
        groupName: "Select the analysis method",
        options: ['Frequent Itemsets', 'Association Rules', 'Sequence Patterns'],
        info: "Choose one of the three different types of information to be shown."
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
        options: ['All', '1.0 (German?)', '3.0 (?)'],
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
const checkBoxGroupColumnData = [
    "BA passed",
    "BA not passed",
    "MA passed",
    "MA not passed",
    "Started in winter",
    "Started in summer"
]

const ScriptExecutor = () => {
    const [output1, setOutput1] = useState('');
    const [output2, setOutput2] = useState('');
    const [postProcOutput1, setPostProcOutput1] = useState('');  // Postproc output for column 1
    const [postProcOutput2, setPostProcOutput2] = useState('');  // Postproc output for column 2
    const [preOutput1, setPreOutput1] = useState('')
    const [preOutput2, setPreOutput2] = useState('')
    const [compareOutputVisible, setCompareOutputVisible] = useState(false);  // State to control comparison output
    const [data1, setData1] = useState({});//buildIcicleHierarchy(["A#SUP:1", "A=>Y=>C#SUP:0.4", "A=>Y#SUP:0.9", "A=>Y=>K#SUP:0.1", "A=>Y=>L#SUP:0.1", "A=>Y=>M#SUP:0.1", "A=>Y=>M=>N#SUP:0.2"])
    const [data2, setData2] = useState({});
    const [numberOfOutputLines, setNumberOfOutputLines] = useState(35);
    const [rangeValues, setRangeValues] = useState({
        column1: [0, 100],  // Initial min and max values for Column 1
        column2: [0, 100]   // Initial min and max values for Column 2
    });
    // Updated options for six dropdowns
    const [selectedValues, setSelectedValues] = useState(
        radioGroupData.map(group => group.options[0])  // Set the first option as the default
    );
    const [selectedColumnValues, setSelectedColumnValues] = useState({
        column1: radioGroupColumnData.map(group => group.options[0]),  // Set the first option for each group
        column2: radioGroupColumnData.map(group => group.options[0])   // Set the first option for each group
    });
    const [checkAlgoParams, setCheckAlgoParams] = useState({
        column1: false,
        column2: false
    })
    const [minSups, setMinSups] = useState({
        column1: 0,
        column2: 0
    })
    const [minConfs, setMinConfs] = useState({
        column1: 0,
        column2: 0
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



    const executeScript = async (columnIndex) => {
        const values = selectedValues
        const columnValues = columnIndex === 1 ? selectedColumnValues.column1 : selectedColumnValues.column2;
        const checkboxColumnData = columnIndex === 1 ? selectedCheckboxColumnValues.column1 : selectedCheckboxColumnValues.column2;
        const studentsBasisBoolean = studentsBasis;
        const range = rangeValues[`column${columnIndex}`];
        let response = ''
        try {
            // Execute the python script
            response = await axios.post('http://localhost:5000/execute', {
                column: columnIndex,
                values: values,
                columnValues: columnValues,
                sliderMin: range[0],
                sliderMax: range[1],
                numberOfOutputLines,
                algoParams: {
                    toBeUsed: checkAlgoParams[`column${columnIndex}`],
                    minSup: minSups[`column${columnIndex}`] !== 0 ? minSups[`column${columnIndex}`][0] : 0,
                    minConf: minConfs[`column${columnIndex}`] !== 0 ? minConfs[`column${columnIndex}`][0] : 0
                },
                checkBoxData: Object.keys(checkboxColumnData).filter(k => checkboxColumnData[k]),
                studentsBasisBoolean: studentsBasisBoolean
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
                    throw new Error("Empty dataset!")
                }
                i++;
            }
            if (first !== 0) {
                // Remove all lines from first to last, but leave in important information and the last ======
                responseLines = responseLines.slice(0, first).concat(responseLines[leaveIn].trim()).concat(responseLines[leaveIn + 1]).concat(responseLines.slice(last + 1));
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
            if (selectedValues.at(-1) === 'Sequence Patterns') {
                icicleData = buildIcicleHierarchySeqPats(onlyOutput);
            } else if (selectedValues.at(-1) === 'Association Rules') {
                icicleData = buildAssRulesIcicleHierarchy(onlyOutput.map(str => str.replace(/==>/g, '=>')))

            } else if (selectedValues.at(-1) === 'Frequent Itemsets') {
                icicleData = buildFrequentItemsetHierarchy(onlyOutput)
            }

            // Set output in respective column
            if (columnIndex === 1) {
                setPostProcOutput1(preprocOutput);
                setPreOutput1(preOutput.join('\n'));
                setOutput1(onlyOutput.join('\n'));
                setData1(icicleData);
            } else {
                setPostProcOutput2(preprocOutput);
                setPreOutput2(preOutput.join('\n'))
                setOutput2(onlyOutput.join('\n'));
                setData2(icicleData);
            }
            setCompareOutputVisible(false)
        } catch (error) {
            const errorMessage = `Error while visualizing data: ${error.message}`
            let responseLines = response.data.output.split('\n')

            for (let i = 0; i < responseLines.length; i++) {
                if (responseLines[i].startsWith('WARNING')) {
                    responseLines = responseLines.slice(0, i)
                    break
                }
            }
            if (columnIndex === 1) {
                setPreOutput1(responseLines.join("\n"))
                setOutput1(errorMessage);
                setData1(buildIcicleHierarchySeqPats([]))
                setPostProcOutput1('');
            } else {
                setPreOutput2(responseLines.join("\n"))
                setOutput2(errorMessage);
                setData2(buildIcicleHierarchySeqPats([]))
                setPostProcOutput2('');
            }

        }
    };

    const compareOutputs = () => {
        const outputLines1 = output1.split('\n');
        const outputLines2 = output2.split('\n');

        // Filter lines that are only in column 1 or column 2
        const uniqueToColumn1 = outputLines1.filter(line => !outputLines2.includes(line));
        const uniqueToColumn2 = outputLines2.filter(line => !outputLines1.includes(line));

        setOutput1(uniqueToColumn1.join('\n'));
        setOutput2(uniqueToColumn2.join('\n'));

        setCompareOutputVisible(true)
    };

    // Function to handle checkbox toggle
    const handleCheckboxChange = (event, columnIndex) => {
        const newCheck = { ...checkAlgoParams }
        newCheck[`column${columnIndex}`] = event.target.checked
        setCheckAlgoParams(newCheck);
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

    return (
        <div className="container">

            {/* Dynamic Grouping of RadioButtons */}
            <div className="radio-group-container">
                {radioGroupData.map((group, groupIndex) => (
                    <div key={groupIndex} className="radio-group">
                        <span className="info-icon">ℹ️
                            <span className="tooltip-text">{group.info}</span>
                        </span><h3>{group.groupName}</h3>
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
                        {selectedValues.at(-1) !== 'Sequence Patterns' && group.groupName === 'Select the analysis method' ? <div className="checkbox-container">
                            <div key="Set Students as Basis">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="Set Students as basis"
                                        checked={studentsBasis}
                                        onChange={handleSetStudentsBasisChange}
                                    />
                                    Set Students as Basis
                                </label>
                            </div>
                        </div> : null}
                    </div>

                ))}
                {/* Slider for Number of ouput lines */}
                <div className="slider-container">
                    <span className="info-icon">ℹ️
                        <span className="tooltip-text">Amount of lines of output to be vizualized (200 -> All produced output)</span>
                    </span>
                    <label>Output size: {numberOfOutputLines}</label>
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
                        <h3>Include the following students:</h3>
                        {checkBoxGroupColumnData.map((item) => (
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
                            </div>
                        ))}
                    </div>
                    {/* Slider for Column 1 */}
                    <div className="slider-container">
                        <span className="info-icon">ℹ️
                            <span className="tooltip-text">{infoMinMax}</span>
                        </span>
                        <label>Min: {rangeValues.column1[0]} | Max: {rangeValues.column1[1]}</label>
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

                        <label htmlFor='checkbox'>
                            Use custom parameters for algorithm
                            <input type="checkbox" id="c1" name="c1" value="params1" checked={checkAlgoParams.column1} onChange={(event) => handleCheckboxChange(event, 1)} />
                        </label>
                        {checkAlgoParams.column1 ? <div className="slider-container">
                            <span className="info-icon">ℹ️
                                <span className="tooltip-text"> Choose the minimum support for the frequent itemsets </span>
                            </span>
                            <label>Minimum support: {minSups.column1}%</label>
                            <Slider
                                range
                                min={0}
                                max={100}
                                value={minSups.column1}
                                onChange={(value) => handleMinSupChange(value, 1)}
                            />
                            {selectedValues.at(-1) === 'Association Rules' ? <div>
                                <span className="info-icon">ℹ️
                                    <span className="tooltip-text"> Choose the minimum confidence for the association rules </span>
                                </span>
                                <label>Minimum confidence: {minConfs.column1}%</label>
                                <Slider
                                    range
                                    min={0}
                                    max={100}
                                    value={minConfs.column1}
                                    onChange={(value) => handleMinConfChange(value, 1)}
                                />
                            </div> : null}</div> : null}
                    </div>
                    <button className="execute-button" onClick={() => executeScript(1)}>
                        Execute Algorithm
                    </button>
                    <div>
                        <h3>Postprocessing:</h3>
                        <pre className="pre">{postProcOutput1}</pre>  {/* Extra output for column 1 */}
                        <h3>Information about the algorithm:</h3>
                        <pre className="pre">{preOutput1}</pre>  {/* Extra output for column 1 */}
                        {/* Graph */}
                        <div className='graph-container' style={{ width: '80%', height: '80%', margin: '0 auto' }}>
                            <IcicleWithHover data={data1} />
                        </div>
                        <h3>Output:</h3>
                        <pre>{output1}</pre>
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
                        <h3>Include the following students:</h3>
                        {checkBoxGroupColumnData.map((item) => (
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
                            </div>
                        ))}
                    </div>
                    {/* Slider for Column 2 */}
                    <div className="slider-container">
                        <span className="info-icon">ℹ️
                            <span className="tooltip-text">{infoMinMax}</span>
                        </span>
                        <label>Min: {rangeValues.column2[0]} | Max: {rangeValues.column2[1]}</label>
                        <Slider
                            range
                            min={0}
                            max={100}
                            value={rangeValues.column2}
                            onChange={(values) => handleRangeChange(values, 2)}
                        />
                    </div>
                    {/* Checkbox and Slider for min_sup/min_conf  */}
                    <div>

                        <label htmlFor='checkbox'>
                            Use custom parameters for algorithm
                            <input type="checkbox" id="c2" name="c2" value="params2" checked={checkAlgoParams.column2} onChange={(event) => handleCheckboxChange(event, 2)} />
                        </label>
                        {checkAlgoParams.column2 ? <div className="slider-container">
                            <span className="info-icon">ℹ️
                                <span className="tooltip-text"> Choose the minimum support for the frequent itemsets </span>
                            </span>
                            <label>Minimum support: {minSups.column2}%</label>
                            <Slider
                                range
                                min={0}
                                max={100}
                                value={minSups.column2}
                                onChange={(value) => handleMinSupChange(value, 2)}
                            />
                            {selectedValues.at(-1) === 'Association Rules' ? <div>
                                <span className="info-icon">ℹ️
                                    <span className="tooltip-text"> Choose the minimum confidence for the association rules </span>
                                </span>
                                <label>Minimum confidence: {minConfs.column2}%</label>
                                <Slider
                                    range
                                    min={0}
                                    max={100}
                                    value={minConfs.column2}
                                    onChange={(value) => handleMinConfChange(value, 2)}
                                />
                            </div> : null}</div> : null}
                    </div>
                    <button className="execute-button" onClick={() => executeScript(2)}>
                        Execute Algorithm
                    </button>
                    <div>
                        <h3>Postprocessing:</h3>
                        <pre className="pre">{postProcOutput2}</pre>  {/* Extra output for column 2 */}
                        <h3>Information about the algorithm:</h3>
                        <pre className="pre">{preOutput2}</pre>  {/* Extra output for column 1 */}
                        {/* Graph */}
                        <div className='graph-container' style={{ width: '80%', height: '80%', margin: '0 auto' }}>
                            <IcicleWithHover data={data2}
                            /></div>
                        <h3>Output:</h3>
                        <pre>{output2}</pre>
                    </div>
                </div>
            </div>

            <button className="compare-button" onClick={compareOutputs}>Show only lines that don't exist in the other column</button>

            {/* Comparison Output Field */}
            {compareOutputVisible && (
                <>
                    <hr />
                    <div className="compare-output">
                        <h3>Compare Outputs</h3>
                        <pre>{postProcOutput1}</pre>
                        <pre>{postProcOutput2}</pre>
                    </div>
                </>
            )}
        </div>
    );
};

export default ScriptExecutor;
import React, { useState, useEffect } from "react";
import '../css/GradeLine.css';

const GradeLine = ({ addBinHandler, handleDeleteBin, binsArr, setBinsArr, allGrades, setCurrentBin, currentBin }) => {
    const [clicked, setClicked] = useState(-1)
    const [click, setClick] = useState(0)
    const [nextClick, setNextClick] = useState(0)

    useEffect(() => {
        if (clicked !== -1) {
            setCurrentBin(allGrades[clicked])
        }
        setNextClick((prev) => prev + 1)
    }, [click])

    useEffect(() => {
        if (binsArr.includes(currentBin)) {
            handleDeleteBin(binsArr.findIndex((element) => element === currentBin))
        }
        else {
            addBinHandler()
        }
    }, [nextClick])

    const handleBinClick = (index) => {
        setClicked(index)
        setClick((prev) => prev + 1)
    };

    return (
        <div className="grade-line-container">
            <div className="grade-line">
                {allGrades.map((grade, index) => (
                    <div className="grade-item" key={grade}>
                        {/* Grade Marker */}
                        {<div className="grade-marker">{grade}
                            {/* Invisible Box */}
                            <div className="invisible-box" />
                        </div>
                        }

                        {/* Red Line and Button (only after the first grade) */}
                        {index < allGrades.length - 1 && (
                            <div className="between-grade">
                                {/* Red Line */}
                                {binsArr.includes(allGrades[index]) && (
                                    <div className="red-line" />
                                )}
                                {/* Black Line */}
                                {!binsArr.includes(allGrades[index]) && (
                                    <div className="black-line" />
                                )}


                                {/* Add/Remove Bin Button */}
                                <button
                                    className="action-button"
                                    onClick={() => handleBinClick(index)}
                                >
                                    {binsArr.includes(allGrades[index])
                                        ? "-"
                                        : "+"}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GradeLine;

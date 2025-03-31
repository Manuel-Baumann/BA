import React from "react";
import ScriptExecutor from "./components/ScriptExecutor";
import "./css/App.css";

function App() {
    const explanation =
        "In this tool, you can run different algorithms on academic data that will give " +
        "you Frequent Itemsets, Association Rules or Sequence Patterns within that data.  " +
        "You can also select various options and filters for what subset of data the algorithm should run on.  " +
        "There are two columns to allow for an easy comparison of two different cohorts of students." +
        "The upper selection fields will apply to both cohorts and the filters in each column will only apply to that cohort.";

    return (
        <div className="App">
            <header className="App-header">
                <h1>
                    Frequent Itemsets, Association Rules and Sequence Patterns
                    of Educational Data
                </h1>
            </header>
            {/* Explanation Text */}
            <div className="explanation">
                <p>{explanation}</p>
            </div>
            <ScriptExecutor />
        </div>
    );
}

export default App;

// Sunburst.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import debounce from 'lodash.debounce'
import '../css/Graph.css';

export const IcicleWithHover = ({ data, setData, basisForSupport }) => {
    const ref = useRef();
    const tooltipRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [hoveredNode, setHoveredNode] = useState(null);
    const [breadcrumbPath, setBreadcrumbPath] = useState([]);
    const [supportBasedOnSelectedDataset, setSupportBasedOnSelectedDataset] = useState(true)

    useEffect(() => {
        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });

        if (ref.current) {
            resizeObserver.observe(ref.current);
        }

        return () => resizeObserver.disconnect();
    }, [supportBasedOnSelectedDataset]);

    useEffect(() => {
        try {
            if (hoveredNode) {
                setBreadcrumbPath(hoveredNode.ancestors().reverse().slice(1));
            } else {
                setBreadcrumbPath([]);
            }
        } catch (error) {
            console.error('Error updating breadcrumbs:', error);
            setBreadcrumbPath([]); // Clear breadcrumbs in case of error
        }
    }, [hoveredNode]);

    const handleSwitch = () => {
        setData((prev) => {
            let newData = prev
            switchSupportBaseRecursively(newData)
            return newData
        })
        console.log(data)
        setSupportBasedOnSelectedDataset((prev) => !prev)
    }
    const switchSupportBaseRecursively = (child) => {
        if (child.support && child.supportWithDifferentBase) {
            const sup = child.support
            const supWDB = child.supportWithDifferentBase
            child.support = supWDB
            child.supportWithDifferentBase = sup
            child.size = supWDB
        }
        child.children.forEach((c) => switchSupportBaseRecursively(c))
    }

    useEffect(() => {
        if (dimensions.width === 0 || dimensions.height === 0) return;

        const width = dimensions.width;
        const height = dimensions.height;
        const svg = d3.select(ref.current);

        svg.selectAll('*').remove(); // Clear previous render

        // Set up root hierarchy with D3 partition layout
        const root = d3
            .hierarchy(data, (d) => d.children)
            .sum((d) => d.size)
            .each((node) => {
                node.id = (node.parent ? `${node.parent.id}->` : '') + node.data.name;
            });


        const partition = d3.partition().size([width, height]);
        partition(root);


        const color = d3.scaleSequential([0, root.height], d3.scaleLinear()
            .domain([0, 1]) // Domain from 0 to 1, to control intensity across the data range
            .range(["#006400", "#a8d08d"])); // Start with a dark green (#006400) and transition to a lighter green (#a8d08d)

        // Draw each rectangle
        const rects = svg
            .selectAll('rect')
            .data(root.descendants().filter(d => d.depth > 0))
            .enter()
            .append('rect')
            .attr('x', (d) => d.x0)
            .attr('y', (d) => d.y0)
            .attr('width', (d) => d.x1 - d.x0)
            .attr('height', (d) => d.y1 - d.y0)
            .attr('fill', (d) => color(d.depth))
            .attr('stroke', '#fff')
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                let htmlText = ""
                if (d.data.name && d.data.name !== 'undefined') {
                    setHoveredNode(d);
                    highlightPath(d);
                    htmlText = getHTML(d.data.name, d.data.support, d.data.finalSum, d.depth, d.data.confidence)
                } else {
                    setHoveredNode(null)
                    highlightPath();
                    htmlText = `<strong>Hover over a node</strong>`
                }
                d3.select(tooltipRef.current)
                    .style('opacity', 1)
                    .html(htmlText);
                // Update the tooltip position when mouse moves
                d3.select(event.currentTarget).on("mousemove", (event) => {
                    const [mouseX, mouseY] = d3.pointer(event); // Get mouse position
                    // Position the tooltip at the mouse's location
                    d3.select(tooltipRef.current)
                        .style("left", `${mouseX + 95}px`) // Add offset to avoid it being directly under the cursor
                        .style("top", `${mouseY + 110}px`); // Add offset
                })
            }).on('mouseout', function () {
                setHoveredNode(null);
                resetHighlight();
                d3.select(tooltipRef.current).style('opacity', 0);
            });

        // Highlight only the path to the hovered node (not its children)
        function highlightPath(node) {
            if (node) {
                rects.style('opacity', (d) => 0.4);
                let currentNode = node
                while (currentNode.parent !== null) {
                    rects
                        .filter((d) => d.depth === currentNode.depth && d.data.name === currentNode.data.name && currentNode.x0 == d.x0 && currentNode.y0 == d.y0 && currentNode.x1 == d.x1 && currentNode.y1 == d.y1) // Match specific depth and name
                        .style('opacity', 1); // Set desired opacity
                    currentNode = currentNode.parent
                }
            }
        }
        // Reset highlight
        function resetHighlight() {
            rects.style('opacity', 1);
        }

        // Add labels to each rectangle if there's enough space
        svg
            .selectAll('text')
            .data(root.descendants().filter(d => d.depth > 0))
            .enter()
            .append('text')
            .attr('x', (d) => d.x0 + 5)
            .attr('y', (d) => d.y0 + (d.y1 - d.y0) / 2)
            .attr('dy', '0.35em')
            .text((d) => (d.x1 - d.x0 > 40 ? d.data.name : '')) // Display label if there's space, d.data.name
            .style('font-size', '10px')
            .style('fill', 'black');

    }, [data, dimensions, hoveredNode]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {/* Breadcrumbs */}
            <div
                style={{
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                }}
            >
                {breadcrumbPath.length !== 0 ? breadcrumbPath.map((node, i) => (
                    <React.Fragment key={node.id || `${node.data.name}-${i}`}>
                        {i > 0 && <span>➔</span>}
                        <span>{node.data.name}</span>
                    </React.Fragment>
                )) : <span>Hover over a node</span>
                }
            </div>

            {/* Icicle chart */}
            <svg ref={ref} style={{ width: '100%', height: '90%' }} />

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    padding: '5px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                }}
            />
            {basisForSupport != 4260 ? supportBasedOnSelectedDataset ?
                <><div className='switch-gg'>Current support is based on the number of students for whom the current selection applies ({basisForSupport}). It is not based on the number of students in the whole dataset (4260).</div>
                    <button onClick={handleSwitch}>Switch to base 'Dataset'</button></> : <>
                    <div className='switch-gg'>Current support is based on the number of students in the whole dataset (4260). It is not based on the number of students for whom the current selection applies ({basisForSupport}).</div>
                    <button onClick={handleSwitch}>Switch to base 'Current Selection'</button>
                </> : <></>}
        </div>
    );
};

const getHTML = (nodeName, size, remainingSize, depth, confidence) => {
    let html = `<strong>Name:</strong> ${nodeName}<br/>`
    if (size && size > 0) html = html + `<strong>Support:</strong> ${parseFloat(size).toFixed(4)}<br/>`
    if (remainingSize && remainingSize > 0) html = html + `<strong>Remaining support:</strong> ${remainingSize.toFixed(4)}<br/>`
    if (confidence) html = html + `<strong>Confidence:</strong> ${confidence.toFixed(4)}<br/>`
    return depth ? html + `<strong>Depth:</strong> ${depth}` : html
}

export const BarChartWithTransitions = ({ data, sizeOfData, setData, basisForSupport }) => {
    const svgRef = useRef(); // Ref for the SVG element
    const tooltipRef = useRef(); // Ref for the tooltip div
    //const lenOfData = data && typeof data.length === "number" ? data.length : 0
    const [dimHeight, setDimHeight] = useState(Math.max(250, 100 + sizeOfData * 17))
    const [dimensions, setDimensions] = useState({
        width: 200,
        height: dimHeight,
        margin: { top: 40, right: 20, bottom: 60, left: 60 },
    });
    const svgContainerRef = useRef();
    const [sortedData, setSortedData] = useState([]);
    const [supportBasedOnSelectedDataset, setSupportBasedOnSelectedDataset] = useState(true)

    useEffect(() => {
        // Initialize sortedData with the input data
        setSortedData(data);
        setDimHeight(Math.max(350, 100 + sizeOfData * 17))
    }, [data]);

    useEffect(() => {
        if (sortedData && sortedData.length > 0) {
            drawChart();
        }
    }, [sortedData, dimensions]); // Trigger on data or dimensions change

    useEffect(() => {
        const container = svgContainerRef.current;

        // Debounced function
        const debouncedResizeHandler = debounce(() => {
            if (container) {
                setDimensions((prev) => ({
                    ...prev,
                    width: container.offsetWidth,
                    height: dimHeight, // Or calculate dynamically if needed
                }));
            }
        }, 200); // 200ms delay

        const resizeObserver = new ResizeObserver(debouncedResizeHandler);
        if (container) resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            debouncedResizeHandler.cancel(); // Cancel any pending debounced calls
        };
    }, [dimHeight, supportBasedOnSelectedDataset]);

    const handleSwitch = () => {
        setData((prev) => {
            let newData = prev
            for (const child of newData) {
                const val = child.value
                const valWDB = child.valueWithDifferentBase
                child.value = valWDB
                child.valueWithDifferentBase = val
            }
            return newData
        })
        setSupportBasedOnSelectedDataset((prev) => !prev)
    }

    const drawChart = () => {
        const { width, height, margin } = dimensions;

        // Fallback for very narrow charts
        const MIN_WIDTH = 150;
        const chartWidth = Math.max(width - margin.left - margin.right, MIN_WIDTH);
        const chartHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        let chartGroup = svg.select("g.chart-group");
        if (chartGroup.empty()) {
            chartGroup = svg.append("g")
                .attr("class", "chart-group")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);
        }

        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, 1])// d3.max(sortedData, d => d.value) || 0]) // Use value for width
            .range([0, chartWidth]); // Horizontal range for bar lengths

        const yScale = d3.scaleBand()
            .domain(sortedData.map(d => d.label)) // Use labels for vertical positioning
            .range([0, chartHeight]) // Vertical range
            .padding(0.1); // Add space between bars


        // Axes
        const xAxis = d3.axisTop(xScale); // Move X-axis to the top
        const yAxis = d3.axisLeft(yScale); // Y-axis for vertical labels

        // Render X-axis
        let xAxisGroup = chartGroup.select(".x-axis");
        if (xAxisGroup.empty()) {
            xAxisGroup = chartGroup.append("g").attr("class", "x-axis");
        }
        xAxisGroup
            .attr("transform", `translate(0, 0)`) // Place X-axis at the top
            .call(xAxis);

        // Render Y-axis
        let yAxisGroup = chartGroup.select(".y-axis");
        if (yAxisGroup.empty()) {
            yAxisGroup = chartGroup.append("g").attr("class", "y-axis");
        }
        yAxisGroup.call(yAxis);

        // Ensure X-axis label
        let xLabel = chartGroup.select(".x-label");
        if (xLabel.empty()) {
            xLabel = chartGroup.append("text")
                .attr("class", "x-label")
                .attr("text-anchor", "middle");
        }
        xLabel
            .attr("x", 10)
            .attr("y", -margin.top + 20) // Position above the X-axis
            .text("Itemsets \\ Support");

        // Draw Bars
        const bars = chartGroup.selectAll(".bar").data(sortedData, d => d.label);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0) // Start bars at X = 0
            .attr("y", d => yScale(d.label)) // Vertical position based on label
            .attr("width", 0) // Initial width for transition
            .attr("height", yScale.bandwidth()) // Height depends on the band
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget).style("fill", "#ffa726"); // Highlight bar
                d3.select(tooltipRef.current)
                    .style("opacity", 1)
                    .html(getHTML(d.label, d.value, null, null, null))
                // Update the tooltip position when mouse moves
                d3.select(event.currentTarget).on("mousemove", (event) => {
                    const [mouseX, mouseY] = d3.pointer(event); // Get mouse position
                    // Position the tooltip at the mouse's location
                    d3.select(tooltipRef.current)
                        .style("left", `${mouseX + 95}px`) // Add offset to avoid it being directly under the cursor
                        .style("top", `${mouseY + 110}px`); // Add offset
                })
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget).style("fill", "#69b3a2"); // Reset bar color
                d3.select(tooltipRef.current).style('opacity', 0);
            })
            .merge(bars)
            .transition()
            .duration(1000)
            .attr("x", 0)
            .attr("y", d => yScale(d.label)) // Update vertical position
            .attr("width", d => xScale(d.value)) // Extend horizontally based on value
            .attr("height", yScale.bandwidth()) // Keep consistent height
            .style("fill", "#69b3a2");

        bars.exit().remove();
    };

    const sortData = (type) => {
        let newData;
        if (type === "alphabetical") {
            newData = [...sortedData].sort((a, b) => a.label.localeCompare(b.label));
        } else if (type === "length") {
            newData = [...sortedData].sort((a, b) => {
                const countA = (a.label.match(/&/g) || []).length;
                const countB = (b.label.match(/&/g) || []).length;
                return countA - countB || b.value - a.value; // First by & count, then by value
            });
        } else if (type === "support") {
            newData = [...sortedData].sort((a, b) => b.value - a.value);
        }
        setSortedData(newData); // Update sortedData
    };

    return (
        <div style={{ position: "relative" }}>
            <div style={{ marginBottom: "10px" }}>
                <button className="sort-button" onClick={() => sortData("support")}>Sort by Support</button>
                <button className="sort-button" onClick={() => sortData("alphabetical")}>Sort Alphabetically</button>
                <button className="sort-button" onClick={() => sortData("length")}>Sort by Itemset-Size</button>
            </div>
            <div ref={svgContainerRef} style={{ width: "100%", height: "100%" }}>
                <svg ref={svgRef}>
                    <g className="x-axis"></g>
                    <g className="y-axis"></g>
                </svg>
            </div>
            <div
                ref={tooltipRef}
                style={{
                    position: "absolute",
                    background: "#fff",
                    border: "1px solid #ccc",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    pointerEvents: "none",
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                    zIndex: 10,
                    fontSize: '12px',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                }}
            ></div>
            {basisForSupport != 4260 ? supportBasedOnSelectedDataset ?
                <><div className='switch-gg'>Current support is based on the number of students for whom the current selection applies ({basisForSupport}). It is not based on the number of students in the whole dataset (4260).</div>
                    <button onClick={handleSwitch}>Switch to base 'Dataset'</button></> : <>
                    <div className='switch-gg'>Current support is based on the number of students in the whole dataset (4260). It is not based on the number of students for whom the current selection applies ({basisForSupport}).</div>
                    <button onClick={handleSwitch}>Switch to base 'Current Selection'</button>
                </> : <></>}
        </div>
    );
};

export const DiffChart = ({ data, sizeOfData, setData, basisForSupportLeft, basisForSupportRight }) => {
    const svgRef = useRef(); // Ref for the SVG element
    const tooltipRef = useRef(); // Ref for the tooltip div
    //const lenOfData = data && typeof data.length === "number" ? data.length : 0
    const [dimHeight, setDimHeight] = useState(Math.max(350, 100 + sizeOfData * 17))
    const [dimensions, setDimensions] = useState({
        width: 800,
        height: dimHeight,
        margin: { top: 30, right: 20, bottom: 60, left: 60 },
    });
    const svgContainerRef = useRef();
    const [sortedData, setSortedData] = useState([]);
    const [supportBasedOnSelectedDataset, setSupportBasedOnSelectedDataset] = useState(true)

    useEffect(() => {
        // Initialize sortedData with the input data
        setSortedData(data);
        setDimHeight(Math.max(350, 100 + sizeOfData * 17))
    }, [data]);

    useEffect(() => {
        if (sortedData && sortedData.length > 0) {
            drawChart();
        }
    }, [sortedData, dimensions]); // Trigger on data or dimensions change

    useEffect(() => {
        const container = svgContainerRef.current;

        // Debounced function
        const debouncedResizeHandler = debounce(() => {
            if (container) {
                setDimensions((prev) => ({
                    ...prev,
                    width: container.offsetWidth,
                    height: dimHeight, // Or calculate dynamically if needed
                }));
            }
        }, 200); // 200ms delay

        const resizeObserver = new ResizeObserver(debouncedResizeHandler);
        if (container) resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            debouncedResizeHandler.cancel(); // Cancel any pending debounced calls
        };
    }, [dimHeight, supportBasedOnSelectedDataset]);

    const handleSwitch = () => {
        setData((prev) => {
            let newData = prev
            for (const child of newData) {
                const rVal = child.rightValue
                const lVal = child.leftValue
                const rValWDB = child.rightValueWithDifferentBasis
                const lValWDB = child.leftValueWithDifferentBasis
                child.rightValue = rValWDB
                child.leftValue = lValWDB
                child.rightValueWithDifferentBasis = rVal
                child.leftValueWithDifferentBasis = lVal
            }
            return newData
        })
        setSupportBasedOnSelectedDataset((prev) => !prev)
    }

    const drawChart = () => {
        const { width, height, margin } = dimensions;

        const MIN_WIDTH = 300;
        const chartWidth = Math.max(width - margin.left - margin.right, MIN_WIDTH);
        const chartHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        let chartGroup = svg.select("g.chart-group");
        if (chartGroup.empty()) {
            chartGroup = svg.append("g")
                .attr("class", "chart-group")
                .attr("transform", `translate(${margin.left}, ${margin.top})`);
        }

        // X-Scale: Symmetric around 0 for left/right bars
        const maxAbsValue = 1//d3.max(sortedData.flatMap(d => [Math.abs(d.leftValue), Math.abs(d.rightValue)])) || 1;
        const xScale = d3.scaleLinear()
            .domain([-maxAbsValue, maxAbsValue]) // Negative to positive
            .range([0, chartWidth]);

        // Y-Scale: Bands for each label
        const yScale = d3.scaleBand()
            .domain(sortedData.map(d => d.label)) // Use sortedData labels
            .range([0, chartHeight])
            .padding(0.1);

        // Axes
        const xAxis = d3.axisTop(xScale).tickPadding(10)//axisBottom(xScale).ticks(5);
        const yAxis = d3.axisLeft(yScale); // Vertical axis on the left

        // Render X-axis
        let xAxisGroup = chartGroup.select(".x-axis");
        if (xAxisGroup.empty()) {
            xAxisGroup = chartGroup.append("g").attr("class", "x-axis");
        }
        xAxisGroup
            .attr("transform", `translate(0, 0)`)//${chartHeight})`) // Position at the bottom
            .call(xAxis);

        // Render Y-axis
        let yAxisGroup = chartGroup.select(".y-axis");
        if (yAxisGroup.empty()) {
            yAxisGroup = chartGroup.append("g").attr("class", "y-axis");
        }
        yAxisGroup
            .call(yAxis);

        // Bars
        const bars = chartGroup.selectAll(".bar-group").data(sortedData, d => d.label);

        // Enter: Bar groups for left and right bars
        const barGroups = bars.enter()
            .append("g")
            .attr("class", "bar-group");

        // Left bars
        barGroups.append("rect")
            .attr("class", "bar-left")
            .merge(bars.select(".bar-left")) // Merge existing left bars
            .transition()
            .duration(1000)
            .attr("x", d => xScale(-Math.min(d.leftValue, d.rightValue))) // Start at calculated left position
            .attr("y", d => yScale(d.label))
            .attr("width", d => xScale(Math.min(d.leftValue, d.rightValue)) - xScale(0))
            .attr("height", yScale.bandwidth()) // Full bar height
            .style("fill", "#ff6f61") // Left bar color

        // Right bars
        barGroups.append("rect")
            .attr("class", "bar-right")
            .merge(bars.select(".bar-right")) // Merge existing right bars
            .transition()
            .duration(1000)
            .attr("x", xScale(0)) // Start at the middle
            .attr("y", d => yScale(d.label))
            .attr("width", d => Math.abs(xScale(Math.min(d.leftValue, d.rightValue)) - xScale(0)))
            .attr("height", yScale.bandwidth()) // Full bar height
            .style("fill", "#69b3a2") // Right bar color

        // Diff bars in blue
        barGroups.append("rect")
            .attr("class", "bar-diff")
            .merge(bars.select(".bar-diff")) // Merge existing diff bars
            .transition()
            .duration(1000)
            .attr("x", d => d.leftValue > d.rightValue ? xScale(-d.leftValue) : xScale(d.leftValue))
            .attr("y", d => yScale(d.label))
            .attr("width", d => xScale(Math.abs(d.rightValue - d.leftValue)) - xScale(0))
            .attr("height", yScale.bandwidth()) // Full bar height
            .style("fill", "#1338BE") // Diff bar color

        // Add event listeners for interactivity
        barGroups.select(".bar-left")
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget).style("fill", "#ffa726");
                d3.select(tooltipRef.current)
                    .style("opacity", 1)
                    .html(`Left Value: ${parseFloat(d.leftValue).toFixed(4)}`);
            })
            .on("mousemove", (event) => {
                const [mouseX, mouseY] = d3.pointer(event);
                d3.select(tooltipRef.current)
                    .style("left", `${mouseX + 95}px`)
                    .style("top", `${mouseY + 110}px`);
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget).style("fill", "#ff6f61");
                d3.select(tooltipRef.current).style("opacity", 0);
            });

        barGroups.select(".bar-right")
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget).style("fill", "#4caf50");
                d3.select(tooltipRef.current)
                    .style("opacity", 1)
                    .html(`Right Value: ${parseFloat(d.rightValue).toFixed(4)}`);
            })
            .on("mousemove", (event) => {
                const [mouseX, mouseY] = d3.pointer(event);
                d3.select(tooltipRef.current)
                    .style("left", `${mouseX + 95}px`)
                    .style("top", `${mouseY + 110}px`);
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget).style("fill", "#69b3a2");
                d3.select(tooltipRef.current).style("opacity", 0);
            });

        barGroups.select(".bar-diff")
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget).style("fill", "#FCE205");
                d3.select(tooltipRef.current)
                    .style("opacity", 1)
                    .html(`Difference between values: ${Math.abs(d.rightValue - d.leftValue)}`);
            })
            .on("mousemove", (event) => {
                const [mouseX, mouseY] = d3.pointer(event);
                d3.select(tooltipRef.current)
                    .style("left", `${mouseX + 95}px`)
                    .style("top", `${mouseY + 110}px`);
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget).style("fill", "#1338BE");
                d3.select(tooltipRef.current).style("opacity", 0);
            });
        // Remove old bars
        bars.exit().remove();
    };

    const sortData = (type) => {
        let newData;
        if (type === "alphabetical") {
            newData = [...sortedData].sort((a, b) => a.label.localeCompare(b.label));
        } else if (type === "size") {
            newData = [...sortedData].sort((a, b) => {
                const countA = (a.label.match(/&/g) || []).length;
                const countB = (b.label.match(/&/g) || []).length;
                return countA - countB || b.leftValue - a.leftValue; // First by & count, then by value
            });
        } else if (type === "support") {
            newData = [...sortedData].sort((a, b) => Math.abs(b.leftValue - b.rightValue) - Math.abs(a.leftValue - a.rightValue));
        } else if (type === "leftsupport") {
            newData = [...sortedData].sort((a, b) => b.leftValue - a.leftValue);
        } else if (type === "rightsupport") {
            newData = [...sortedData].sort((a, b) => b.rightValue - a.rightValue);
        }
        setSortedData(newData); // Update sortedData
    };

    return (
        <div style={{ position: "relative" }}>
            <div style={{ marginBottom: "10px" }}>
                <button className="sort-button" onClick={() => sortData("support")}>Sort by Difference in Support</button>
                <button className="sort-button" onClick={() => sortData("alphabetical")}>Sort Alphabetically</button>
                <button className="sort-button" onClick={() => sortData("size")}>Sort by Itemset-Size</button>
                <button className="sort-button" onClick={() => sortData("leftsupport")}>Sort by Left Support</button>
                <button className="sort-button" onClick={() => sortData("rightsupport")}>Sort by Right Support</button>
            </div>
            <div ref={svgContainerRef} style={{ width: "100%", height: "100%" }}>
                <svg ref={svgRef}>
                    <g className="x-axis"></g>
                    <g className="y-axis"></g>
                </svg>
            </div>
            <div
                ref={tooltipRef}
                style={{
                    position: "absolute",
                    background: "#fff",
                    border: "1px solid #ccc",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    pointerEvents: "none",
                    opacity: 0,
                    transition: "opacity 0.2s ease",
                    zIndex: 10,
                    fontSize: '12px',
                    color: 'white',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                }}
            ></div>
            {supportBasedOnSelectedDataset ?
                <><div className='switch-gg'>Current support is based on the number of students for whom the current selection applies (Left: {basisForSupportLeft}, Right: {basisForSupportRight}). It is not based on the number of students in the whole dataset (4260).</div>
                    <button onClick={handleSwitch}>Switch to base 'Dataset'</button></> :
                <>
                    <div className='switch-gg'>Current support is based on the number of students in the whole dataset (4260). It is not based on the number of students for whom the current selection applies (Left: {basisForSupportLeft}, Right: {basisForSupportRight}).</div>
                    <button onClick={handleSwitch}>Switch to base 'Current Selection'</button>
                </>}
        </div>
    );
}
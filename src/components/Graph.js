// Sunburst.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export const IcicleWithHover = ({ data }) => {
    const ref = useRef();
    const tooltipRef = useRef();
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [hoveredNode, setHoveredNode] = useState(null);
    const [breadcrumbPath, setBreadcrumbPath] = useState([]);

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
    }, []);

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
            })
            /*.on('mousemove', function (event) {
                d3.select(tooltipRef.current)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY + 10}px`);
            })*/
            .on('mouseout', function () {
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

export const BarChartWithTransitions = ({ data, sizeOfData }) => {
    const svgRef = useRef(); // Ref for the SVG element
    const tooltipRef = useRef(); // Ref for the tooltip div
    //const lenOfData = data && typeof data.length === "number" ? data.length : 0
    const [dimHeight, setDimHeight] = useState(Math.max(350, 100 + sizeOfData * 17))
    const [dimensions, setDimensions] = useState({
        width: 800,
        height: dimHeight,
        margin: { top: 40, right: 20, bottom: 60, left: 60 },
    });
    const svgContainerRef = useRef();
    const [sortedData, setSortedData] = useState([]);
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

        const resizeObserver = new ResizeObserver(() => {
            if (container) {
                setDimensions((prev) => ({
                    ...prev,
                    width: container.offsetWidth,
                    height: dimHeight//container.offsetHeight
                }));
            }
        });

        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, [dimHeight]);

    const drawChart = () => {
        const { width, height, margin } = dimensions;

        // Fallback for very narrow charts
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
                        .style("top", `${mouseY + 90}px`); // Add offset
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
                <button onClick={() => sortData("support")}>Sort by Support</button>
                <button onClick={() => sortData("alphabetical")}>Sort Alphabetically</button>
                <button onClick={() => sortData("length")}>Sort by Length</button>
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
        </div>
    );
};

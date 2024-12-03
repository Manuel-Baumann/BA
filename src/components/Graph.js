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
                if (d.data.name && d.data.name !== 'undefined') {
                    setHoveredNode(d);
                    highlightPath(d);
                    d3.select(tooltipRef.current)
                        .style('opacity', 1)
                        .html(`
                            <strong>Name:</strong> ${d.data.name}<br/>
                            <strong>Support:</strong> ${d.data.support}<br/>
                            <strong>Depth:</strong> ${d.depth}
                            `);
                } else {
                    setHoveredNode(null)
                    highlightPath();
                    d3.select(tooltipRef.current)
                        .style('opacity', 1)
                        .html(`<strong>Hover over a node</strong>`);
                }
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
            .text((d) => (d.x1 - d.x0 > 40 ? '' : '')) // Display label if there's space, d.data.name
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
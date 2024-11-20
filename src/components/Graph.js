// Sunburst.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export const Graph = ({ data }) => {
    const ref = useRef();
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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
        if (dimensions.width === 0 || dimensions.height === 0) return;

        // Setup dimensions based on component's current width and height
        const radius = Math.min(dimensions.width, dimensions.height) / 2;
        const svg = d3.select(ref.current);

        svg.selectAll('*').remove();  // Clear previous render

        const g = svg
            .attr('width', dimensions.width)
            .attr('height', dimensions.height)
            .append('g')
            .attr('transform', `translate(${dimensions.width / 2},${dimensions.height / 2})`);

        // Create the partition layout
        const partition = d3.partition().size([2 * Math.PI, radius]);

        // Create a root hierarchy
        const root = d3
            .hierarchy(data)
            .sum((d) => d.size)
            .sort((a, b) => b.value - a.value);

        // Generate the arcs
        partition(root);
        const arc = d3
            .arc()
            .startAngle((d) => d.x0)
            .endAngle((d) => d.x1)
            .innerRadius((d) => d.y0)
            .outerRadius((d) => d.y1);

        // Draw each segment
        g.selectAll('path')
            .data(root.descendants())
            .enter()
            .append('path')
            .attr('display', (d) => (d.depth ? null : 'none'))
            .attr('d', arc)
            .style('stroke', '#fff')
            .style('fill', (d) => (d.depth === 1 ? '#6baed6' : d.depth === 2 ? '#9ecae1' : '#c6dbef'))
            .on('mouseover', function (event, d) {
                d3.select(this).style('fill', '#ff7f0e');
            })
            .on('mouseout', function (event, d) {
                d3.select(this).style('fill', (d) => (d.depth === 1 ? '#6baed6' : d.depth === 2 ? '#9ecae1' : '#c6dbef'));
            });

        // Add labels for each node
        g.selectAll('text')
            .data(root.descendants())
            .enter()
            .append('text')
            .attr('transform', function (d) {
                const x = (d.x0 + d.x1) / 2 * (180 / Math.PI);  // Convert radians to degrees
                const y = (d.y0 + d.y1) / 2;
                return `rotate(${x - 90}) translate(${y},0) ${x > 180 ? "rotate(180)" : ""}`;
            })
            .attr('dy', '0.35em')
            .attr('text-anchor', d => ((d.x0 + d.x1) / 2) > Math.PI ? 'end' : 'start')
            .text(d => d.data.name)
            .style('font-size', '10px')
            .style('fill', '#333');

    }, [data, dimensions]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <svg ref={ref} style={{ width: '100%', height: '100%' }} />
        </div>
    );
};

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

        const color = d3.scaleSequential([0, root.height], d3.interpolateBlues);

        // Draw each rectangle
        const rects = svg
            .selectAll('rect')
            .data(root.descendants())
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
                setHoveredNode(d);
                try {
                    setBreadcrumbPath(d.ancestors().reverse().slice(1));
                } catch (error) {
                    console.error('Error updating breadcrumbs:', error);
                    setBreadcrumbPath([]); // Clear breadcrumbs in case of error
                }

                highlightPath(d);
                d3.select(tooltipRef.current)
                    .style('opacity', 1)
                    .html(`
              <strong>Name:</strong> ${d.data.name}<br/>
              <strong>Size:</strong> ${d.value}<br/>
              <strong>Depth:</strong> ${d.depth}
            `);
            })
            .on('mousemove', function (event) {
                d3.select(tooltipRef.current)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY + 10}px`);
            })
            .on('mouseout', function () {
                setHoveredNode(null);
                setBreadcrumbPath([]);
                resetHighlight();
                d3.select(tooltipRef.current).style('opacity', 0);
            });

        // Highlight only the path to the hovered node (not its children)
        function highlightPath(node) {
            rects.style('opacity', (d) =>
                node.ancestors().includes(d) ? 1 : 0.4
            );
        }

        // Reset highlight
        function resetHighlight() {
            rects.style('opacity', 1);
        }

        // Add labels to each rectangle if there's enough space
        svg
            .selectAll('text')
            .data(root.descendants())
            .enter()
            .append('text')
            .attr('x', (d) => d.x0 + 5)
            .attr('y', (d) => d.y0 + (d.y1 - d.y0) / 2)
            .attr('dy', '0.35em')
            .text((d) => (d.x1 - d.x0 > 40 ? d.data.name : '')) // Display label if there's space
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
                {breadcrumbPath.map((node, i) => (
                    <React.Fragment key={node.id || `${node.data.name}-${i}`}>
                        {i > 0 && <span>➔</span>}
                        <span>{node.data.name}</span>
                    </React.Fragment>
                ))
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
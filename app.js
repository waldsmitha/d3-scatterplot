async function draw() {
  // Data
  const dataset = await d3.json("./data.json");

  const xAccessor = (d) => d.currently.humidity;
  const yAccessor = (d) => d.currently.apparentTemperature;

  // Dimensions
  let dimensions = {
    width: 800,
    height: 800,
    margin: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
  };

  dimensions.containerWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.containerHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // Draw Image
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const container = svg
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
    );

  const toolTip = d3.select('#tooltip')

  // Scales
  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, xAccessor))
    // .range([0, dimensions.containerWidth]);
    .rangeRound([0, dimensions.containerWidth])
    .clamp(true);
  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(dataset, yAccessor))
    .range([dimensions.containerHeight, 0])
    // Nice rounds domain, rangeRound does the range, clamp confines to original range
    .nice()
    .clamp(true);

  // Draw Circles
  container
    .selectAll("circle")
    .data(dataset)
    .join("circle")
    .attr("cx", (d) => xScale(xAccessor(d)))
    .attr("cy", (d) => yScale(yAccessor(d)))
    .attr("r", 5)
    .attr("fill", "red")
    .attr("data-temp", yAccessor)
    

  // Axes
  const xAxis = d3
    .axisBottom(xScale)
    .ticks(5)
    .tickFormat((d) => d * 100 + "%");
  // .tickValues([0.4, 0.5, 0.8]);

  const xAxisGroup = container
    .append("g")
    .call(xAxis)
    .style("transform", `translateY(${dimensions.containerHeight}px)`)
    .classed("axis", true);

  xAxisGroup
    .append("text")
    .attr("x", dimensions.containerWidth / 2 - dimensions.margin.left / 2)
    .attr("y", dimensions.margin.bottom - 10)
    .attr("fill", "black")
    .text("Humidity");

  const yAxis = d3.axisLeft(yScale);
  const yAxisGroup = container.append("g").call(yAxis).classed("axis", true);

  yAxisGroup
    .append("text")
    .attr("y", -dimensions.margin.left + 15)
    .attr("x", -dimensions.containerHeight / 2)
    .attr("fill", "black")
    .attr("transform", `rotate(270)`)
    .attr("text-anchor", "middle")
    .html("Temperature &deg; F");

  //Returns object with coordinates we can use to draw the voronoi diagram
  const delaunay = d3.Delaunay.from(
    dataset,
    (d) => xScale(xAccessor(d)),
    (d) => yScale(yAccessor(d))
    )
  
  // This draws it
  const voronoi = delaunay.voronoi()
  voronoi.xmax = dimensions.containerWidth
  voronoi.ymax = dimensions.containerheight
    // console.log(delaunay)
    // console.log(voronoi)
  // Coordinates generated meant for path element
  container.append('g')
    .selectAll('path')
    .data(dataset)
    .join('path')      
    // .attr('stroke', 'black')
    .attr('fill', 'transparent')
    .attr('d', (d, i) => voronoi.renderCell(i))
    .on('mouseenter', function(event, datum){
      // console.log(datum)
      container.append('circle')
        .classed('dot-hovered', true)
        // .transition()
        .attr('fill', '#120078')
        .attr('r', 8)
        .attr("cx", (d) => xScale(xAccessor(datum)))
        .attr("cy", (d) => yScale(yAccessor(datum)))
        .style('pointer-events', 'none')

        toolTip.style('display', 'block')
         .style('top', yScale(yAccessor(datum)) - 25 + 'px')
         .style('left', xScale(xAccessor(datum)) + "px")
        // 2 Decimals Fixed
        const formatter = d3.format('.2f')  
        const dateFormatter = d3.timeFormat('%B %-d, %Y') 

        toolTip.select('.metric-humidity span')
          .text(formatter(xAccessor(datum)))

        toolTip.select('.metric-temp span')
          .text(formatter(yAccessor(datum)))

        toolTip.select('.metric-date')
          .text(dateFormatter(datum.currently.time * 1000))
          
      })
     .on('mouseleave', function(event){
        container.select('.dot-hovered').remove()
         
        toolTip.style('display', 'none')
    })
    
}

draw();

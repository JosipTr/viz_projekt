var width = 900
var height = window.innerHeight - 40;

var scaleWidth = 400;
var scaleHeight = 30;

var svg = d3.select("#content").append("svg").attr("width", width).attr("height", height)

var projection = d3.geoMercator().center([0, 40]).scale(160).translate([width / 2, height / 2]);

var path = d3.geoPath(projection);

var g = svg.append("g");

var zoom = d3.zoom()
    .scaleExtent([1, 10])
    .on("zoom", zoomed);

svg.call(zoom);

function zoomed(event) {
    g.attr("transform", event.transform);
}

var tooltip = d3.select("#content").append("div")
    .attr("class", "tooltip");

var scaleColor = d3.scaleLinear()
    .domain([0, 500000])
    .range(["white", "red"]);

var suicideScale = svg.append("g")
    .attr("width", scaleWidth)
    .attr("height", scaleHeight)
    .attr("transform", `translate(${width / 1.3 - height / 2}, ${height - 100})`);

var barWidth = scaleWidth / 10;

suicideScale.selectAll(".scale")
    .data(d3.range(10))
    .enter()
    .append("rect")
    .attr("x", function (d, i) { return i * barWidth; })
    .attr("y", 0)
    .attr("width", barWidth)
    .attr("height", scaleHeight)
    .attr("fill", function (d) { return scaleColor(d * 50000); });

const legendScale = d3.scaleLinear()
    .domain([0, 500000])
    .range([0, scaleWidth]);

const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickSize(10)
    .tickFormat((d) => {
        if (d === 500000) {
            return "500k<";
        } else {
            return d3.format("0.0s")(d);
        }
    });

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width / 1.3 - height / 2}, ${height - 70})`);



legend.call(legendAxis);

var xAxisLabel = svg.append("text")
    .attr("x", scaleWidth - 250)
    .attr("y", height - 70)
    .style("text-anchor", "start")
    .text("Suicide rate");


    function updateBarChart(countryName, suicideData) {
        const groupedData = Array.from(d3.group(suicideData, d => d.year + d.country));
      
        const filteredData = groupedData
          .filter(group => group[0].includes(countryName))
          .map(group => {
            const year = group[1][0].year;
            const suicides = d3.sum(group[1], d => parseInt(d.suicides_no));
            return { year, suicides };
          });
      
        const years = filteredData.map(item => item.year);
        const suicideCounts = filteredData.map(item => item.suicides);
        const totalSuicides = d3.sum(suicideCounts);
      
        const barChartHeight = 500;
        const barChartWidth = 978;
      
        const margin = { top: 20, right: 20, bottom: 30, left: 120 };
      
        const width = barChartWidth - margin.left - margin.right;
        const height = barChartHeight - margin.top - margin.bottom;
      
        const xScale = d3.scaleBand()
          .domain(years)
          .range([0, width])
          .padding(0.1);
      
        const yScale = d3.scaleLinear()
          .domain([0, d3.max(suicideCounts)])
          .range([height, 0]);
      
        const barChart = d3.select("#barchart")
          .html("")
          .append("svg")
          .attr("width", barChartWidth)
          .attr("height", barChartHeight)
          .append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);
      
        barChart.selectAll(".bar")
          .data(filteredData)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", d => xScale(d.year))
          .attr("y", d => yScale(d.suicides))
          .attr("width", xScale.bandwidth())
          .attr("height", d => height - yScale(d.suicides))
          .style("fill", "steelblue");
      
        barChart.append("g")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(xScale));
      
        barChart.append("g")
          .call(d3.axisLeft(yScale));
      
        barChart.append("text")
          .attr("class", "x-axis-label")
          .attr("x", width - 30)
          .attr("y", 480)
          .style("text-anchor", "middle")
          .text("Year");
      
        barChart.append("text")
          .attr("class", "y-axis-label")
          .attr("transform", "rotate(-90)")
          .attr("x", -50)
          .attr("y", 0 - margin.left + 50)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Suicide Count");
      
        if (totalSuicides === 0) {
          barChart.html("");
        }
      }
      



function updatePieChart(countryName, suicideData) {
    const countryFemaleData = suicideData.filter(d => d.country === countryName && d.sex === "female");
    const countryMaleData = suicideData.filter(d => d.country === countryName && d.sex === "male");

    const totalFemale = d3.sum(countryFemaleData, d => +d.suicides_no);
    const totalMale = d3.sum(countryMaleData, d => +d.suicides_no);

    const totalSuicides = totalFemale + totalMale;
    const totalFemalePercentage = (totalFemale / totalSuicides) * 100;
    const totalMalePercentage = (totalMale / totalSuicides) * 100;

    const pieData = [
        { label: totalFemalePercentage.toFixed(2) + "%", value: totalFemale },
        { label: totalMalePercentage.toFixed(2) + "%", value: totalMale }
    ];

    const pieWidth = 300;
    const pieHeight = 300;
    const pieRadius = Math.min(pieWidth, pieHeight) / 2;
    const pieX = pieWidth / 2;
    const pieY = pieHeight / 2;

    let pieSvg = d3.select("#piechart svg");

    if (pieSvg.empty()) {
        pieSvg = d3.select("#piechart")
            .append("svg")
            .attr("width", pieWidth)
            .attr("height", pieHeight)
            .style("margin-left", "300px")
            .style("margin-top", "30px");
    } else {
        pieSvg.selectAll("*").remove();
    }

    const pieG = pieSvg.append("g")
        .attr("transform", `translate(${pieX}, ${pieY})`);

    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(pieRadius);

    const pie = d3.pie()
        .value(d => d.value);

    const arcs = pieG.selectAll("path")
        .data(pie(pieData))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => i === 0 ? "violet" : "cornflowerblue")
        .attr("stroke", "white")
        .attr("stroke-width", 2);

    arcs.append("title")
        .text(d => `${d.data.label}: ${d.data.value}`);

    pieG.selectAll("text")
        .data(pie(pieData))
        .enter()
        .append("text")
        .attr("transform", d => `translate(${arc.centroid(d)})`)
        .attr("dy", "0.35em")
        .style("text-anchor", "middle")
        .text(d => d.data.label);

    let legend = d3.select("#piechart .legend");

    if (legend.empty()) {
        legend = d3.select("#piechart")
            .append("svg")
            .attr("class", "legend")
            .attr("transform", `translate(${0}, ${0})`)
            .style("margin-left", "50px");

        const legendData = [
            { label: "Female suicides", color: "violet" },
            { label: "Male suicides", color: "cornflowerblue" }
        ];

        const legendItem = legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItem.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => d.color);

        legendItem.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(d => d.label);
    } else {
        legend.selectAll(".legend-item").remove();

        const legendData = [
            { label: "Female suicides", color: "violet" },
            { label: "Male suicides", color: "cornflowerblue" }
        ];

        const legendItem = legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItem.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => d.color);

        legendItem.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(d => d.label);
    }

    if (totalSuicides === 0) {
        pieG.html("");
        legend.html("");
    }

}




Promise.all([
    fetch('newWorldTopo.json').then(response => response.json()),
    fetch('suicide.json').then(response => response.json())
]).then(([topoData, suicideData]) => {

    var countries = topojson.feature(topoData, topoData.objects.newWorld);

    const filteredData = suicideData.filter(data => data.suicides_no !== "");

    const countrySuicides = {};
    filteredData.forEach(data => {
        const country = data.country;
        const suicides = data.suicides_no;
        if (countrySuicides[country]) {
            countrySuicides[country] += suicides;
        } else {
            countrySuicides[country] = suicides;
        }
    });

    g.selectAll("path")
        .data(countries.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .on("mouseover", function (event, d) {
            const countryName = d.properties.name;
            const suicideCount = countrySuicides[countryName] || "No data";
            const tooltipContent = `Country: ${countryName}<br>Total Suicides: ${suicideCount}`;

            tooltip
                .html(tooltipContent)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 10}px`)
                .style("opacity", 0.9);
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
        })
        .style("fill", function (d) {
            const countryName = d.properties.name;
            const suicideCount = countrySuicides[countryName] || 0;
            return countrySuicides[countryName] ? scaleColor(suicideCount) : "lightgray";
        })

        .on("click", function (event, d) {
            const countryName = d.properties.name;
            updateBarChart(countryName, suicideData);
            updatePieChart(countryName, suicideData);
        })
});
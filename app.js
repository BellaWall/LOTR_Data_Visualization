d3.csv("lotr_scripts.csv").then(function(data) {
    // Parse and clean the scripts data
    const cleanedScripts = data.map(d => ({
        character: d.char ? d.char.trim() : "Unknown",
        dialogue: d.dialog ? d.dialog.trim() : "No Dialogue",
        movie: d.movie ? d.movie.trim() : "Unknown"
    }));
    console.log("Cleaned Scripts Data:", cleanedScripts);
});

d3.csv("lotr_characters.csv").then(function(data) {
    // Parse and clean the characters data
    const cleanedCharacters = data.map(d => ({
        name: d.name ? d.name.trim() : "Unknown",
        race: d.race ? d.race.trim() : "Unknown",
        gender: d.gender ? d.gender.trim() : "Unknown",
        age: d.birth ? +d.birth : null
    }));
    console.log("Cleaned Characters Data:", cleanedCharacters);
});

d3.csv("lotr_scripts.csv").then(function(scripts) {
    d3.csv("lotr_characters.csv").then(function(characters) {
        // Clean the data
        const cleanedScripts = scripts.map(d => ({
            character: d.char ? d.char.trim() : "Unknown",
            dialogue: d.dialog ? d.dialog.trim() : "No Dialogue",
            movie: d.movie ? d.movie.trim() : "Unknown"
        }));

        const cleanedCharacters = characters.map(d => ({
            name: d.name ? d.name.trim() : "Unknown",
            race: d.race ? d.race.trim() : "Unknown",
            gender: d.gender ? d.gender.trim() : "Unknown",
            age: d.birth ? +d.birth : null
        }));

        // Example of merging data based on character names
        const mergedData = cleanedScripts.map(script => {
            const characterInfo = cleanedCharacters.find(char => char.name === script.character) || {};
            return {...script, ...characterInfo};
        });

        console.log("Merged Data:", mergedData);
        // Further processing and visualization go here
        // Count the number of dialogues per character
  // Existing D3 code
console.log("Merged Data:", mergedData);

// Further processing and visualization go here
// Count the number of dialogues per character
const dialogueCounts = d3.rollups(cleanedScripts, v => v.length, d => d.character);
console.log("Dialogue Counts:", dialogueCounts);

const filteredDialogueCounts = dialogueCounts.filter(d => d[1] >= 10);

// Sort characters by dialogue counts
filteredDialogueCounts.sort((a, b) => b[1] - a[1]);

// Set up SVG and scales for the bar chart
const margin = { top: 20, right: 20, bottom: 120, left: 100 };  // Increased bottom margin
const width = 700 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;  // Reduced height to allow more space for labels

const svg = d3.select("#chart").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const xScale = d3.scaleBand()
  .domain(filteredDialogueCounts.map(d => d[0]))
  .range([0, width])
  .padding(0.2);

const yScale = d3.scaleLinear()
  .domain([0, d3.max(filteredDialogueCounts, d => d[1])])
  .nice()
  .range([height, 0]);

// Create bars for the bar chart
svg.selectAll(".bar")
  .data(filteredDialogueCounts)
  .enter().append("rect")
  .attr("class", "bar")
  .attr("x", d => xScale(d[0]))
  .attr("y", d => yScale(d[1]))
  .attr("width", xScale.bandwidth())
  .attr("height", d => height - yScale(d[1]))
  .attr("fill", "steelblue")
  .attr("stroke", "none")
  // Add stroke attribute for outline
  .on("click", function(event, d) {
    // Highlight the clicked bar
    d3.selectAll(".bar").attr("fill", "steelblue").attr("stroke", "none"); // Reset other bars
    d3.select(this).attr("fill", "orange").attr("stroke", "black").attr("stroke-width", 2); // Highlight selected bar
    updateWordCloud(d[0]); // Update word cloud on bar click
  });

// Add x-axis
svg.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(xScale))
  .selectAll("text")
  .attr("transform", "rotate(-45)")
  .style("text-anchor", "end")
  .style("font-size", "14px")  // Increased font size
  .style("font-weight", "bold");  // Made labels bolder

// Add y-axis
svg.append("g")
  .attr("class", "y-axis")
  .call(d3.axisLeft(yScale).ticks(10));

// Add y-axis label
svg.append("text")
  .attr("class", "y-axis-label")
  .attr("x", -height / 2)
  .attr("y", -margin.left + 20)
  .attr("dy", ".75em")
  .attr("transform", "rotate(-90)")
  .style("text-anchor", "middle")
  .text("Number of Dialogue Lines");

    
    // Initialize variables to keep track of which word clouds are being used
let topCloudCharacter = null;
let bottomCloudCharacter = null;

// Function to reset word clouds
function resetWordClouds() {
    topCloudCharacter = null;
    bottomCloudCharacter = null;
    d3.select("#word-cloud-top").selectAll("*").remove();
    d3.select("#word-cloud-bottom").selectAll("*").remove();
}

// Updated function to manage two word clouds
function updateWordCloud(character) {
    console.log(`Updating word cloud for character: ${character}`);

    // Filter data for the selected character
    const characterData = cleanedScripts.filter(d => d.character === character);

    // Predefined list of common English stop words
    const stopWords = new Set(["the", "you", "would", "what", "will", "then", "should", "had", "where", "if", "were", "these", "there", "there's", "and", "can", "has", "but", "have", "not", "or", "so", "me", "to", "a", "in", "it", "is", "with", "for", "on", "that", "this", "my", "of", "was", "be", "at", "by", "an", "as", "we", "he", "she", "they", "them", "his", "her", "their", "ours", "your", "mine", "yours", "i", "are"]);

    // Preprocess the data to get word frequencies
    const wordFreq = {};
    characterData.forEach(function(d) {
        if (d.dialogue) { // Ensure dialogue is not empty
            const words = d.dialogue.split(/\s+/);
            words.forEach(function(word) {
                word = word.toLowerCase();
                if (!stopWords.has(word)) { // Only consider non-stop words
                    if (wordFreq[word]) {
                        wordFreq[word]++;
                    } else {
                        wordFreq[word] = 1;
                    }
                }
            });
        }
    });

    // Convert word frequencies to an array of objects
    const words = Object.keys(wordFreq).map(function(word) {
        return { text: word, size: wordFreq[word] };
    });

    console.log("Words for character:", character, words); // Debugging log

    // Check if words array is not empty
    if (words.length === 0) {
        console.warn(`No words found for character: ${character}`);
        return;
    }

    // Dimensions of the word clouds
    const cloudWidth = 700; // Adjusted width for better fit
    const cloudHeight = 350; // Adjusted height for better fit

    // Create a scaling function for font sizes
    const fontSize = d3.scaleLinear()
        .domain([d3.min(words, d => d.size), d3.max(words, d => d.size)])
        .range([10, 100]);

    const colorScale = d3.scaleLinear()
        .domain([d3.min(words, d => d.size), d3.max(words, d => d.size)])
        .range(["black", "white"]);

    // Function to draw the word cloud
    function drawCloud(svgId, words, character) {
        const layout = d3.layout.cloud()
            .size([cloudWidth, cloudHeight])
            .words(words)
            .padding(5)
            .rotate(() => ~~(Math.random() * 2) * 90)
            .font("Arial")
            .fontSize(d => fontSize(d.size))
            .on("end", words => {
                d3.select(`#${svgId}`).selectAll("*").remove(); // Clear previous word cloud
                d3.select(`#${svgId}`)
                    .attr("width", cloudWidth)
                    .attr("height", cloudHeight)
                    .append("g")
                    .attr("transform", `translate(${cloudWidth / 2},${cloudHeight / 2})`)
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                    .style("font-size", d => `${d.size}px`)
                    .style("font-family", "Arial")
                    .style("fill", d => colorScale(d.size))
                    .attr("text-anchor", "middle")
                    .attr("transform", d => `translate(${[d.x, d.y]})rotate(${d.rotate})`)
                    .text(d => d.text);

                // Add title for the word cloud
                d3.select(`#${svgId}`).append("text")
                    .attr("x", cloudWidth / 2)
                    .attr("y", 20)
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .style("font-weight", "bold")
                    .text(character);
            });

        layout.start();
    }

    // Logic to manage which word cloud to update
    if (!topCloudCharacter) {
        // If no top cloud, create it
        topCloudCharacter = character;
        drawCloud("word-cloud-top", words, character);
    } else if (!bottomCloudCharacter) {
        // If no bottom cloud, create it
        bottomCloudCharacter = character;
        drawCloud("word-cloud-bottom", words, character);
    } else {
        // If both clouds are occupied, replace the top one and shift current top to bottom
        bottomCloudCharacter = topCloudCharacter;
        topCloudCharacter = character;
        drawCloud("word-cloud-top", words, character);
        drawCloud("word-cloud-bottom", words, bottomCloudCharacter); // Re-render the bottom cloud with the old top character
    }
}

// Add event listener to reset button
document.getElementById("reset-button").addEventListener("click", resetWordClouds);

    


// Load the cleaned characters data
d3.csv("lotr_characters.csv").then(function(characters) {
    // Clean the characters data
    const cleanedCharacters = characters.map(d => ({
        name: d.name ? d.name.split(" ")[0].trim().toLowerCase() : "unknown", // Use the first part of the name
        race: d.race && d.race.trim() !== "" ? d.race.trim().toLowerCase() : "n/a",
        gender: d.gender && d.gender.trim() !== "" ? d.gender.trim() : "n/a",
        realm: d.realm && d.realm.trim() !== "" ? d.realm.trim() : "n/a"
    }));

    // Group characters by race and count the number of characters in each race
    const raceCounts = d3.rollups(cleanedCharacters, v => v.length, d => d.race)
        .map(d => ({ race: d[0], count: d[1] }));

    // Create the bubble chart
    createBubbleChart(raceCounts);
});

// Function to create the bubble chart
function createBubbleChart(data) {
    const width = 960, height = 600;

    const svg = d3.select("#bubble-chart").append("svg")
        .attr("width", width)
        .attr("height", height);

    const tooltip = d3.select("#tooltip");

    const bubble = d3.pack()
        .size([width, height])
        .padding(1.5);

    const nodes = d3.hierarchy({children: data})
        .sum(d => d.count); // Use number of characters for size

    const node = svg.selectAll(".node")
        .data(bubble(nodes).leaves())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => {
            const x = isNaN(d.x) ? 0 : d.x; // Default to 0 if x is NaN
            const y = isNaN(d.y) ? 0 : d.y; // Default to 0 if y is NaN
            return `translate(${x},${y})`;
        })
        .on("mouseover", function(event, d) {
            tooltip.style("opacity", 1)
                .html(`Race: ${d.data.race}<br>Count: ${d.data.count}`)
                .style("left", `${event.pageX}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });

    node.append("circle")
        .attr("r", d => d.r)
        .style("fill", d => {
            switch (d.data.race) { 
                case "hobbit": return "#ff7f0e";
                case "n/a": return "#7f7f7f";
                case "dragon": return "#e41a1c";
                case "eagle": return "#377eb8";
                case "half-elven": return "#4daf4a";
                case "ainur": return "#984ea3";
                case "elf": return "#ff7f00";
                case "orc": return "#ffff33";
                case "uruk-hai": return "#a65628";
                case "stone-trolls": return "#f781bf";
                case "god": return "#999999";
                case "werewolves": return "#8dd3c7";
                case "men": return "#1f77b4";
                case "elves": return "#2ca02c";
                case "dragons": return "#ff7f0e";
                case "orcs": return "#d62728";
                case "hobbits": return "#9467bd";
                case "dwarves": return "#8c564b";
                default: return "#8c564b"; // Default color for other races
            }
        });

    node.append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .text(d => d.data.race.substring(0, d.r / 3));
}
// Load the cleaned characters data
d3.csv("lotr_characters.csv").then(function(characters) {
    // Clean the characters data, including the realm variable
    const cleanedCharacters = characters.map(d => ({
        name: d.name ? d.name.trim() : "Unknown",
        race: d.race ? d.race.trim() : "Unknown",
        gender: d.gender ? d.gender.trim() : "Unknown",
        age: d.birth ? +d.birth : null,
        realm: d.realm ? d.realm.trim() : "Unknown" // Added realm variable
    }));

    // Group characters by realm and count the number of characters in each realm
    const realmCounts = d3.rollups(cleanedCharacters, v => ({
        count: v.length,
        characters: v.map(d => `${d.name} (Race: ${d.race})`)
    }), d => d.realm)
        .map(d => ({ realm: d[0], ...d[1] }));

    // Map of realms to their approximate coordinates
    const realmCoordinates = {
        "shire": [55.2, -10],
        "rivendell": [54.9, 10],
        "arnor": [52, -7.5],
        "gondor": [47, -0.09],
        "rohan": [48.8, 2],
        "grey mountains": [56, 21],
        "bree": [55.2, -5]
    };

    // Initialize the map
    const map = L.map('map', {
        center: [50, 0], // Adjust to center the Middle-earth map
        zoom: 5,
        layers: [
            L.imageOverlay('images/middle-earth.jpg', [[35, -30], [60, 30]]) // Adjust bounds to fit the map image
        ],
        zoomControl: false,
        dragging: false,  // Disable dragging
        doubleClickZoom: false,  // Disable double-click zoom
        scrollWheelZoom: false,  // Disable scroll wheel zoom
        touchZoom: false,  // Disable touch zoom
        keyboard: false  // Disable keyboard navigation
    });

    // Define the popups facing downwards
    const downwardPopupOptions = {
        autoPan: false,
        className: 'downward-popup'
    };

    // Add realm markers to the map
    realmCounts.forEach(d => {
        const coordinates = realmCoordinates[d.realm.toLowerCase()];
        if (coordinates) {
            const marker = L.marker(coordinates, {interactive: true, draggable: false}).addTo(map);
            if (['shire', 'bree', 'rivendell', 'grey mountains'].includes(d.realm.toLowerCase())) {
                marker.bindPopup(`<b>${d.realm}</b><br>Population: ${d.count}<br>Characters: ${d.characters.join(", ")}`, downwardPopupOptions);
            } else {
                marker.bindPopup(`<b>${d.realm}</b><br>Population: ${d.count}<br>Characters: ${d.characters.join(", ")}`);
            }
        }
    });
});

}).catch(error => {
    console.error("Error loading the CSV file:", error);
});
    });
;



























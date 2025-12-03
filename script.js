(async function () {
    const apiRoot = "https://digitalcollections-accept.library.maastrichtuniversity.nl/api";
    const itemSetId = 60514; // History Clinic item set

    // 1. Fetch all people from the item set
    const peopleResp = await fetch(`${apiRoot}/items?item_set_id=${itemSetId}`);
    const people = await peopleResp.json();

    const rootData = { name: "Digital Memory Tree", children: [] };

    for (const person of people) {
        const personNode = {
            name: person["o:title"] || "Unnamed",
            url: person["@id"].replace("/api", ""),
            children: []
        };

        // 2. Find objects linked to person via schema:about
        const relatedUrl =
            `${apiRoot}/items?property[0][joiner]=and&property[0][property]=schema:about`
            + `&property[0][type]=resource&property[0][text]=${encodeURIComponent(person["@id"])}`;

        const relatedResp = await fetch(relatedUrl);
        const relatedObjects = await relatedResp.json();

        for (const obj of relatedObjects) {
            personNode.children.push({
                name: obj["o:title"] || "Object",
                url: obj["@id"].replace("/api", "")
            });
        }

        rootData.children.push(personNode);
    }

    // 3. Render the D3 tree
    const width = document.getElementById("tree-container").clientWidth;
    const height = document.getElementById("tree-container").clientHeight;

    const svg = d3.select("#tree-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g").attr("transform", "translate(40,40)");

    const treeLayout = d3.tree().size([height - 80, width - 160]);

    const root = d3.hierarchy(rootData);
    treeLayout(root);

    // Links
    g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    // Nodes
    const node = g.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
        .attr("r", d => d.depth === 0 ? 10 : (d.children ? 8 : 6))
        .attr("fill", d =>
            d.depth === 0 ? "#4a90e2" : (d.children ? "#6ab04c" : "#f9ca24")
        )
        .on("click", (e, d) => {
            if (d.data.url) window.open(d.data.url, "_blank");
        });

    node.append("text")
        .attr("dx", 12)
        .attr("dy", 4)
        .text(d => d.data.name)
        .style("cursor", d => d.data.url ? "pointer" : "default")
        .on("click", (e, d) => {
            if (d.data.url) window.open(d.data.url, "_blank");
        });

})();

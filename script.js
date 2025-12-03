const API_BASE = "https://digitalcollections-accept.library.maastrichtuniversity.nl/api";

const PERSON_ITEMSET = 60514;   // persons
const OBJECT_ITEMSET = 60518;   // objects

async function fetchItemSet(id) {
    const url = `${API_BASE}/items?item_set_id=${id}&per_page=500`;
    const response = await fetch(url);
    return await response.json();
}

async function buildTree() {
    const persons = await fetchItemSet(PERSON_ITEMSET);
    const objects = await fetchItemSet(OBJECT_ITEMSET);

    console.log("Persons:", persons);
    console.log("Objects:", objects);

    if (!persons.length) {
        document.body.innerHTML += "<p>No persons found.</p>";
        return;
    }

    // Person nodes
    const personNodes = persons.map(p => ({
        id: p["o:id"],
        name: p["o:title"]
    }));

    // Object nodes
    const objectNodes = objects.map(o => {
        const owned = o["schema:ownedFrom"];
        const personId = owned && owned.length ? owned[0]["value_resource_id"] : null;
        return {
            id: o["o:id"],
            name: o["o:title"],
            personId
        };
    });

    // Build D3 tree structure
    const treeData = {
        name: "Digital Memory Tree",
        children: personNodes.map(person => ({
            name: person.name,
            children: objectNodes
                .filter(obj => obj.personId === person.id)
                .map(obj => ({ name: obj.name }))
        }))
    };

    renderTree(treeData);
}

function renderTree(data) {
    const width = 1400;
    const height = 900;

    const svg = d3.select("#tree")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(80,0)");

    const treeLayout = d3.tree().size([height, width - 300]);
    const root = d3.hierarchy(data);
    treeLayout(root);

    // Links
    svg.selectAll("path")
        .data(root.links())
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 1.5)
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)
        );

    // Nodes
    const node = svg.selectAll("g.node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y}, ${d.x})`);

    node.append("circle")
        .attr("r", d => d.depth === 0 ? 10 : d.depth === 1 ? 7 : 4)
        .attr("fill", d => d.depth === 0 ? "#4682b4" : d.depth === 1 ? "#4CAF50" : "#FFC107");

    node.append("text")
        .attr("dy", 4)
        .attr("x", d => d.children ? -12 : 12)
        .style("text-anchor", d => d.children ? "end" : "start")
        .style("font-size", "14px")
        .text(d => d.data.name);
}

buildTree();

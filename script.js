const API_BASE = "https://digitalcollections-accept.library.maastrichtuniversity.nl/api";
const ITEMSET_ID = 60514;

// Fetch all items in the item set
async function fetchItems() {
    const url = `${API_BASE}/items?item_set_id=${ITEMSET_ID}&per_page=500`;
    const response = await fetch(url);
    return await response.json();
}

async function buildTree() {
    const items = await fetchItems();

    // Separate persons and objects
    const persons = [];
    const objects = [];

    items.forEach(item => {
        const ownedFrom = item["schema:ownedFrom"];

        if (ownedFrom && ownedFrom.length > 0) {
            // This is an object
            objects.push({
                id: item["o:id"],
                label: item["o:title"],
                personId: ownedFrom[0]["value_resource_id"]
            });
        } else {
            // This is a person
            persons.push({
                id: item["o:id"],
                label: item["o:title"]
            });
        }
    });

    // Build hierarchical structure
    const treeData = {
        name: "Digital Memory Tree",
        children: persons.map(person => ({
            name: person.label,
            children: objects
                .filter(obj => obj.personId === person.id)
                .map(obj => ({ name: obj.label }))
        }))
    };

    renderTree(treeData);
}

function renderTree(data) {
    const width = 1400;
    const height = 900;

    const svg = d3.select("svg")
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
        .attr("r", d => d.depth === 0 ? 10 : d.depth === 1 ? 6 : 4)
        .attr("fill", d => d.depth === 0 ? "#4682b4" : d.depth === 1 ? "#4CAF50" : "#FFC107");

    node.append("text")
        .attr("dy", 4)
        .attr("x", d => d.children ? -12 : 12)
        .style("text-anchor", d => d.children ? "end" : "start")
        .style("font-size", "14px")
        .text(d => d.data.name);
}

buildTree();

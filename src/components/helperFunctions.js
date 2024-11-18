export const getSunburstDataFromFile = (textFile) => {
    fetch(`file:///Results/res.txt`)
        .then((res) => res.text())
        .then((text) => {
            console.log('asklödfjhaksdjf')
            console.log(text)
        })
        .catch((e) => console.error(e));
    return
}

// Function to parse a single line into a path array and support value
function parsePattern(line) {
    const [pattern, supportStr] = line.split("#SUP:");
    const support = parseFloat(supportStr.trim());

    // Split into sequence steps and then split each step into items
    const steps = pattern.trim().split("=>").map(step => step.trim().split("||").map(item => item.trim()));
    return { steps, support };
}

// Recursive function to build the Sunburst hierarchy
function addToTree(tree, steps, support) {
    let currentLevel = tree;

    // Loop through each step, adding them as children layer by layer
    steps.forEach((step, index) => {
        // Check if this step already exists at this level
        let childNode = currentLevel.children.find(child => child.name === step);

        // If this step doesn't exist yet at this level, create it
        if (!childNode) {
            childNode = { name: step, children: [] };
            currentLevel.children.push(childNode);
        }

        // Move to this child node for the next step
        currentLevel = childNode;
    });
    // Attach support to the final node (leaf)
    currentLevel.size = support;
}

// Convert patterns to a hierarchical structure
export const buildHierarchy = (patterns) => {
    const root = { name: "root", children: [] };
    patterns.forEach(patternStr => {
        const { steps, support } = parsePattern(patternStr);
        addToTree(root, steps, support);
    });

    return root;
}

////////////////////////////////////////////////////    ICICLE    //////////////////////////////////////////////////
function parsePatternIcicle(line) {
    const [pattern, supportStr] = line.split("#SUP:");
    const support = parseFloat(supportStr.trim());

    // Split the pattern into sequence steps, each step separated by '=>'
    const steps = pattern.trim().split("=>").map(step => step.trim());

    return { steps, support };
}

function addToTreeIcicle(tree, steps, support) {
    let currentNode = tree;

    // For each step in the sequence
    steps.forEach(step => {
        // Find if this step already exists as a child node
        let childNode = currentNode.children.find(child => child.name === step);

        // If the step doesn't exist yet at this level, create it
        if (!childNode) {
            childNode = { name: step, children: [] };
            currentNode.children.push(childNode);
        }

        // Move to the current child node for the next iteration
        currentNode = childNode;
    });

    // Attach the support value to the final node in the sequence path
    currentNode.size = support;
}

export const buildIcicleHierarchy = (patterns) => {

    const root = { name: "", children: [] };
    console.log(patterns)
    // Process each pattern, parse it, and add it to the tree
    patterns.forEach(patternStr => {
        const { steps, support } = parsePatternIcicle(patternStr);
        addToTreeIcicle(root, steps, support);
    });

    return root;
}

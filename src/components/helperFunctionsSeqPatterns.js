// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
// // // // // // // // // // // //    Sequential Patterns  // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
function addToTreeIcicle(tree, steps, support) {
    let currentNode = tree;

    // For each step in the sequence
    steps.forEach((step, index) => {
        // Find if this step already exists as a child node
        let childNode = currentNode.children.find(
            (child) => child.name === step
        );

        // If the step doesn't exist yet at this level, create it
        if (!childNode) {
            childNode = {
                name: step,
                children: [],
                size: index === steps.length - 1 ? support : 0,
                support: index === steps.length - 1 ? support : 0
            };
            currentNode.children.push(childNode);
        } else {
            while (
                currentNode.children.some(
                    (child) => child.name === step && child !== childNode
                )
            ) {
                step += "\u200Basef";
            }
            childNode.name = step;
        }

        // Move to the current child node for the next iteration
        currentNode = childNode;
    });
}

export const buildIcicleHierarchySeqPats = (patterns) => {
    if (patterns === undefined || patterns == [] || patterns.length === 0) {
        console.log("empty: ", buildIcicleHierarchySeqPats(["Empty dataset #SUP:1"]));
        return buildIcicleHierarchySeqPats(["Empty dataset #SUP:1"]);
    }
    const root = { name: "", children: [] };
    // Process each pattern, parse it, and add it to the tree
    let parsedData = patterns.map((item) => {
        const [patternStr, support] = item.split("#SUP:");
        const steps = patternStr.split("=>").map((step) => step.trim());
        return {
            steps,
            support: parseFloat(support.trim()),
        };
    });
    parsedData.sort((a, b) => a.steps.length - b.steps.length); // Sort by step count

    // Add sorted patterns to the tree
    parsedData.forEach(({ steps, support }) => {
        addToTreeIcicle(root, steps, support);
    });

    return root;
};


// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
// // // // // // // // // // // //    Association rules    // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
function addToAssRulesTreeIcicle(tree, steps, support, confidence, basisForSupportFromOutput, basisForWholeDataSet) {
    let currentNode = tree;

    // For each step in the sequence
    steps.forEach((step, index) => {
        // Find if this step already exists as a child node
        let childNode = currentNode.children.find(
            (child) => child.name === step
        );

        // If the step doesn't exist yet at this level, create it
        if (!childNode) {
            const sup = index === steps.length - 1 ? support : 0
            const supWithDifferentBase = sup === 0 ? 0 : sup * basisForSupportFromOutput / basisForWholeDataSet
            childNode = {
                name: step,
                children: [],
                size: sup,
                support: sup,
                confidence: index === steps.length - 1 ? confidence : 0,
                supportWithDifferentBase: supWithDifferentBase
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

export const buildAssRulesIcicleHierarchy = (patterns, basisForSupportFromOutput, basisForWholeDataSet) => {
    if (patterns === undefined || patterns == [] || patterns.length === 0) {
        return buildAssRulesIcicleHierarchy(["Empty dataset #SUP: 1 #CONF: 1"]);
    }
    const root = { name: "", children: [] };
    // Process each pattern, parse it, and add it to the tree
    let parsedData = patterns.map((item) => {
        const match = item.match(/(.+?)\s+#SUP:\s+([\d.]+)\s+#CONF:\s+([\d.]+)/)
        if (match) {
            const [_, patternStr, support, confidence] = match;
            const steps = patternStr.split("=>").map((step) => step.trim());
            return {
                steps,
                support: parseFloat(support.trim()),
                confidence: parseFloat(confidence.trim()),
            };
        }
    });
    parsedData.sort((a, b) => a.steps.length - b.steps.length); // Sort by step count

    // Add sorted patterns to the tree
    parsedData.forEach(({ steps, support, confidence }) => {
        addToAssRulesTreeIcicle(root, steps, support, confidence, basisForSupportFromOutput, basisForWholeDataSet);
    });
    return root;
};
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

// Function to adjust the size of parent nodes
// BAD FUNCTION -> multiple children with high support go over the edge of parent node
function adjustSizeRecursively(node) {
    console.log(
        "Dont use this function, except you know what youre doing!!!!!!"
    );
    if (!node.children || node.children.length === 0) {
        // Leaf node: no children to process
        node.size = node.size ? parseFloat(node.size.toFixed(4)) : 0;
        return node.size;
    }
    // Calculate the total support of all children

    // Calculate the total child support
    const childSupportSum = node.children.reduce((sum, child) => {
        return sum + adjustSizeRecursively(child);
    }, 0);

    // Subtract the children's support sum from the parent node
    if (node.size) {
        node.size = parseFloat((node.size - childSupportSum).toFixed(4));
    } else {
        node.size = 0;
    }
    return parseFloat((node.size + childSupportSum).toFixed(4));
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


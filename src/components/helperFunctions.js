// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
// // // // // // // // // // // //    Association rules    // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // //
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

export const buildIcicleHierarchy = (patterns) => {
    if (patterns === undefined || patterns == [] || patterns.length === 0) {
        console.log("empty: ", buildIcicleHierarchy(["Empty dataset #SUP:1"]));
        return buildIcicleHierarchy(["Empty dataset #SUP:1"]);
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

// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
// // // // // // // // // // // //    Frequent Itemsets    // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 

export const buildFrequentItemsetHierarchy = (patterns) => {
    if (!patterns || patterns.length === 0) {
        return buildFrequentItemsetHierarchy(["Empty dataset #SUP:1"]);
    }
    const root = {
        name: "Root",
        children: [],
        size: 0,
        support: 1
    };

    // Parse input patterns to return all freq. Itemsets as: { Array of elements, support }
    const parsedData = patterns.map(parseFrequentItemsetPatterns);

    // Add children recursively
    addChildrenRecursively(root, parsedData, root, [])
    // Now every child should have correct size with sum of size of all children <= parentSize
    // Now adjust to be represented correctly by D3...
    adjustSizeRecursively(root);
    return root;
};

/**
 * This function adds children recursively to nodes, based on the parsed data it is given
 * It calls itself on its children and filters the parsed data to squash smaller children
 * if they are represented under its bigger children.
 * It returns the support for all nodesit has used up, so that it can be filtered out for its siblings.
 */
const addChildrenRecursively = (rootNode, siblingsData, treeParentNode, pathToParent) => {
    if (siblingsData.length === 0 || siblingsData == [[]]) return [];
    // Get biggest element in remaining data
    const individualSiblingsSorted = siblingsData
        .filter(({ elements }) => elements.length === 1)
        .sort((a, b) => b.support - a.support);
    let notYetAddedSiblings = individualSiblingsSorted.map(({ elements }) => elements[0])
    let alreadyAddedSiblings = []

    // Siblings size should be: supNotUsedByBiggerSiblings / parentSup * parentSize
    individualSiblingsSorted.forEach((currentSibling) => {
        const currentName = currentSibling.elements[0]
        const currentPath = [...pathToParent, currentName]
        const finalSum = currentSibling.support - getSumOfAlreadyExistingNodes(rootNode, [...currentPath])
        const treeParentNodeSize = treeParentNode.size == 0 ? 1 : treeParentNode.size
        treeParentNode.children.push({
            name: currentName,
            children: [],
            size: finalSum,//finalSum / treeParentNode.support * treeParentNodeSize,//currentSize,
            support: currentSibling.support,
            finalSum: finalSum//notUsedSiblingSupportMap.get(currentName)
        });
        // Siblings support was fully used up, since it was added to parent

        // Add children of biggest child by calling this function on all filtered itemsets that 
        // contained the current Nodes name
        const newData = siblingsData.filter(({ elements }) => elements.includes(currentName)).filter(({ elements }) => {
            let boolNotAlreadyAdded = true
            alreadyAddedSiblings.forEach(aaS => {
                if (elements.includes(aaS)) boolNotAlreadyAdded = false
            })
            return boolNotAlreadyAdded
        })
        const newDataWithoutElement = newData.map(obj => ({
            ...obj,
            elements: obj.elements.filter(item => item !== currentName)
        }))// Funktioniert

        addChildrenRecursively(rootNode, newDataWithoutElement, treeParentNode.children.find(c => c.name === currentName), [...currentPath])

        // Substract used support by children manually from unused support for following siblings
        // Leave out already added siblings
        notYetAddedSiblings = notYetAddedSiblings.filter((s) => s !== currentName)
        alreadyAddedSiblings.push(currentName)
    })
};

/**
 * Before the childrens sizes are set, the parents size should be final
 * 
 * All siblings sizes should be set in order from biggest to smallest
 * A node size is only set, when all its descendants are set.
 * 
 */

const parseFrequentItemsetPatterns = (line) => {
    const [pattern, supportStr] = line.split("#SUP:");
    const support = parseFloat(supportStr.trim());
    const elements = pattern
        .trim()
        .split("||")
        .map((e) => e.trim());
    return { elements, support };
};


// For a node to already have been included in the calling Node, all elements in the path to the 
// calling node have to be on the currentPath
const getSumOfAlreadyExistingNodes = (treeNode, namesStillToPass) => {
    const index = namesStillToPass.indexOf(treeNode.name)
    if (index > -1) {
        namesStillToPass.splice(index, 1)
        if (namesStillToPass.length === 0) {
            return treeNode.finalSum
        }
    }
    // namesStillToPass still gt 0
    if (treeNode.children && treeNode.children.length > 0) {
        return treeNode.children.reduce((totalSum, child) => {
            const notPassedYet = [...namesStillToPass]
            return totalSum + getSumOfAlreadyExistingNodes(child, notPassedYet)
        }, 0)
    } else {
        return 0
    }

}

export const getHTML = (nodeName, size, remainingSize, depth) => {
    let html = `<strong>Name:</strong> ${nodeName}<br/>
                <strong>Support:</strong> ${size.toFixed(4)}<br/>`
    if (remainingSize && remainingSize > 0) html = html + `<strong>Remaining support:</strong> ${remainingSize.toFixed(4)}<br/>`
    return html + `<strong>Depth:</strong> ${depth}`
}
// Function to parse a single line into a path array and support value
function parsePattern(line) {
    const [pattern, supportStr] = line.split("#SUP:");
    const support = parseFloat(supportStr.trim());

    // Split into sequence steps and then split each step into items
    const steps = pattern
        .trim()
        .split("=>")
        .map((step) =>
            step
                .trim()
                .split("||")
                .map((item) => item.trim())
        );
    return { steps, support };
}

// Recursive function to build the Sunburst hierarchy
function addToTree(tree, steps, support) {
    let currentLevel = tree;

    // Loop through each step, adding them as children layer by layer
    steps.forEach((step, index) => {
        // Check if this step already exists at this level
        let childNode = currentLevel.children.find(
            (child) => child.name === step
        );

        // If this step doesn't exist yet at this level, create it
        if (!childNode) {
            childNode = {
                name: step,
                children: [],
            };
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
    const root = {
        name: "root",
        children: [],
    };
    patterns.forEach((patternStr) => {
        const { steps, support } = parsePattern(patternStr);
        addToTree(root, steps, support);
    });

    return root;
};

////////////////////////////////////////////////////    ICICLE    //////////////////////////////////////////////////
function parsePatternIcicle(line) {
    const [pattern, supportStr] = line.split("#SUP:");
    const support = parseFloat(supportStr.trim());
    // Split the pattern into sequence steps, each step separated by '=>'
    const steps = pattern
        .trim()
        .split("=>")
        .map((step) => step.trim());
    return { steps, support };
}

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
        //console.log("no children", node.size)
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
    // console.log("node", node.name, "support", node.size)
    // console.log(parseFloat((node.size + childSupportSum).toFixed(4)))
    return parseFloat((node.size + childSupportSum).toFixed(4));
}

export const buildIcicleHierarchy = (patterns) => {
    if (patterns === undefined || patterns == []) {
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

    //console.log(root)
    //adjustSupportRecursively(root);
    //console.log(root)
    return root;
};

// // // // // // Frequent Itemsets // // // // // //

/*function addToTreeRecursivelyFrequentItemsets(
  tree,
  remainingPatterns,
  currentElements = []
) {
  const levelElements = remainingPatterns
    .filter(({ elements }) => elements.length === currentElements.length + 1)
    .filter(({ elements }) =>
      currentElements.every((ce) => elements.includes(ce))
    );

  levelElements.forEach(({ elements, support }) => {
    const nextElement = elements.find((e) => !currentElements.includes(e));
    if (!nextElement) return;

    // Check if the element already exists at this level
    let childNode = tree.children.find((child) => child.name === nextElement);
    if (!childNode) {
      // Create the child node if not exists
      childNode = { name: nextElement, children: [], size: support };
      tree.children.push(childNode);

      // Sort children by size (descending)
      tree.children.sort((a, b) => b.size - a.size);
    }

    // Recurse for further levels
    const nextElements = [...currentElements, nextElement];
    addToTreeRecursivelyFrequentItemsets(
      childNode,
      remainingPatterns,
      nextElements
    );
  });
}



const sortNodesRecursively = (node) => {
  if (node.children) node.children.forEach((n) => sortNodesRecursively(n));
  node.children.sort((a, b) => b.size - a.size);
};
export const buildFrequentItemsetHierarchy = (patterns) => {
  if (!patterns || patterns.length === 0) {
    return buildFrequentItemsetHierarchy(["Empty dataset #SUP:1"]);
  }

  const root = { name: "Root", children: [] };

  // Parse input patterns
  const parsedData = patterns.map(parseFrequentItemsetPatterns);

  // Add first-level elements
  const firstLevelElements = parsedData.filter(
    ({ elements }) => elements.length === 1
  );
  firstLevelElements.forEach(({ elements, support }) => {
    const element = elements[0];
    root.children.push({ name: element, children: [], size: support });
  });

  // Sort first-level elements by size (descending)
  // Recursively sort nodes

  sortNodesRecursively(root);

  // Add higher-level elements recursively
  addToTreeRecursivelyFrequentItemsets(root, parsedData);

  // Adjust size correctly, but handle first level nodes differently
  // Only squash children on second level
  root.children.forEach((c) => {
      adjustFrequentItemsetSizeRecursively(
        c.children,
        c.size
      );
  });

  return root;
};*/

export const buildFrequentItemsetHierarchy = (patterns) => {
    if (!patterns || patterns.length === 0) {
        return buildFrequentItemsetHierarchy(["Empty dataset #SUP:1"]);
    }
    const root = {
        name: "Root",
        children: [],
        size: 1,
        support: 1
    };

    // Parse input patterns to return all freq. Itemsets as: { Array of elements, support }
    const parsedData = patterns.map(parseFrequentItemsetPatterns);

    // Add children recursively
    addChildrenRecursively(parsedData, root)
    // Now every child should have correct size with sum of size of all children <= parentSize
    // Now adjust to be represented correctly by D3...
    console.log("Adjust???")
    console.log(root)
    //adjustSizeRecursively(root);
    return root;
};

/**
 * This function adds children recursively to nodes, based on the parsed data it is given
 * It calls itself on its children and filters the parsed data to squash smaller children
 * if they are represented under its bigger children.
 * It returns the support for all nodesit has used up, so that it can be filtered out for its siblings.
 */
const addChildrenRecursively = (siblingsData, treeParentNode) => {
    if (siblingsData.length === 0 || siblingsData == [[]]) return [];
    // Get biggest element in remaining data
    const individualSiblingsSorted = siblingsData
        .filter(({ elements }) => elements.length === 1)
        .sort((a, b) => b.support - a.support);
    console.log("individualSiblingsSorted", individualSiblingsSorted, "with parent:", treeParentNode.name)
    //Map used to capture the support already used by siblings
    const notUsedSiblingSupportMap = new Map()
    individualSiblingsSorted.forEach(({ elements, support }) => notUsedSiblingSupportMap.set(elements[0], support))
    /////console.log("Create new sibling support map:")
    /////for (const [k, v] of notUsedSiblingSupportMap) {
    /////console.log("not used sibling support map:", k, v)
    /////}
    // Keeping track of already added and not yet added siblings
    let notYetAddedSiblings = individualSiblingsSorted.map(({ elements }) => elements[0])
    let alreadyAddedSiblings = []

    // Siblings size should be: supNotUsedByBiggerSiblings / parentSup * parentSize
    individualSiblingsSorted.forEach((currentSibling) => {
        const currentName = currentSibling.elements[0]
        // console.log("Current Name", currentName)

        const currentSize = notUsedSiblingSupportMap.get(currentName) / treeParentNode.support * treeParentNode.size
        treeParentNode.children.push({
            name: currentName,
            children: [],
            size: currentSize,
            support: currentSibling.support,
            notUsedSiblSup: notUsedSiblingSupportMap.get(currentName)
        });
        // Siblings support was fully used up, since it was added to parent
        /////console.log("USED: ", notUsedSiblingSupportMap.get(currentName), "name:", currentName, "Current siblings:", individualSiblingsSorted.map(s => [s.elements[0], s.support]), "current Parent", treeParentNode.name)
        notUsedSiblingSupportMap.set(currentName, 0)

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

        addChildrenRecursively(newDataWithoutElement, treeParentNode.children.find(c => c.name === currentName))

        // Substract used support by children manually from unused support for following siblings
        // Leave out already added siblings
        notYetAddedSiblings = notYetAddedSiblings.filter((s) => s !== currentName)
        alreadyAddedSiblings.push(currentName)
        for (const key of notYetAddedSiblings) {
            // Find out how much support was used for key by currentName
            //if (currentName === "1.0") console.log("not yet added:", notYetAddedSiblings, "newData", newData)
            //const amountUsed = newData.filter(({ elements }) => elements.includes(key) && elements.length === 2).reduce((acc, { elements, support }) => acc + support, 0.0)
            const amountUsed = siblingsData.filter(({ elements }) => elements.includes(key) && elements.length === 2)
                .filter(({ elements }) => {
                    let boolNotAlreadyAdded = true
                    alreadyAddedSiblings.forEach(aaS => {
                        if (elements.includes(aaS)) boolNotAlreadyAdded = false
                    })
                    return boolNotAlreadyAdded
                })
                .reduce((acc, { elements, support }) => acc + support, 0.0)
            // Substract that amount in map

            /////console.log("old: ", notUsedSiblingSupportMap.get(key), "used: ", amountUsed, "key", key, "on parent", treeParentNode.name)
            const newValue = notUsedSiblingSupportMap.get(key) - amountUsed
            //if (currentName === "1.0") console.log("Key: ", key, "amount used by current node", currentName, "is: ", amountUsed, "new value", newValue)
            if (newValue < 0) console.error("ERROR! Some error occured when calculating support used by siblings.")
            notUsedSiblingSupportMap.set(key, newValue)

            /////for (const [k, v] of notUsedSiblingSupportMap) {
            /////console.log("Current node: ", currentName, "current key: ", key, "not used sibling support map:", k, v)
            /////}
        }
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
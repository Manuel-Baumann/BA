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
function adjustSupportRecursively(node) {
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
        return sum + adjustSupportRecursively(child);
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

const parseFrequentItemsetPatterns = (line) => {
  const [pattern, supportStr] = line.split("#SUP:");
  const support = parseFloat(supportStr.trim());
  const elements = pattern
    .trim()
    .split("||")
    .map((e) => e.trim());
  return { elements, support };
};

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

const buildFrequentItemsetHierarchy = (data) => {
    if (!patterns || patterns.length === 0) {
        return buildFrequentItemsetHierarchy(["Empty dataset #SUP:1"]);
    }
    const root = {
        name: "Root",
        children: [],
        size: 0,
    };

    // Parse input patterns to return all freq. Itemsets as: { Array of elements, support }
    const parsedData = patterns.map(parseFrequentItemsetPatterns);

    // Handle first level nodes differntly: just display them - only squash children on second level
    const firstLevelElements = parsedData.filter(
        ({ elements }) => elements.length === 1
    );
    firstLevelElements
        .sort((a, b) => b.size - a.size)
        .forEach(({ elements, support }) => {
            const element = elements[0];
            root.children.push({
                name: element,
                children: [],
                size: support,
            });
        });

    // Add children recursively for each first-level-element
    firstLevelElements.forEach(({ elements, support }) => {
        // Filter out freq itemsets that dont include elements[0] and pass the remaining sets without elements[0]
        const relevantParsedData = parsedData
            .filter(({ itemset }) => itemset.contains(elements[0]))
            .map(({ itemset }) =>
                itemset.filter((item) => item !== elements[0])
            );
        addChildrenRecursively(parsedData, support);
    });
    // Now every child should have correct size with sum of size of all children <= parentSize
    // Now adjust to be represented correctly by D3...
    adjustSupportRecursively(root);
    return root;
};

/**
 * This function adds children recursively to nodes, based on the parsed data it is given
 * It calls itself on its children and filters the parsed data to squash smaller children
 * if they are represented under its bigger children.
 * It returns the parsed data it has used, so that it can be filtered out for its siblings.
 */
const addChildrenRecursively = (relevantParsedData, node, parentSize) => {
    if (relevantParsedData.length === 0) return [];
    const siblingsSorted = relevantParsedData
        .filter((fi) => fi.length === 1)
        .sort((a, b) => b.support - a.support);
    // Dont change size of biggest child and add it
    node.push({
        name: siblingsSorted[0].elements[0],
        children: [],
        size: siblingsSorted[0].support,
    });

    // Add children of biggest child

    // Since the biggest node stays at its size, its children's sizes can be adjusted
    addChildrenRecursively();
};

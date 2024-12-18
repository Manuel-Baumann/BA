// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 
// // // // // // // // // // // //    Frequent Itemsets    // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // // 


export const buildFrequentItemsetHierarchy = (patterns) => {
    if (!patterns || patterns.length === 0) {
        return buildFrequentItemsetHierarchy(["Empty dataset #SUP:1"]);
    }
    let basis = patterns.map((item) => {
        const [itemsets, support] = item.split("#SUP:")
        const sets = itemsets.split(' || ').map((set) => set.trim())
        return {
            label: sets.join(' & '),
            value: support
        }
    })

    return basis
};

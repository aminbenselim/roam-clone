import omit from "lodash/omit";

export const flattenChildren = (node) => {
  const result = {
    title: node.title,
    decendentBlocks: [],
  };

  const DFS = (node, parentId, depth = 0) => {
    if (!node.title) {
      result.decendentBlocks.push({
        // we remove the children from each block we pass
        ...omit(node, ["children"]),
        depth,
        parentId,
        isActive: false,
      });
    }

    if (node.children) {
      node.children.forEach((child) => DFS(child, node.nodeId, depth + 1));
    }
  };
  DFS(node);

  return result;
};

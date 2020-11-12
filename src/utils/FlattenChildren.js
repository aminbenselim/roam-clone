import omit from "lodash/omit";

export const flattenChildren = (node) => {
  const result = [];
  const DFS = (node, parentId, depth = -1) => {
    if (!node.title) {
      result.push({
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

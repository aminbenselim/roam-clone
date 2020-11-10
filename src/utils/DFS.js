import omit from "lodash/omit";

export const DFS = (node) => {
  const result = [];
  const recurse = (node, depth = -1) => {
    if (!node.title) {
      result.push({
        ...omit(node, ["children"]),
        depth,
        isActive: false,
      });
    }

    if (node.children) {
      node.children.forEach((child) => recurse(child, depth + 1));
    }
  };
  recurse(node);

  return result;
};

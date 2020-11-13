// Helper function to generate empty block
const generateBlock = (nodeId, parentId, depth, position) => ({
  nodeId,
  value: "",
  children: null,
  references: [],
  isActive: true,
  depth: depth || 0,
  position: position || Date.now() * 100,
  parentId,
});

// Helper function to find the indices of children of a block from within the tree
const findChildrenIndices = (tree, depth, index) => {
  const childrenIndices = [];
  // Iterate through the next blocks, and add them to the childrenIndices array
  // as long as their depth is bigger than the block's depth
  let nextInd = index + 1;
  while (tree[nextInd] && tree[nextInd].depth > depth) {
    childrenIndices.push(nextInd);
    nextInd++;
  }

  return childrenIndices;
};

export default (state, action) => {
  switch (action.type) {
    case "SET_TREE": {
      return action.tree;
    }
    case "ADD_NEW_BLOCK": {
      // Create a new tree in order not to mutate the original one.
      let newTree = state.slice();
      newTree.splice(
        action.index,
        0,
        generateBlock(
          action.nodeId,
          action.parentId,
          action.depth,
          action.position
        )
      );
      return newTree;
    }
    case "SET_BLOCK_VALUE": {
      let newTree = state.slice();
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        value: action.value,
      });
      return newTree;
    }
    case "SET_BLOCK_PARENT": {
      let newTree = state.slice();
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        parentId: action.parentId,
      });
      return newTree;
    }
    case "INCREASE_BLOCK_DEPTH": {
      let newTree = state.slice();
      const currentDepth = newTree[action.index].depth;
      // Increase the depth of the children first
      const childrenIndices = findChildrenIndices(newTree, currentDepth, action.index);
      childrenIndices.forEach((childIndex) => {
        newTree[childIndex].depth += 1;
      });
      // Then increase the depth of the parent block
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        depth: currentDepth + 1,
      });

      return newTree;
    }
    case "DECREASE_BLOCK_DEPTH": {
      let newTree = state.slice();
      const currentDepth = newTree[action.index].depth;
      // Decrease the depth of the children first
      const childrenIndices = findChildrenIndices(newTree, currentDepth, action.index);
      childrenIndices.forEach((childIndex) => {
        newTree[childIndex].depth -= 1;
      });
      // Then decrease the depth of the parent block
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        depth: currentDepth - 1,
      });

      return newTree;
    }
    case "SET_BLOCK_ACTIVE": {
      let newTree = state.slice();

      // Deactivate the current active block
      const currentActive = newTree.findIndex((block) => block.isActive);
      if(currentActive !== -1) {
        newTree.splice(currentActive, 1, {
          ...newTree[currentActive],
          isActive: false,
        });
      }

      // Set the desired block as active
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        isActive: true,
      });
      return newTree;
    }
    case "DELETE_BLOCK": {
      let newTree = state.slice();
      newTree.splice(action.index, 1);
      return newTree;
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
};

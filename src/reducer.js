// Helper function to generate empty block
const generateBlock = (nodeId, parentId, depth, position) => ({
  nodeId,
  value: "",
  children: null,
  references: [],
  isFocused: true,
  depth: depth || 0,
  position: position || Date.now() * 100,
  parentId,
});

// Helper function to find the indices of children of a block from within the list
const findChildrenIndices = (list, depth, index) => {
  const childrenIndices = [];
  // Iterate through the next blocks, and add them to the childrenIndices array
  // as long as their depth is bigger than the block's depth
  let nextInd = index + 1;
  while (list[nextInd] && list[nextInd].depth > depth) {
    childrenIndices.push(nextInd);
    nextInd++;
  }

  return childrenIndices;
};

export default (state, action) => {
  // Create a new list in order not to mutate the original one.
  let newList = state.slice();

  switch (action.type) {
    case "SET_LIST": {
      return action.list;
    }
    case "ADD_NEW_BLOCK": {
      const focusedBlockIndex = state.findIndex((block) => block.isFocused);
      const focusedBlock = state[focusedBlockIndex];

      if (focusedBlockIndex !== -1) {
        // Deactivate the current focused block
        newList.splice(focusedBlockIndex, 1, {
          ...focusedBlock,
          isFocused: false,
        });
      }

      // add new block below the current focused block
      newList.splice(
        focusedBlockIndex + 1,
        0,
        generateBlock(
          action.nodeId,
          focusedBlock ? focusedBlock.parentId : action.pageId,
          focusedBlock ? focusedBlock.depth : 0,
          action.position
        )
      );

      return newList;
    }
    case "SET_BLOCK_VALUE": {
      newList.splice(action.index, 1, {
        ...newList[action.index],
        value: action.value,
      });
      return newList;
    }
    case "SET_BLOCK_PARENT": {
      newList.splice(action.index, 1, {
        ...newList[action.index],
        parentId: action.parentId,
      });
      return newList;
    }
    case "INCREASE_BLOCK_DEPTH": {
      const currentDepth = newList[action.index].depth;
      // Increase the depth of the children first
      const childrenIndices = findChildrenIndices(
        newList,
        currentDepth,
        action.index
      );
      childrenIndices.forEach((childIndex) => {
        newList[childIndex].depth += 1;
      });
      // Then increase the depth of the parent block
      newList.splice(action.index, 1, {
        ...newList[action.index],
        depth: currentDepth + 1,
      });

      return newList;
    }
    case "DECREASE_BLOCK_DEPTH": {
      const currentDepth = newList[action.index].depth;
      // Decrease the depth of the children first
      const childrenIndices = findChildrenIndices(
        newList,
        currentDepth,
        action.index
      );
      childrenIndices.forEach((childIndex) => {
        newList[childIndex].depth -= 1;
      });
      // Then decrease the depth of the parent block
      newList.splice(action.index, 1, {
        ...newList[action.index],
        depth: currentDepth - 1,
      });

      return newList;
    }
    case "SET_BLOCK_FOCUSED": {
      // Deactivate the current focused block
      const currentFocused = newList.findIndex((block) => block.isFocused);
      if (currentFocused !== -1) {
        newList.splice(currentFocused, 1, {
          ...newList[currentFocused],
          isFocused: false,
        });
      }

      // Set the desired block as focused
      newList.splice(action.index, 1, {
        ...newList[action.index],
        isFocused: true,
      });
      return newList;
    }
    case "DELETE_BLOCK": {
      newList.splice(action.index, 1);
      return newList;
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
};

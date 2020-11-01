import React from "react";
import { nanoid } from "nanoid";

import { Block } from "./block.js";

const DEFAULT_BLOCK = () => ({
  uid: nanoid(),
  isActive: true,
  value: "",
});

function treeReducer(state, action) {
  switch (action.type) {
    case "ADD_NEW_BLOCK": {
      return state.concat(DEFAULT_BLOCK());
    }
    case "SET_BLOCK_VALUE": {
      let newTree = state.slice();
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        value: action.value,
      });
      return newTree;
    }
    case "SET_BLOCK_ACTIVE": {
      let newTree = state.slice();
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        isActive: true,
      });
      return newTree;
    }
    case "SET_BLOCK_INACTIVE": {
      let newTree = state.slice();
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        isActive: false,
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
}

export const Main = ({ active }) => {
  const [tree, dispatch] = React.useReducer(treeReducer, [DEFAULT_BLOCK()]);

  const handleChange = (index) => (event) => {
    dispatch({
      type: "SET_BLOCK_VALUE",
      index,
      value: event.target.value,
    });
  };

  return (
    <ul
      onKeyDown={(e) => {
        const code = e.keyCode ? e.keyCode : e.which;

        const activeBlockIndex = tree.findIndex((block) => block.isActive);

        //Enter keycode
        if (code === 13 && !e.shiftKey) {
          e.preventDefault();
          // remove is active from current active block
          dispatch({
            type: "SET_BLOCK_INACTIVE",
            index: activeBlockIndex,
          });
          // and add new block
          dispatch({
            type: "ADD_NEW_BLOCK",
          });
        }
        // Delete keycode
        if (code === 8) {
          if (tree[activeBlockIndex].value === "") {
            if (tree.length !== 1) {
              e.preventDefault();
              dispatch({
                type: "DELETE_BLOCK",
                index: activeBlockIndex,
              });
              dispatch({
                type: "SET_BLOCK_ACTIVE",
                index: activeBlockIndex - 1,
              });
              // previousBlock.classList.add("active");
              // previousBlock.focus();
              // previousBlock.setSelectionRange(-1, -1);
            }
          }
        }
      }}
      id="main-ul"
    >
      {tree.map((block, index) => (
        <li key={block.uid}>
          <Block block={block} handleChange={handleChange(index)} />
        </li>
      ))}
    </ul>
  );
};

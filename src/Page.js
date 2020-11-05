import React from "react";
import { Link, useParams } from "react-router-dom";
import { nanoid } from "nanoid";

import { Block } from "./Block.js";

const DEFAULT_BLOCK = (level) => ({
  uid: nanoid(10),
  level: level || 0,
  isActive: true,
  value: "",
});

function treeReducer(state, action) {
  switch (action.type) {
    case "ADD_NEW_BLOCK": {
      let newTree = state.slice();
      newTree.splice(action.index, 0, DEFAULT_BLOCK(action.level));
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
    case "SET_BLOCK_LEVEL": {
      let newTree = state.slice();
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        level: action.level,
      });
      return newTree;
    }
    case "SET_BLOCK_ACTIVE": {
      let newTree = state.slice();
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        isActive: action.value,
      });
      return newTree;
    }
    case "SET_BLOCK_EMPTY": {
      let newTree = state.slice();
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        isEmpty: action.value,
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

export const Page = ({ id, title }) => {
  const [tree, dispatch] = React.useReducer(treeReducer, [DEFAULT_BLOCK()]);
  const { id: paramId } = useParams();

  const path = `/p/${id || paramId}`;
  const handleChange = (index) => (event) => {
    dispatch({
      type: "SET_BLOCK_VALUE",
      index,
      value: event.target.value,
    });
  };

  const setBlockActive = (index) => () => {
    const activeBlockIndex = tree.findIndex((block) => block.isActive);
    dispatch({
      type: "SET_BLOCK_ACTIVE",
      index: activeBlockIndex,
      value: false,
    });
    dispatch({
      type: "SET_BLOCK_ACTIVE",
      index,
      value: true,
    });
  };

  return (
    <div className="page">
      <h2>
        <Link to={path}>{title}</Link>
      </h2>
      <div
        onKeyDown={(e) => {
          const code = e.keyCode ? e.keyCode : e.which;

          const activeBlockIndex = tree.findIndex((block) => block.isActive);
          const blocksCount = tree.length;

          //Enter keycode
          if (code === 13 && !e.shiftKey) {
            e.preventDefault();
            // remove is active from current active block
            dispatch({
              type: "SET_BLOCK_ACTIVE",
              index: activeBlockIndex,
              value: false,
            });
            // and add new block after the current active block
            dispatch({
              type: "ADD_NEW_BLOCK",
              index: activeBlockIndex + 1,
              level: tree[activeBlockIndex].level
            });
          }
          // Delete keycode
          if (code === 8) {
            if (tree[activeBlockIndex].isEmpty) {
              if (tree.length !== 1) {
                e.preventDefault();
                dispatch({
                  type: "DELETE_BLOCK",
                  index: activeBlockIndex,
                });
                dispatch({
                  type: "SET_BLOCK_ACTIVE",
                  index: activeBlockIndex - 1,
                  value: true,
                });
              }
            }
          }
          // keyboard navigation
          if (e.keyCode === 38) {
            if (blocksCount > 1) {
              e.preventDefault();
              dispatch({
                type: "SET_BLOCK_ACTIVE",
                index: activeBlockIndex,
                value: false,
              });
              dispatch({
                type: "SET_BLOCK_ACTIVE",
                index: (blocksCount + activeBlockIndex - 1) % blocksCount,
                value: true,
              });
            }
          }
          if (e.keyCode === 40) {
            if (blocksCount > 1) {
              e.preventDefault();
              dispatch({
                type: "SET_BLOCK_ACTIVE",
                index: activeBlockIndex,
                value: false,
              });
              dispatch({
                type: "SET_BLOCK_ACTIVE",
                index: (activeBlockIndex + 1) % blocksCount,
                value: true,
              });
            }
          }

          if (e.keyCode === 9) {
            e.preventDefault();
            if (blocksCount > 1) {
              const prevBlockIndex = activeBlockIndex - 1;
              if (prevBlockIndex !== -1) {
                dispatch({
                  type: "SET_BLOCK_LEVEL",
                  index: activeBlockIndex,
                  level: tree[prevBlockIndex].level + 1,
                });
              }
            }
          }

          if (e.keyCode === 9 && e.shiftKey) {
            e.preventDefault();
            if (tree[activeBlockIndex].level > 0) {
              dispatch({
                type: "SET_BLOCK_LEVEL",
                index: activeBlockIndex,
                level: tree[activeBlockIndex].level - 1,
              });
            }
          }
        }}
      >
        {tree.map((block, index) => (
          <Block
            key={block.uid}
            block={block}
            handleChange={handleChange(index)}
            setBlockActive={setBlockActive(index)}
          />
        ))}
      </div>
    </div>
  );
};

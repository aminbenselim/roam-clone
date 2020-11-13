import React from "react";
import { Link, useParams } from "react-router-dom";
import debounce from "lodash/debounce";

import {
  getChildren,
  createEmptyNode,
  deleteNode,
  setNodeValue,
  setNodeParent,
} from "./dgraph";
import { flattenChildren } from "./utils/FlattenChildren";
import treeReducer from "./reducer";
import { Block } from "./Block.js";

const KEY = { DEL: 8, TAB: 9, RETURN: 13, UP: 38, DOWN: 40 };

const debouncedSetParent = debounce(
  (nodeId, parentId) => setNodeParent(nodeId, parentId),
  300
);

export const Page = ({ id, title }) => {
  const [tree, dispatch] = React.useReducer(treeReducer, []);

  const { nodeId } = useParams();
  const pageId = id || nodeId;

  React.useEffect(() => {
    const fetchPageData = async () => {
      const childrenNodes = await getChildren(pageId);

      // if block has no child blocks
      if (!childrenNodes.children) {
        const nodeId = await createEmptyNode(pageId);

        dispatch({
          type: "ADD_NEW_BLOCK",
          index: 0,
          nodeId,
        });
      } else {
        const data = flattenChildren(childrenNodes);
        dispatch({
          type: "SET_TREE",
          tree: data,
        });
        dispatch({
          type: "SET_BLOCK_ACTIVE",
          index: data.length - 1,
          value: true,
        });
      }
    };

    fetchPageData();
  }, []);

  const path = `/b/${pageId}`;

  const setNodeValueInTree = (index) => (value) => {
    dispatch({
      type: "SET_BLOCK_VALUE",
      index,
      value,
    });
  };

  const findNextParent = (depth, index) => {
    // find the indexes of all the nodes that have the same depth
    const a = tree.reduce((acc, node, ind) => {
      return node.depth === depth ? acc.concat(ind) : acc;
    }, []);

    // return the parent of the most recent node
    return (
      tree[a.reverse().find((ind) => ind < index)] &&
      tree[a.reverse().find((ind) => ind < index)].parentId
    );
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
      {tree && (
        <div
          onKeyDown={async (e) => {
            const code = e.keyCode ? e.keyCode : e.which;

            const activeBlockIndex = tree.findIndex((block) => block.isActive);
            const prevBlockIndex = activeBlockIndex - 1;
            const nextBlockIndex = activeBlockIndex + 1;
            const activeNode = tree[activeBlockIndex];
            const prevNode = tree[prevBlockIndex];
            const nextNode = tree[nextBlockIndex];

            const blocksCount = tree.length;

            if (code === KEY.RETURN && !e.shiftKey) {
              e.preventDefault();
              // create new node and set it as active block
              let newPosition = Date.now() * 100;
              // if new node is between two nodes, its position is the average
              // of the adjacent nodes positions
              if (nextNode && nextNode.depth === activeNode.depth) {
                newPosition = (nextNode.position + activeNode.position) / 2;
              }
              const nodeId = await createEmptyNode(pageId, newPosition);
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
                nodeId,
                position: newPosition,
                depth: tree[activeBlockIndex].depth,
                parentId: activeNode.parentId,
              });
            }
            // Delete keycode
            if (code === KEY.DEL) {
              if (!activeNode.value) {
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
                  deleteNode(tree[activeBlockIndex]);
                }
              }
            }
            // keyboard navigation
            if (e.keyCode === KEY.UP) {
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
            if (e.keyCode === KEY.DOWN) {
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
            // Tab key
            if (e.keyCode === KEY.TAB) {
              e.preventDefault();
              if (e.shiftKey) {
                if (activeNode.depth - 1 > -1) {
                  const newParent =
                    findNextParent(activeNode.depth - 1, activeBlockIndex) ||
                    pageId;
                  dispatch({
                    type: "DECREASE_BLOCK_DEPTH",
                    index: activeBlockIndex,
                  });
                  dispatch({
                    type: "SET_BLOCK_PARENT",
                    index: activeBlockIndex,
                    parentId: newParent,
                  });
                  debouncedSetParent(activeNode.nodeId, newParent);
                }
              } else {
                if (prevNode && activeNode.depth + 1 <= prevNode.depth + 1) {
                  const newParent =
                    findNextParent(activeNode.depth + 1, activeBlockIndex) ||
                    prevNode.nodeId;
                  dispatch({
                    type: "INCREASE_BLOCK_DEPTH",
                    index: activeBlockIndex,
                  });
                  dispatch({
                    type: "SET_BLOCK_PARENT",
                    index: activeBlockIndex,
                    parentId: newParent,
                  });
                  debouncedSetParent(activeNode.nodeId, newParent);
                }
              }
            }
          }}
        >
          {tree.map((block, index) => (
            <Block
              key={block.nodeId}
              block={block}
              setNodeValueInTree={setNodeValueInTree(index)}
              setBlockActive={setBlockActive(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

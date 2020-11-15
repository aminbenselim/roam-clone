import React from "react";
import { Link, useParams } from "react-router-dom";
import debounce from "lodash/debounce";

import {
  getChildren,
  createEmptyNode,
  deleteNode,
  setNodeParent,
  findReferences,
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

      // if page has no child blocks
      if (!childrenNodes.children) {
        const nodeId = await createEmptyNode(pageId);

        dispatch({
          type: "ADD_NEW_BLOCK",
          index: 0,
          nodeId,
          pageId,
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
        });
      }
    };

    fetchPageData();
    // findReferences(pageId)
  }, []);

  const path = `/b/${pageId}`;


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

    const setBlockValueInTree = (index) => (value) => {
      dispatch({
        type: "SET_BLOCK_VALUE",
        index,
        value,
      });
    };
  const setBlockActive = (index) => () => {
    dispatch({
      type: "SET_BLOCK_ACTIVE",
      index,
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
            const activeBlock = tree[activeBlockIndex];
            const prevBlock = tree[prevBlockIndex];
            const nextBlock = tree[nextBlockIndex];

            const blocksCount = tree.length;

            // Return key press
            if (code === KEY.RETURN && !e.shiftKey) {
              e.preventDefault();
              let newPosition = Date.now() * 100;
              // if new node is between two nodes, its position is the average
              // of the adjacent nodes positions
              if (nextBlock && nextBlock.depth === activeBlock.depth) {
                newPosition = (nextBlock.position + activeBlock.position) / 2;
              }
              const nodeId = await createEmptyNode(pageId, newPosition);
              // and add new block after the current active block
              dispatch({
                type: "ADD_NEW_BLOCK",
                nodeId,
                position: newPosition,
              });
            }
            // Delete key press
            if (code === KEY.DEL) {
              // if there is only one block on the page
              if (blocksCount === 1) {
                return;
              }
              if (!activeBlock.value) {
                e.preventDefault();
                // delete the active block
                dispatch({
                  type: "DELETE_BLOCK",
                  index: activeBlockIndex,
                });
                dispatch({
                  type: "SET_BLOCK_ACTIVE",
                  index: prevBlockIndex,
                });
                deleteNode(tree[activeBlockIndex]);
              }
            }
            // keyboard navigation
            if (e.keyCode === KEY.UP) {
              if (blocksCount > 1) {
                e.preventDefault();
                dispatch({
                  type: "SET_BLOCK_ACTIVE",
                  index: (blocksCount + activeBlockIndex - 1) % blocksCount,
                });
              }
            }
            if (e.keyCode === KEY.DOWN) {
              if (blocksCount > 1) {
                e.preventDefault();
                dispatch({
                  type: "SET_BLOCK_ACTIVE",
                  index: (activeBlockIndex + 1) % blocksCount,
                });
              }
            }
            // Tab key press
            if (e.keyCode === KEY.TAB) {
              e.preventDefault();
              // Shift + Tab press
              if (e.shiftKey) {
                if (activeBlock.depth > 0) {
                  // first decrease the depth of the block
                  dispatch({
                    type: "DECREASE_BLOCK_DEPTH",
                    index: activeBlockIndex,
                  });
                  // set th new parent of the block
                  const newParent =
                    findNextParent(activeBlock.depth - 1, activeBlockIndex) ||
                    pageId;
                  dispatch({
                    type: "SET_BLOCK_PARENT",
                    index: activeBlockIndex,
                    parentId: newParent,
                  });
                  debouncedSetParent(activeBlock.nodeId, newParent);
                }
              } else {

                if (prevBlock && activeBlock.depth <= prevBlock.depth) {
                  // Increase the depth of the current block
                  dispatch({
                    type: "INCREASE_BLOCK_DEPTH",
                    index: activeBlockIndex,
                  });
                  // set the new parent of the block
                  const newParent =
                    findNextParent(activeBlock.depth + 1, activeBlockIndex) ||
                    prevBlock.nodeId;
                  dispatch({
                    type: "SET_BLOCK_PARENT",
                    index: activeBlockIndex,
                    parentId: newParent,
                  });
                  debouncedSetParent(activeBlock.nodeId, newParent);
                }
              }
            }
          }}
        >
          {tree.map((block, index) => (
            <Block
              key={block.nodeId}
              block={block}
              setBlockValueInTree={setBlockValueInTree(index)}
              setBlockActive={setBlockActive(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

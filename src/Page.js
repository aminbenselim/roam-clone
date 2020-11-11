import React from "react";
import { Link, useParams } from "react-router-dom";
import debounce from "lodash/debounce";

import {
  getChildren,
  createEmptyNode,
  deleteNode,
  setNodeValue,
} from "./dgraph";
import { DFS } from "./utils/DFS";
import treeReducer from './reducer'
import { Block } from "./Block.js";

const debouncedSet = debounce(
  (nodeId, value, references) => setNodeValue(nodeId, value, references),
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
        const data = DFS(childrenNodes);
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
  const handleChange = (index) => (event) => {
    const value = event.target.value;
    dispatch({
      type: "SET_BLOCK_VALUE",
      index,
      value,
    });
    // update node value after 0.3s of inactivity
    debouncedSet(tree[index].nodeId, value);
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

            //Enter keycode
            if (code === 13 && !e.shiftKey) {
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
              });
            }
            // Delete keycode
            if (code === 8) {
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
            // shift key
            if (e.keyCode === 9) {
              e.preventDefault();
              if (blocksCount > 1) {
                if (prevBlockIndex !== -1) {
                  dispatch({
                    type: "SET_BLOCK_DEPTH",
                    index: activeBlockIndex,
                    depth: prevNode.depth + 1,
                  });
                  if(prevNode.depth === activeNode.depth) {
                    dispatch({
                      type: "SET_BLOCK_PARENT",
                      index: activeBlockIndex,
                      parent: prevNode.nodeId,
                    })
                  }
                }
              }
            }
            if (e.keyCode === 9 && e.shiftKey) {
              e.preventDefault();
              if (activeNode.depth > 0) {
                dispatch({
                  type: "SET_BLOCK_DEPTH",
                  index: activeBlockIndex,
                  depth: activeNode.depth - 1,
                });

                if(tree[prevBlockIndex].depth === activeNode.depth) {
                  dispatch({
                    type: "SET_BLOCK_PARENT",
                    index: activeBlockIndex,
                    parent: tree[prevBlockIndex].nodeId,
                  })
                }
              }
            }
          }}
        >
          {tree.map((block, index) => (
            <Block
              key={block.nodeId}
              block={block}
              handleChange={handleChange(index)}
              setBlockActive={setBlockActive(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

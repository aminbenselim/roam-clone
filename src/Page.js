import React from "react";
import { Link, useParams } from "react-router-dom";

import {
  getChildren,
  createEmptyNode,
  findReferences,
} from "./dgraph";
import { flattenChildren } from "./utils/FlattenChildren";
import listReducer from "./reducer";
import { Block } from "./Block.js";

const KEY = { DEL: 8, TAB: 9, RETURN: 13, UP: 38, DOWN: 40 };

export const Page = ({ id, title, showRefs }) => {
  const [list, dispatch] = React.useReducer(listReducer, []);
  const [pageTitle, setTitle] = React.useState(title);
  const [referencedBy, setReferencedBy] = React.useState({});
  const { nodeId } = useParams();
  const pageId = id || nodeId;

  React.useEffect(() => {
    const fetchPageData = async () => {
      const childNodes = await getChildren(pageId);
      const {title, decendentBlocks} = flattenChildren(childNodes);
      // Set title for the page
      setTitle(title);
      // If page has no decendent blocks
      if (decendentBlocks.length === 0) {
        // Create empty block
        const nodeId = await createEmptyNode(pageId);
        // Add the block to the list of decendent blocks
        dispatch({
          type: "ADD_NEW_BLOCK",
          index: 0,
          nodeId,
          pageId,
        });
      } else {
        // Set list of decendent blocks
        dispatch({
          type: "SET_LIST",
          list: decendentBlocks,
        });
        // Set the focus on the last block of the list.
        dispatch({
          type: "SET_BLOCK_FOCUSED",
          index: decendentBlocks.length - 1,
        });
      }
    };

    fetchPageData();
  }, []);

  const path = `/b/${pageId}`;

  const findNextParent = (depth, index) => {
    // find the indexes of all the nodes that have the same depth
    const a = list.reduce((acc, node, ind) => {
      return node.depth === depth ? acc.concat(ind) : acc;
    }, []);

    // return the parent of the most recent node
    return (
      list[a.reverse().find((ind) => ind < index)] &&
      list[a.reverse().find((ind) => ind < index)].parentId
    );
  };

  const setBlockValueInList = (index) => (value) => {
    dispatch({
      type: "SET_BLOCK_VALUE",
      index,
      value,
    });
  };
  const setBlockFocused = (index) => () => {
    dispatch({
      type: "SET_BLOCK_FOCUSED",
      index,
    });
  };

  const fetchReferences = async () => {
    const refs = await findReferences(pageId);

    setReferencedBy(refs);
  };

  return (
    <div className="page">
      <h2>
        <Link to={path}>{pageTitle}</Link>
      </h2>
      {list && (
        <div
          onKeyDown={async (e) => {
            const code = e.keyCode ? e.keyCode : e.which;
            const shiftKeyPressed = e.shiftKey;

            const focusedBlockIndex = list.findIndex((block) => block.isFocused);
            const prevBlockIndex = focusedBlockIndex - 1;
            const nextBlockIndex = focusedBlockIndex + 1;
            const focusedBlock = list[focusedBlockIndex];
            const prevBlock = list[prevBlockIndex];
            const nextBlock = list[nextBlockIndex];

            const blocksCount = list.length;

            // Return key press
            if (code === KEY.RETURN && !shiftKeyPressed) {
              e.preventDefault();
              let newPosition = Date.now() * 100;
              // if new node is between two nodes, its position is the average
              // of the adjacent nodes positions
              if (nextBlock && nextBlock.depth === focusedBlock.depth) {
                newPosition = (nextBlock.position + focusedBlock.position) / 2;
              }
              const nodeId = await createEmptyNode(pageId, newPosition);
              // and add new block after the current focused block
              dispatch({
                type: "ADD_NEW_BLOCK",
                nodeId,
                position: newPosition,
              });
            }
            // Delete key press
            if (code === KEY.DEL) {
              // Check if there is only one block on the page
              if (blocksCount === 1) {
                return;
              }
              // Check if the block is empty
              if (!focusedBlock.value) {
                e.preventDefault();
                // delete the focused block
                dispatch({
                  type: "DELETE_BLOCK",
                  index: focusedBlockIndex,
                });
                dispatch({
                  type: "SET_BLOCK_FOCUSED",
                  index: prevBlockIndex,
                });
              }
            }
            // keyboard navigation
            if (e.keyCode === KEY.UP) {
                e.preventDefault();
                dispatch({
                  type: "SET_BLOCK_FOCUSED",
                  index: (blocksCount + focusedBlockIndex - 1) % blocksCount,
                });
            }
            if (e.keyCode === KEY.DOWN) {
                e.preventDefault();
                dispatch({
                  type: "SET_BLOCK_FOCUSED",
                  index: (focusedBlockIndex + 1) % blocksCount,
                });
            }
            // Tab key press
            if (e.keyCode === KEY.TAB) {
              e.preventDefault();
              // Shift + Tab press
              if (e.shiftKey) {
                if (focusedBlock.depth > 0) {
                  // first decrease the depth of the block
                  dispatch({
                    type: "DECREASE_BLOCK_DEPTH",
                    index: focusedBlockIndex,
                  });
                  // set th new parent of the block
                  const newParent =
                    findNextParent(focusedBlock.depth - 1, focusedBlockIndex) ||
                    pageId;
                  dispatch({
                    type: "SET_BLOCK_PARENT",
                    index: focusedBlockIndex,
                    parentId: newParent,
                  });
                }
              } else {
                if (prevBlock && focusedBlock.depth <= prevBlock.depth) {
                  // Increase the depth of the current block
                  dispatch({
                    type: "INCREASE_BLOCK_DEPTH",
                    index: focusedBlockIndex,
                  });
                  // set the new parent of the block
                  const newParent =
                    findNextParent(focusedBlock.depth + 1, focusedBlockIndex) ||
                    prevBlock.nodeId;
                  dispatch({
                    type: "SET_BLOCK_PARENT",
                    index: focusedBlockIndex,
                    parentId: newParent,
                  });
                }
              }
            }
          }}
        >
          {list.map((block, index) => (
            <Block
              key={block.nodeId}
              block={block}
              setBlockValueInList={setBlockValueInList(index)}
              setBlockFocused={setBlockFocused(index)}
            />
          ))}
          {showRefs && (
            <div>
              <h2 className="references-header" onClick={fetchReferences}>References</h2>
              <ul>
                {Object.entries(referencedBy).map(([pageId, refs]) => (
                  <li key={pageId}>
                    <Link to={`/b/${pageId}`}>{refs[0].pageTitle}</Link>
                    <ul>
                      {refs.map((ref) => (
                        <li key={ref.nodeId}>
                          <Link to={`/b/${ref.nodeId}`}>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: ref.value ? ref.value : " ",
                              }}
                              style={{ width: "100%" }}
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

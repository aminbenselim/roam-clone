import React from "react";
import { Link, useParams } from "react-router-dom";
import { nanoid } from "nanoid";
import { useQuery } from "react-query";
import omit from "lodash/omit";
import { queryChildrenByNode } from "./dgraph";
import { dgraphClient } from "./index";

import { Block } from "./Block.js";

const DEFAULT_BLOCK = (depth, position) => ({
  nodeId: nanoid(10),
  isActive: true,
  value: "",
  children: null,
  depth: depth || 0,
  position: position || Date.now() * 100,
  references: [],
});

const DFS = (node) => {
  const result = [];
  const recurse = (node, depth = -1) => {
    const visited = [];

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

const createNewNode = async (node, parentId) => {
  let nodeId;
  let nextPosition;
  let newPosition = Date.now() * 100;
  // create new transaction
  const txn = dgraphClient.newTxn();

  try {
    // query to find if page with this title is available
    const query = `query {
      find(func: eq(Node.position, "${node.position}")) @normalize {
        nodeId: uid
        Node.parent {
          ~Node.parent @filter(gt(Node.position, "${node.position}")) (orderasc: Node.position, first: 1) {
            nextPosition: Node.position
          }
        }
      }
    }`;
    const res = await txn.query(query);

    if (res.data.find.length === 1) {
      nodeId = res.data.find[0].nodeId;
      nextPosition = res.data.find[0].nextPosition;
    } else {
      // if this is the default active node
      // create a new node with value
      const mu = await txn.mutate({
        setNquads: `_:node <Node.position> "${node.position}"^^<xs:int>	 .
        _:node <dgraph.type> "Node" .`,
      });
      nodeId = mu.data.uids.node;
    }

    // calculate new position
    if (nextPosition) {
      newPosition = (node.position + nextPosition) / 2;
    }

    await txn.mutate({
      setNquads: `<${nodeId}> <Node.value>  "${node.value}" .
        <${nodeId}> <Node.parent> <${parentId}> .`,
    });

    await txn.commit();
  } finally {
    await txn.discard();
  }

  return { nodeId, newPosition };
};

const deleteNode = async (node) => {
  // create new transaction
  const txn = dgraphClient.newTxn();

  try {
    await txn.mutate({ deleteNquads: `<${node.nodeId}> * * .`, commitNow: true });
  } catch (error) {
    console.log({error})
  } finally {
    await txn.discard();
  }
}

function treeReducer(state, action) {
  switch (action.type) {
    case "SET_TREE": {
      return action.tree;
    }
    case "ADD_NEW_BLOCK": {
      let newTree = state.slice();
      newTree.splice(action.index, 0, DEFAULT_BLOCK(action.depth, action.position));
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
    case "SET_BLOCK_ID": {
      let newTree = state.slice();
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        nodeId: action.nodeId,
      });
      return newTree;
    }
    case "SET_BLOCK_depth": {
      let newTree = state.slice();
      newTree.splice(action.index, 1, {
        ...newTree[action.index],
        depth: action.depth,
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
  const { nodeId } = useParams();
  const pageId = id || nodeId;
  const { status, data, error, isFetching } = useQuery(
    ["fetchNodes", pageId],
    async () => {
      const res = await dgraphClient
        .newTxn({ readOnly: true })
        .queryWithVars(queryChildrenByNode, {
          $nodeId: pageId,
        });

      return DFS(res.data.queryChildrenByNode[0]);
    },
    {
      staleTime: Infinity,
    }
  );

  const [tree, dispatch] = React.useReducer(treeReducer, null);

  React.useEffect(() => {
    if (data) {
      dispatch({
        type: "SET_TREE",
        tree: data.concat([DEFAULT_BLOCK()]),
      });
    }
  }, [data]);

  const path = `/b/${pageId}`;
  const handleChange = (index) => (event) => {
    dispatch({
      type: "SET_BLOCK_VALUE",
      index,
      value: event.target.value,
    });
  };

  const setBlockActive = (index) => () => {
    const activeBlockIndex = tree.findIndex((block) => block.isActive);
    console.log({ activeBlockIndex });
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
            const blocksCount = tree.length;

            //Enter keycode
            if (code === 13 && !e.shiftKey) {
              e.preventDefault();

              console.log(tree[activeBlockIndex])
              const { nodeId, newPosition } = await createNewNode(
                tree[activeBlockIndex],
                pageId
              );
              dispatch({
                type: "SET_BLOCK_ID",
                index: activeBlockIndex,
                nodeId,
              });
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
                position: newPosition,
                depth: tree[activeBlockIndex].depth,
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
            if (e.keyCode === 9) {
              e.preventDefault();
              if (blocksCount > 1) {
                const prevBlockIndex = activeBlockIndex - 1;
                if (prevBlockIndex !== -1) {
                  dispatch({
                    type: "SET_BLOCK_depth",
                    index: activeBlockIndex,
                    depth: tree[prevBlockIndex].depth + 1,
                  });
                }
              }
            }
            if (e.keyCode === 9 && e.shiftKey) {
              e.preventDefault();
              if (tree[activeBlockIndex].depth > 0) {
                dispatch({
                  type: "SET_BLOCK_depth",
                  index: activeBlockIndex,
                  depth: tree[activeBlockIndex].depth - 1,
                });
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

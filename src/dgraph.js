import groupBy from "lodash/groupBy";
import { dgraphClient } from "./index";

export const queryChildrenByNode = `
query queryChildrenByNode($nodeId: string) {
  childNodes(func: uid($nodeId))  @recurse {
    nodeId: uid
    title: Node.title
    value: Node.value
    position: Node.position
    children: ~Node.parent (orderasc: Node.position)
    referencedBy: ~Node.references
  }
}`;

export const getChildren = async (nodeId) => {
  try {
    const res = await dgraphClient
      .newTxn({ readOnly: true })
      .queryWithVars(queryChildrenByNode, {
        $nodeId: nodeId,
      });

    return res.data.childNodes[0];
  } catch (error) {
    console.log(error);
  }
};

export const queryNodesByTitle = (val) => `
query {
  exactNode(func: eq(Node.title, "${val}")) {
    id: uid
    display: Node.title
  }
  nodes(func: regexp(Node.title, /^.+${val}.*$|^.*${val}.+$/i), first: 5) {
    id: uid
    display: Node.title
  }
}`;

export const getNodesByTitle = async (query) => {
  let suggestions = [];

  // create new transaction
  const txn = dgraphClient.newTxn();

  try {
    const res = await txn.query(queryNodesByTitle(query));

    let exactPage = res.data.exactNode;

    if (exactPage.length === 0) {
      // create a new page with title
      const mu = await txn.mutate({
        setNquads: `_:page <Node.title> "${query}" .
              _:page <dgraph.type> "Node" .`,
      });

      exactPage = [
        {
          id: mu.data.uids.page,
          display: query,
        },
      ];
    }

    suggestions = exactPage.concat(res.data.nodes);

    txn.commit();
  } catch (error) {
    console.log(error);
  } finally {
    txn.discard();
  }

  return suggestions;
};

export const queryNodesByValue = (val) => `
query {
  nodes(func: regexp(Node.value, /^.*${val}.*$/i),first: 5) {
    id: uid
    display: Node.value
  }
}`;

export const getNodesByValue = async (query) => {
  try {
    const res = await dgraphClient
      .newTxn({ readOnly: true })
      .query(queryNodesByValue(query));

    return res.data.nodes;
  } catch (error) {
    console.log(error);
  }
};

export const createEmptyNode = async (
  parentId,
  position = Date.now() * 100
) => {
  let nodeId;
  const txn = dgraphClient.newTxn();

  try {
    const mu = await txn.mutate({
      setNquads: `_:node <Node.position> "${position}"^^<xs:int>	 .
      _:node <Node.parent> <${parentId}> .
      _:node <dgraph.type> "Node" .`,
      commitNow: true,
    });
    nodeId = mu.data.uids.node;
  } catch (error) {
    console.log(error);
  } finally {
    await txn.discard();
  }

  return nodeId;
};

export const deleteNode = async (node) => {
  const txn = dgraphClient.newTxn();

  try {
    await txn.mutate({
      deleteNquads: `<${node.nodeId}> * * .`,
      commitNow: true,
    });
  } catch (error) {
    console.log({ error });
  } finally {
    await txn.discard();
  }
};

export const setNodeValue = async (nodeId, value, references) => {
  const txn = dgraphClient.newTxn();

  try {
    await txn.mutate({
      setNquads: `<${nodeId}> <Node.value> "${value}" .`,
    });

    if (references) {
      await txn.mutate({
        setNquads: Array.from(references)
          .map((ref) => `<${nodeId}> <Node.references> <${ref}> .`)
          .join("\n"),
      });
    }

    txn.commit();
  } catch (error) {
    console.log({ error });
  } finally {
    await txn.discard();
  }
};

export const setNodeReferences = async (nodeId, references) => {
  const txn = dgraphClient.newTxn();

  try {
    if (references) {
      await txn.mutate({
        setNquads: Array.from(references)
          .map((ref) => `<${nodeId}> <Node.references> <${ref}> .`)
          .join("\n"),
        commitNow: true,
      });
    }
  } catch (error) {
    console.log({ error });
  } finally {
    await txn.discard();
  }
};

export const deleteNodeReferences = async (nodeId, references) => {
  const txn = dgraphClient.newTxn();

  try {
    if (references) {
      await txn.mutate({
        deleteNquads: Array.from(references)
          .map((ref) => `<${nodeId}> <Node.references> <${ref}> .`)
          .join("\n"),
        commitNow: true,
      });
    }
  } catch (error) {
    console.log({ error });
  } finally {
    await txn.discard();
  }
};

export const setNodeParent = async (nodeId, parentId) => {
  const txn = dgraphClient.newTxn();

  try {
    await txn.mutate({
      setNquads: `<${nodeId}> <Node.parent> <${parentId}> .`,
      commitNow: true,
    });
  } catch (error) {
    console.log({ error });
  } finally {
    await txn.discard();
  }
};

const FindPageByTitle = (title) => `query {
  find(func: eq(Node.title, "${title}")) {
    nodeId: uid
  }
}`;

export const upsertPage = async (title) => {
  let nodeId;

  // create new transaction
  const txn = dgraphClient.newTxn();

  try {
    const res = await txn.query(FindPageByTitle(title));
    if (res.data.find.length === 1) {
      nodeId = res.data.find[0].nodeId;
    } else {
      // create a new page with title
      const mu = await txn.mutate({
        setNquads: `_:page <Node.title> "${title}" .
        _:page <dgraph.type> "Node" .`,
      });

      // return the ID of newly created node
      nodeId = mu.data.uids.page;
    }

    await txn.commit();
  } finally {
    await txn.discard();
  }

  return nodeId;
};

export const insertPage = async (title) => {
  // create new transaction
  const txn = dgraphClient.newTxn();

  try {
    // create a new page with title
    const mu = await txn.mutate({
      setNquads: `_:page <Node.title> "${title}" .
          _:page <dgraph.type> "Node" .`,
      commitNow: true,
    });

    // return the ID of newly created node
    return mu.data.uids.page;
  } finally {
    await txn.discard();
  }
};

export const findReferences = async (nodeId) => {
  const txn = dgraphClient.newTxn();

  try {
    // find recursively the nodeIds that reference the current block
    const res = await txn.query(`
    query {
      q(func: uid(${nodeId})) @recurse {
        nodeId: uid
        referencedBy: ~Node.references
      }
    }`);
    const referencedBy = res.data.q[0].referencedBy;
    if (!referencedBy) return [];

    // for each nodeId  that references the block, find the title, the value, and nodeId of the page.
    const res2 = await txn.query(`
    query {
      ${referencedBy.map(
        (
          item,
          index
        ) => `q${index}(func: uid(${item.nodeId})) @recurse @normalize{
          nodeId: uid
          value: Node.value
          title: Node.title
          page: Node.parent
        }`
      )}}`);

    return groupBy(
      referencedBy.map((item, ind) => {
        const r = res2.data[`q${ind}`][0];

        const value = typeof r.value === 'string' ? r.value : r.value[0];
        return {
          nodeId: item.nodeId,
          pageTitle: r.title,
          value,
          pageId: r.nodeId[r.nodeId.length - 1],
        };
      }),
      "pageId"
    );
  } finally {
    await txn.discard();
  }
};

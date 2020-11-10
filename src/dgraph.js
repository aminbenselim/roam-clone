import { dgraphClient } from "./index";

export const queryChildrenByNode = `
query queryChildrenByNode($nodeId: string) {
  queryChildrenByNode(func: uid($nodeId))  @recurse {
    nodeId: uid
    title: Node.title
    value: Node.value
    position: Node.position
    children: ~Node.parent (orderasc: Node.position)
    references: Node.references
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

    return res.data.queryChildrenByNode[0];
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
        setNquads: references
          .map((ref) => `<${nodeId}> <Node.references> "${ref}"`)
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
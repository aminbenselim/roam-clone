import React from "react";
import { Block } from "./block.js";

const DEFAULT_BLOCK = {
  isActive: true,
  value: "wow"
};

export const Main = ({ active }) => {
  const [tree, setTree] = React.useState([DEFAULT_BLOCK]);

  console.log({ tree });
  return (
    <ul
      // onKeyDown={(e) => {
      //   const code = e.keyCode ? e.keyCode : e.which;

      //   //Enter keycode
      //   if (code === 13 && !e.shiftKey) {
      //     e.preventDefault();
      //     const activeBlockIndex = tree.findIndex((block) => block.isActive);
      //     // remove is active from current active block
      //     setTree((tree) => {
      //       tree.splice(activeBlockIndex, 1, {
      //         ...tree[activeBlockIndex],
      //         isActive: false
      //       });
      //       return tree.concat(DEFAULT_BLOCK);
      //     });
      //   }
      // }}
      id="main-ul"
    >
      {tree.map((block, index) => {
        const handleChange = (event, newValue, prevValue) => {
          setTree((tree) => {
            const newTree = tree;
            newTree.splice(index, 1, {
              ...tree[index],
              value: event.target.value
            });

            console.log({ newTree });
            return newTree;
          });
        };
        return (
          <li key={performance.now()}>
            <Block
              active={block.isActive}
              value={block.value}
              handleChange={handleChange}
            />
          </li>
        );
      })}
    </ul>
  );
};

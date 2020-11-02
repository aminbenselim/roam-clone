import React from "react";
import { MentionsInput, Mention } from "react-mentions";

export const Block = ({ block, handleChange, setBlockActive }) => {
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (block.isActive) {
      inputRef && inputRef.current.focus();
    }
  }, [inputRef, block.isActive]);

  return block.isActive ? (
    <MentionsInput
      value={block.value}
      onChange={handleChange}
      inputRef={inputRef}
      className={`block ${block.active ? "active" : ""}`}
    >
      <Mention
        markup="[[<a href='\'>__display__</a>]]"
        trigger="[["
        data={[
          {
            id: "page-1",
            display: "notes",
          },
          {
            id: "page-2",
            display: "dailies",
          },
          {
            id: "page-3",
            display: "projects",
          },
        ]}
        displayTransform={(id, display) => `[[${display}]]`}
        appendSpaceOnAdd
      />
      <Mention
        markup="<a class='highlighted' href='\'>__display__</a>"
        trigger="(("
        data={[
          {
            id: "id-1",
            display: "Have breakfast at 9",
          },
          {
            id: "id-2",
            display: "Roam research is amazing",
          },
        ]}
        displayTransform={(id, display) => `((${id}))`}
        appendSpaceOnAdd
      />
    </MentionsInput>
  ) : (
    <div
      className="block"
      dangerouslySetInnerHTML={{ __html: block.value ? block.value : "​" }}
      onClick={setBlockActive}
    ></div>
  );
};

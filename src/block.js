import React from "react";
import { MentionsInput, Mention } from "react-mentions";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { getNodesByTitle } from "./dgraph";
import debounce from "lodash/debounce";

const debouncedGetPages = debounce(
  (query, callback) =>
    getNodesByTitle(query)
      .then((data) => {
        console.log({ data });
        return data;
      })
      .then(callback),
  300
);

export const Block = ({ block, handleChange, setBlockActive }) => {
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (block.isActive) {
      inputRef && inputRef.current.focus();
    }
  }, [inputRef, block.isActive]);

  const { id: paramId } = useParams();

  const path = `/b/${block.nodeId || paramId}`;

  const fetchpages = (query, callback) => {
    if (!query) return;
    debouncedGetPages(query, callback);
  };

  return (
    <div
      className="block"
      style={{
        marginLeft: `${block.depth * 8}px`,
        fontSize: `${16 - block.depth * 0.2} px`,
      }}
    >
      {block.isActive ? (
        <MentionsInput
          value={block.value}
          onChange={handleChange}
          inputRef={inputRef}
          className={`block ${block.active ? "active" : ""}`}
        >
          <Mention
            markup="[[<a href='/p/__id__'>__display__</a>]]"
            trigger="[["
            data={fetchpages}
            displayTransform={(id, display) => `[[${display}]]`}
            appendSpaceOnAdd
          />
          <Mention
            markup="<a class='highlighted' href='/p/__id__'>__display__</a>"
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
        <>
          <Link className="bullet" to={path}>
            &bull;
          </Link>
          <div
            dangerouslySetInnerHTML={{
              __html: block.value ? DOMPurify.sanitize(block.value) : "​",
            }}
            onClick={setBlockActive}
            style={{ width: "100%" }}
          />
        </>
      )}
    </div>
  );
};

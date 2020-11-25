import React from "react";
import { MentionsInput, Mention } from "react-mentions";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import marked from 'marked';
import {
  getNodesByTitle,
  setNodeValue,
  upsertPage,
  setNodeReferences,
  deleteNodeReferences,
  getNodesByValue,
} from "./dgraph";
import debounce from "lodash/debounce";
import differnce from "lodash/difference";

import { usePrevious } from "./utils/usePrevious";

const debouncedGetPages = debounce(async (query, callback) => {
  if (!query || query.length < 3) return;
  const data = await getNodesByTitle(query);

  callback(data);
}, 300);

const debouncedGetBlocks = debounce(async (query, callback) => {
  if (!query || query.length < 3) return;

  const data = await getNodesByValue(query);

  callback(data);
}, 300);

const debouncedSetValue = debounce(
  (nodeId, value, references) => setNodeValue(nodeId, value, references),
  300
);

export const Block = ({ block, setBlockValueInList, setBlockActive }) => {
  const inputRef = React.useRef(null);
  const [references, setReferences] = React.useState(new Set());
  const prevRefs = usePrevious(references);

  React.useEffect(() => {
    if (block.isActive) {
      inputRef && inputRef.current.focus();
    }
  }, [inputRef, block.isActive]);

  React.useEffect(() => {
    if (prevRefs) {
      const additions = differnce(Array.from(references), Array.from(prevRefs));
      const deletions = differnce(Array.from(prevRefs), Array.from(references));

      if (additions.length > 0) {
        setNodeReferences(block.nodeId, additions);
      }
      if (deletions.length > 0) {
        deleteNodeReferences(block.nodeId, deletions);
      }
    }
  }, [references, prevRefs]);

  const { id: paramId } = useParams();

  const path = `/b/${block.nodeId || paramId}`;

  const handleChange = (event, newValue, newPlainTextValue, mentions) => {
    const value = event.target.value;
    setBlockValueInList(value);

    setReferences(new Set(mentions.map((mention) => mention.id)));
    // update node value after 0.3s of inactivity
    debouncedSetValue(block.nodeId, value);
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
          allowSpaceInQuery
        >
          <Mention
            markup="[[<a href='/b/__id__'>__display__</a>]]"
            trigger="[["
            data={debouncedGetPages}
            displayTransform={(id, display) => `[[${display}]]`}
            appendSpaceOnAdd
          />
          <Mention
            markup="#<a href='/b/__id__'>__display__</a>"
            trigger="#"
            data={debouncedGetPages}
            displayTransform={(id, display) => `#${display}`}
            appendSpaceOnAdd
          />

          <Mention
            markup="<a class='highlighted' href='/b/__id__'>__display__</a>"
            trigger="(("
            data={debouncedGetBlocks}
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
              __html: block.value ? DOMPurify.sanitize(marked(block.value)) : " ",
            }}
            onClick={setBlockActive}
            style={{ width: "100%" }}
          />
        </>
      )}
    </div>
  );
};

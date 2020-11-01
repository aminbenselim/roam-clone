import React from "react";
import { MentionsInput, Mention } from "react-mentions";

export const Block = ({ block, handleChange}) => {

  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if(block.isActive) {
      inputRef && inputRef.current.focus();
    }
  }, [inputRef, block.isActive])

  return (
    <MentionsInput
      value={block.value}
      onChange={handleChange}
      inputRef={inputRef}
      className={`block ${block.active ? "active" : ""}`}
    >
      <Mention
        markup="{{[__display__](__id__)}}"
        trigger="{{"
        data={["page 1", "page 2"]}
        renderSuggestion={(
          suggestion,
          search,
          highlightedDisplay,
          index,
          focused
        ) => (
          <div className={`user ${focused ? 'focused' : ''}`}>
            {highlightedDisplay}
          </div>
        )}
    />
    </MentionsInput>
  );
};

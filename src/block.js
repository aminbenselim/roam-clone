import React from "react";
import { MentionsInput, Mention } from "react-mentions";

export const Block = ({ active, value, handleChange }) => {
  return (
    <textarea value={value} onChange={handleChange}></textarea>
    // <MentionsInput
    //   // markup="@[__display__](__id__)"
    //   //  inputRef={(input) => input && input.focus()}
    //   className={`block ${active ? "active" : ""}`}
    // >
    //   <Mention
    //     trigger="#"
    //     // data={{}}
    //     // renderSuggestion={}
    //   />
    // </MentionsInput>
  );
};

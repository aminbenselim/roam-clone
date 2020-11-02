import React from "react";
import { format, formatDistance, formatRelative, subDays } from "date-fns";
import { useInView } from "react-intersection-observer";
import { nanoid } from "nanoid";

import { Page } from "./Page.js";

const DEFAULT_PAGE = () => ({
  id: nanoid(),
  title: format(new Date(), "MMMM do, yyyy"),
});

export const Home = () => {
  const [pages, setPages] = React.useState([DEFAULT_PAGE()]);
  const [pagesCount, setPagesCount] = React.useState(1);
  const [ref, inView] = useInView();

  React.useEffect(() => {
    if (inView) {
      setPages((pages) =>
        pages.concat({
          id: nanoid(),
          title: format(subDays(new Date(), pagesCount), "MMMM do, yyyy"),
        })
      );
      setPagesCount((pagesCount) => pagesCount + 1);
    }
  }, [inView]);

  return (
    <div>
      <h1>Daily Notes</h1>
      {pages.map((page) => (
        <Page key={page.id} title={page.title} />
      ))}
      {/* used for infinite loading of days */}
      <div ref={ref}></div>
    </div>
  );
};

import React from "react";
import { format, subDays } from "date-fns";
import { useInView } from "react-intersection-observer";
import { upsertPage } from './dgraph';
import { Page } from "./Page.js";

export const DailyNotes = () => {
  const [pages, setPages] = React.useState([]);
  const [pagesCount, setPagesCount] = React.useState(1);
  const [ref, inView] = useInView();

  React.useEffect(() => {
    const exec = async () => {
      const today = format(new Date(), "MMMM do, yyyy");
      const todaysPageId = await upsertPage(today);

      setPages((pages) => [
        {
          nodeId: todaysPageId,
          title: today,
        },
      ]);
    };

    exec();
  }, []);

  React.useEffect(() => {
    const exec = async () => {
      const date = format(subDays(new Date(), pagesCount), "MMMM do, yyyy");
      const datePageId = await upsertPage(date);

      setPages((pages) =>
        pages.concat({
          nodeId: datePageId,
          title: date,
        })
      );
      setPagesCount((pagesCount) => pagesCount + 1);
    };

    if (inView) {
      exec();
    }
  }, [inView]);

  return (
    <div className="daily-notes">
      <h1>Daily Notes</h1>
      {pages.map((page) => (
        <Page key={page.nodeId} title={page.title} id={page.nodeId} showRefs={false}/>
      ))}
      {/* used for infinite loading of days */}
      <div ref={ref}></div>
    </div>
  );
};

import React from "react";
import { format, subDays } from "date-fns";
import { useInView } from "react-intersection-observer";
import { dgraphClient } from "./index";
import { Page } from "./Page.js";

const upsertPage = async (title) => {
  let nodeId;

  // create new transaction
  const txn = dgraphClient.newTxn();

  try {
    // query to find if page with this title is available
    const query = `query {
      find(func: eq(Node.title, "${title}")) {
        nodeId: uid
      }
    }`;
    const res = await txn.query(query);
    if (res.data.find.length === 1) {
      nodeId = res.data.find[0].nodeId;
    } else {
      // create a new page with title
      const mu = await txn.mutate({
        setNquads: [`_:page <Node.title>  "${title}" .`],
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
        <Page key={page.nodeId} title={page.title} id={page.nodeId} />
      ))}
      {/* used for infinite loading of days */}
      <div ref={ref}></div>
    </div>
  );
};

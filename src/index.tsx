import { Hono } from "hono";
import { raw } from "hono/html";
import { jsxRenderer } from "hono/jsx-renderer";
import { getFeed } from "./lib/hacker-news";
import { getArticleAndSummary } from "./lib/article";
import { AppEnv } from "./types";

const app = new Hono<AppEnv>();

app.use(
  "*",
  jsxRenderer(({ children }) => {
    return (
      <html>
        <head>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
          ></link>
        </head>
        <body class="container">{children}</body>
      </html>
    );
  })
);

app.get("/", async (c) => {
  const items = await getFeed();
  return c.render(
    <>
      <h1>Hacker News Summary</h1>
      {await Promise.all(
        items?.map(async (entry) => {
          const result = await getArticleAndSummary({
            ai: c.env.AI,
            url: entry.link!,
            articlesKV: c.env.articles,
          });

          return (
            <details>
              <summary role="button" class="outline contrast">
                {entry.title}
              </summary>
              <article>
                <header>
                  <a href={entry.link} target="_blank" rel="nofollow noopener">
                    Article
                  </a>
                  {" | "}
                  <a
                    href={entry.comments}
                    target="_blank"
                    rel="nofollow noopener"
                  >
                    Comment
                  </a>
                  <div>
                    {result.article ? (
                      <div>
                        <h2>Summary</h2>
                        {result.summary ? (
                          raw(result.summary)
                        ) : (
                          <p>No summary available</p>
                        )}
                        <h2>Article Content</h2>
                        {raw(result.article)}
                      </div>
                    ) : (
                      <p>No article content available. Unable to retrieve.</p>
                    )}
                  </div>
                </header>
              </article>
            </details>
          );
        })
      )}
    </>
  );
});

app.notFound((c) => {
  return c.render(<h1>404 Not Found - {c.req.path}</h1>);
});

app.onError((error, c) => {
  c.status(500);
  return c.render(<h1> Error - {error.message}</h1>);
});

export default app;

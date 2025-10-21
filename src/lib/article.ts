import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { ArticleSummary } from "../types";
import DOMPurify from "dompurify";
import summarize from "./summarize";

export async function getArticleAndSummary(options: {
  articlesKV: KVNamespace;
  ai: Ai;
  url: string;
}) {
  let result = await options.articlesKV.get<ArticleSummary>(
    options.url,
    "json"
  );
  if (result) {
    return result;
  }
  const response = await fetch(options.url, {
    cf: {
      cacheTtl: 60 * 60 * 24,
      cacheEverything: true,
    },
  });
  const html = await response.text();
  const { document } = parseHTML(html);

  //to ensure base URL is correct for relative links
  [...document.getElementsByTagName("img")].forEach((link) => {
    link.src = new URL(link.src, options.url).href;
  });

  [...document.getElementsByTagName("a")].forEach((link) => {
    link.src = new URL(link.href, options.url).href;
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "nofollow noopener");
  });

  let reader: Readability | null = null;
  try {
    reader = new Readability(document);
  } catch (error) {
    console.error("Readability parsing error:", (error as Error).message);
  }

  const article = reader!.parse();

  result = {
    article: null,
    summary: null,
  };

  if (article?.content) {
    const { window } = parseHTML(html);
    const purify = DOMPurify(window);
    const cleanArticle = purify.sanitize(article.content);
    const cleanExcerpt = purify.sanitize(article.excerpt);

    //console.log("Generating summary for article:", options.url);
    //const summary = summarize(options.ai, url, article.content);

    result = {
      article: cleanArticle,
      summary: cleanExcerpt,
      //summary,
    };
  }

  if (!reader) {
    await options.articlesKV.put(options.url, JSON.stringify(result));
    return result;
  }

  await options.articlesKV.put(options.url, JSON.stringify(result));

  return result;
}

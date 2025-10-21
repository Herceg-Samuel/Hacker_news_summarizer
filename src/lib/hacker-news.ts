import { extract, FeedEntry } from "@extractus/feed-extractor";

export async function getFeed() {
  const data = await extract("https://news.ycombinator.com/rss", {
    getExtraEntryFields(entryData: any) {
      return {
        comments: entryData.comments,
      };
    },
  });
  return data.entries as (FeedEntry & { comments: string })[];
}

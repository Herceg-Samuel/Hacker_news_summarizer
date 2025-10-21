export default async function summarize(
  ai: Ai,
  url: string,
  content: string
): Promise<string> {
  const truncatedContent = content.split("").slice(0, 5500).join(""); // Limit to first 10,000 characters
  const doWork = async () => {
    const answer = await ai.run("@cf/mistral/mistral-7b-instruct-v0.1", {
      // stream: true,
      raw: true,
      messages: [
        {
          role: "user",
          content: `Summarize the following: ${truncatedContent}`,
        },
      ],
      lora: "cf-public-cnn-summarization",
    });

    return answer.response || "";
  };

  let maxRetries = 3;
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const result = await doWork();
      console.log("Summarization successful for:", url);
      return result;
    } catch (error) {
      console.log(
        "Error during summarization, retrying...",
        url,
        (error as Error).message
      );
      if (retries < maxRetries) retries++;
    }
  }
  console.log("Max retries reached for summarization:", url);
  return "Unable to summarize. Max retries reached.";
}

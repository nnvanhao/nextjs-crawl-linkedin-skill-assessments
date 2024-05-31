"use client";

import Head from "next/head";
import { useState } from "react";

const ScrapePage = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getFileNameFromUrl = (url: string) => {
    const segments = url.split("/");
    const fileName = segments[segments.length - 1].replace(".md", "");
    return `${fileName}-data`;
  };

  const isValidUrl = (url: string) => {
    const urlPattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$", // fragment locator
      "i"
    );
    return urlPattern.test(url) && url.endsWith(".md");
  };

  const handleScrape = async () => {
    if (!url) {
      setError("URL cannot be empty");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Invalid URL format. Make sure it ends with .md");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (response.ok) {
        const fileName = getFileNameFromUrl(url);
        // Download JSON file with the specified file name
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.json`;
        link.click();
        setSuccess("Data successfully crawled and downloaded.");
      } else {
        setError(result.message);
      }
    } catch (error: any) {
      setError(error.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <Head>
        <title>Home Page Title</title>
      </Head>
      <h1 className="text-3xl font-bold mb-6">
        Crawl Linkedin Skill Assessments
      </h1>
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL to crawl data"
        className="w-full max-w-md p-2 border border-gray-300 rounded mb-4"
      />
      <button
        onClick={handleScrape}
        disabled={loading}
        className={`w-full max-w-md p-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-700"
        }`}
      >
        {loading ? "Scraping..." : "Start Scraping"}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {success && <p className="text-green-500 mt-4">{success}</p>}
      <span className="mt-20 text-sm text-center">
        Note: eg url:
        https://github.com/Ebazhanov/linkedin-skill-assessments-quizzes/blob/main/accounting/accounting-quiz.md
      </span>
    </div>
  );
};

export default ScrapePage;

// app/api/scrape/route.ts
import { NextRequest, NextResponse } from "next/server";
import { chromium as pw } from "playwright";
import chromium from "chromium";

export async function POST(req) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ message: "URL is required" }, { status: 400 });
  }

  console.log('chromium.path', chromium.path);
  console.log('chromium', chromium);

  try {
    const browser = await pw.launch({
      executablePath: chromium.path,
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(url);

    const elements = await page.$("section > div > article");

    const questions = await page.evaluate((el) => {
      const elc = el.children;
      let res = [];
      let index = -1;

      for (const i of elc) {
        const className = i.getAttribute("class");
        const question = i
          .querySelector("h4")
          ?.innerHTML?.split(".")[1]
          ?.trim();

        if (className === "markdown-heading") {
          index += 1;
          res[index] = {
            question,
            type: "single_choice",
            description: "",
            options: [],
            answer: 0,
          };
        } else if (className?.includes("highlight")) {
          const description = i.querySelector("pre").outerText;

          res[index] = { ...res[index], description };
        } else if (className?.includes("contains-task-list")) {
          const listItems = i.querySelectorAll("li");
          let options = [];
          let isCorrectAnswerIndex = 0;
          for (let index = 0; index < listItems.length; index++) {
            const item = listItems[index];
            const isCorrectAnswer = item
              .querySelector("input")
              .getAttribute("checked");

            if (isCorrectAnswer !== null) {
              isCorrectAnswerIndex = index;
            }
            options.push({ value: item.outerText.trim() });
          }

          res[index] = {
            ...res[index],
            options,
            answer: [isCorrectAnswerIndex],
          };
        }
      }

      return res;
    }, elements);

    await elements.dispose();
    await page.close();
    await browser.close();

    const finalQuestions = questions.filter((q) => q.options.length > 1);

    return NextResponse.json({
      message: "Scraping completed successfully",
      data: finalQuestions,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error occurred during scraping", error: error?.toString() },
      { status: 500 }
    );
  }
}

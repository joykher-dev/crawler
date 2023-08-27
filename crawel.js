const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// arguments setup
const topicAddress = "./topics.json";
const domain = "recommendations";
const resultPath = "./result_jsons";

// crawel the rule
const paperSelector = "div.gs_r.gs_or.gs_scl";
const nextButtonSelector = "button.gs_btnPR";
const publishDateSelector = "div.gs_a";

const topic_query_strings = async (domain, domainTopics) => {
  // load url
  const url = domainTopics['url'];

  // load topics
  const topics = domainTopics[domain];

  return topics.map((topic) => {
    return url + domain + "+" + topic.split(' ').join('+');
  });
};

// crawl the paper 
const paper_crawler = async (publishDateRule, paperRule, page) => {

  return await page.evaluate((paperRule, publishDateRule) => {
    const paperDivs = Array.from(document.querySelectorAll(paperRule));

    const extractTitle = (innerText) => {
      return innerText.split('\n')[1];
    };

    const extractNumber = (innerText) => {
      return innerText.match(/\d+/g)[0];
    };

    return paperDivs.map((paperDiv) => ({
      title: extractTitle(paperDiv.innerText),
      url: paperDiv.querySelector("a").href,
      publishDate: extractNumber(paperDiv.querySelector(publishDateRule).innerText),
      abstract: paperDiv.querySelector("div.gs_rs").innerText.replaceAll('\n', " "),
    }));

  }, paperRule, publishDateRule).catch((error) => {
    // console.log(error);
  });
};

const scholar = async (url, maxPage) => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "/usr/bin/chromium-browser"
  });

  const page = await browser.newPage({
    viewport: { width: 2060, height: 1080 },
  });

  await page.goto(url, { waitUntil: "load" });

  let resultArray = await paper_crawler(publishDateSelector, paperSelector, page);

  for (let pageIndex = 2; pageIndex < maxPage + 1; pageIndex++) {
    let curPageArray = await paper_crawler(publishDateSelector, paperSelector, page);
    resultArray = resultArray.concat(curPageArray);

    await page.evaluate((nextButtonSelector) => {
      document.querySelector(nextButtonSelector).click();
    }, nextButtonSelector);

    await page.waitForNavigation({ waitUntil: "load" });
  }

  await browser.close();

  return resultArray;
};

const generate_result_name = async (domain, url) => {
  return url.split('=')[1].replaceAll('+', '_') + ".json";
};

(async () => {
  const domainTopics = require(topicAddress);

  const maxPage = domainTopics['maxPage'];
  const queryUrls = await topic_query_strings(domain, domainTopics);
  console.log(queryUrls);

  // handle queryUrls in parallel
  Promise.all(queryUrls.map(async (queryUrl) => {
    const result = await scholar(queryUrl, maxPage);
    return [queryUrl, result];
  })).then(
    async (results) => {
      // save the result
      results.map(async (result) => {
        const resultAddress = await generate_result_name(domain, result[0]);
        fs.writeFileSync(path.join(resultPath, resultAddress), JSON.stringify(result[1], null, 4));
      });
    }
  );

}
)();

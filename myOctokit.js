"use strict";

const { Octokit } = require("@octokit/rest");

async function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

function createOctokit() {
  const authes = [
    "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",
    "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",
    //"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",
    //"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",
    //"ee9b99ef8a34bfd687db8a77aa6949411d981614",
    //"f11e0909b421da14964fdcb91b3781de4bed252e",
  ];

  var rand = Math.random();
  rand *= authes.length;
  return new Octokit({
      auth: authes[Math.floor(rand)],
      request: {
          timeout: 20000,
      }
  });
}

async function waitOctokit(octokit) {
  try {
    console.info("waitOctokit.....");
    var rate_limit = await octokit.rest.rateLimit.get();
    console.info(rate_limit.data);
    if (rate_limit.data.rate.remaining > 0) {
      return;
    }
    var reset_time = rate_limit.data.rate.reset;
    var sleep_time = ((new Date(reset_time*1000)) - (new Date()));
    console.info("exceed rate limit... sleep: " + sleep_time + " ms");
    await sleep(sleep_time);
  } catch (e) {
    await sleep(10*1000);
  }
  return;
}

module.exports.createOctokit = createOctokit;
module.exports.waitOctokit = waitOctokit;
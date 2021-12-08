const myOctokit = require("./myOctokit.js");

async function getStarHistory(owner_name, repo_name) {
  var ret = undefined;
  const per_page = 100;
  var page_index = 1;
  var star_history = new Map();
  while (true) {
    try {
      var octokit = myOctokit.createOctokit();
      ret = await octokit.rest.activity.listStargazersForRepo({
        headers : {accept : "application/vnd.github.v3.star+json"},
        owner: owner_name,
        repo: repo_name,
        per_page: per_page,
        page: page_index,
      });
      if (ret.status == 403 || ret.status == 500) {
        await myOctokit.waitOctokit(octokit);
        continue;
      } else if (ret.status == 204) {
        return undefined;
      } else if (ret.status != 200) {
        throw new Error(
          `[getStarHistory]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
        );
      }
    } catch (e) {
      //console.warn(e);
      await myOctokit.waitOctokit(octokit);
      continue;
    }

    var stargazers = ret.data;
    for (let stargazer of stargazers) {
      var starred_date = stargazer.starred_at.slice(0,7);
      if (!star_history.has(starred_date)) {
          star_history.set(starred_date, 1);
      } else {
          var raw = star_history.get(starred_date);
          star_history.set(starred_date, raw+1);
      }
    }

    if (stargazers.length < per_page) {
      break;
    } 

    page_index += 1;
  } // end while

  var acc_count = 0;
  var acc_star_history = new Map();
  star_history.forEach((value, key) => {
    acc_count += value;
    acc_star_history.set(key, acc_count);
  });

  return [star_history, acc_star_history];
}

module.exports.getStarHistory = getStarHistory;
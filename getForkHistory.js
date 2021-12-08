
const myOctokit = require("./myOctokit.js");

async function getForkHistory(owner_name, repo_name) {
  var ret = undefined;
  const per_page = 100;
  var page_index = 1;
  var fork_history = new Map();
  while (true) {
    try {
      var octokit = myOctokit.createOctokit();
      ret = await octokit.rest.repos.listForks({
        owner: owner_name,
        repo: repo_name,
        sort: "oldest",
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
          `[getForkHistory]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
        );
      }
    } catch (e) {
      //console.warn(e);
      await myOctokit.waitOctokit(octokit);
      continue;
    }

    var forks = ret.data;
    for (let fork of forks) {
      var created_date = fork.created_at.slice(0,7);
      if (!fork_history.has(created_date)) {
          fork_history.set(created_date, 1);
      } else {
          var raw = fork_history.get(created_date);
          fork_history.set(created_date, raw+1);
      }
    }

    if (forks.length < per_page) {
      break;
    }

    page_index += 1;
  } // end while

  var acc_count = 0;
  var acc_fork_history = new Map();
  fork_history.forEach((value, key) => {
    acc_count += value;
    acc_fork_history.set(key, acc_count);
  });

  return [fork_history, acc_fork_history];
}

module.exports.getForkHistory = getForkHistory;
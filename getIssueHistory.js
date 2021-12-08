
const myOctokit = require("./myOctokit.js");

async function getIssueHistory(owner_name, repo_name) {
  const per_page = 100;
  var page_index = 1;
  var issue_count = 0;
  var open_issue_count = 0;
  var pull_request_count = 0;
  var open_pull_request_count = 0;
  var issue_history = new Map();
  var pull_request_history = new Map();
  var ret = undefined;
  while(true) {
    try {
      var octokit = myOctokit.createOctokit();
      ret = await octokit.rest.issues.listForRepo({
        owner : owner_name,
        repo : repo_name,
        state: "all",
        pulls: true,
        direction: "asc",
        sort: "created",
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
          `[getIssueHistory]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
        );
      }
    } catch (e) {
      //console.warn(e);
      await myOctokit.waitOctokit(octokit);
      continue;
    }

    var issues = ret.data;
    for (let issue of issues) {
      var created_date = issue.created_at.slice(0,7);
      if (issue.pull_request != null) {
        pull_request_count += 1;
        if (issue.state == "open") {
            open_pull_request_count += 1;
        }

        if (!pull_request_history.has(created_date)) {
            pull_request_history.set(created_date, 1);
        } else {
            pull_request_history.set(created_date, pull_request_history.get(created_date) + 1);
        }
      } else {
        issue_count += 1;
        if (issue.state == "open") {
            open_issue_count += 1;
        }

        if (!issue_history.has(created_date)) {
            issue_history.set(created_date, 1);
        } else {
            issue_history.set(created_date, issue_history.get(created_date) + 1);
        }            
      }
    }

    if (issues.length < per_page) {
        break;
    }
    page_index += 1;    
  }

  var acc_count = 0;
  var acc_issue_history = new Map();
  issue_history.forEach((value, key) => {
      acc_count += value;
      acc_issue_history.set(key, acc_count);
  });
  acc_count = 0;
  var acc_pull_request_history = new Map();
  pull_request_history.forEach((value, key) => {
      acc_count += value;
      acc_pull_request_history.set(key, acc_count);
  });

  return [issue_count, open_issue_count, pull_request_count, open_pull_request_count,
    issue_history, acc_issue_history, pull_request_history, acc_pull_request_history];
}

module.exports.getIssueHistory = getIssueHistory;
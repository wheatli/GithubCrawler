const myOctokit = require("./myOctokit.js");

async function getCommitHistory(owner_name, repo_name) {
  var ret = undefined;
  while (true) {
    try {
      var octokit = myOctokit.createOctokit();
      ret = await octokit.rest.repos.getCommitActivityStats({
        owner : owner_name,
        repo : repo_name
      });
      if (ret.status == 403 || ret.status == 500) {
        await myOctokit.waitOctokit(octokit);
        continue;
      } else if (ret.status == 204) {
        return undefined;
      } else if (ret.status != 200) {
        throw new Error(
          `[getCommitHistory]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
        );
      }
      break;
    } catch (e) {
      //console.warn(e);
      await myOctokit.waitOctokit(octokit);
      continue;
    }
  }
  var commits = ret.data;
  var commit_history = new Map();
  var acc_commit_history = new Map();
  var acc_count = 0;
  for (let commit of commits) {
    var month = new Date(commit.week*1000).toISOString().slice(0, 7);
    if (!commit_history.has(month)) {
        commit_history.set(month, commit.total);
    } else {
        commit_history.set(month, commit_history.get(month) + commit.total);
    }
    acc_count += commit.total;
    acc_commit_history.set(month, acc_count);
  }

  /*var repo_info = `${owner_name}/${repo_name} contains commit(s):\n`;
  for (let [date, num] of commit_history) {
    repo_info += "New: " + date + ":" + num + "\n";
    repo_info += "Acc: " + date + ":" + acc_commit_history.get(date) + "\n";
  }
  console.info(repo_info);*/

  return [commit_history, acc_commit_history];
}

module.exports.getCommitHistory = getCommitHistory;
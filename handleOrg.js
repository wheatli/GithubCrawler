
const getRepos = require("./getRepos.js");
const getCommitHistory = require("./getCommitHistory.js");
const getForkHistory = require("./getForkHistory.js");
const getStarHistory = require("./getStarHistory.js");
const getIssueHistory = require("./getIssueHistory.js");
const getContributors = require("./getContributors.js");

async function handleRepo(repo) {
  var repo_data = new Map();
  // basic info
  repo_data.set("watch", repo.watchers_count);
  repo_data.set("star", repo.stargazers_count);
  repo_data.set("fork", repo.forks_count);
  repo_data.set("open_issue_pr", repo.open_issues_count);

  var ret = await getCommitHistory.getCommitHistory(repo.owner.login, repo.name);
  if (ret != undefined) {
    repo_data.set("commit_history", ret[0]);
    repo_data.set("acc_commit_history", ret[1]);
  }

  ret = await getForkHistory.getForkHistory(repo.owner.login, repo.name);
  if (ret != undefined) {
    repo_data.set("fork_history", ret[0]);
    repo_data.set("acc_fork_history", ret[1]);
  }

  ret = await getStarHistory.getStarHistory(repo.owner.login, repo.name);
  if (ret != undefined) {
    repo_data.set("star_history", ret[0]);
    repo_data.set("acc_star_history", ret[1]);
  }

  ret = await getIssueHistory.getIssueHistory(repo.owner.login, repo.name);
  if (ret != undefined) {
    repo_data.set("issue", ret[0]);
    repo_data.set("open_issue", ret[1]);
    repo_data.set("pull_request", ret[2]);
    repo_data.set("open_pull_request", ret[3]);
    repo_data.set("issue_history", ret[4]);
    repo_data.set("acc_issue_history", ret[5]);
    repo_data.set("pull_request_history", ret[6]);
    repo_data.set("acc_pull_request_history", ret[7]);
  }

  ret = await getContributors.getContributors(repo.owner.login, repo.name);
  if (ret != undefined) {
    repo_data.set("contributors_count", ret.length);
    repo_data.set("contributors_list", ret);
  }

  return repo_data;
}

async function handleOrg(org_name) {
  console.info("handleOrg: " + org_name);
  var promises = [];
  var org_data = new Map();
  var repo_list = await getRepos.getRepos(org_name);
  if (repo_list != undefined) {
    for (let repo of repo_list) {
      promises.push(
        handleRepo(repo).then((repo_data) => {
          org_data.set(repo.name, repo_data);
        })
      );
    }
  }

  await Promise.all(promises);

  // dedup contributors
  var dedup_set = new Set();
  for (let [_, repo_data] of org_data.entries()) {
    if (repo_data.has("contributors_list")) {
      for (let contributor of repo_data.get("contributors_list")) {
        dedup_set.add(contributor);
      }
    }
  }
  var dedup_list = Array.from(dedup_set);

  org_data.set("all_repo_dedup", new Map());
  org_data.get("all_repo_dedup").set("contributors_count", dedup_list.length);
  org_data.get("all_repo_dedup").set("contributors_list", dedup_list);

  return org_data;
}

module.exports.handleOrg = handleOrg;
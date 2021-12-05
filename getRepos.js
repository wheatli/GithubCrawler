var myOctokit = require("./myOctokit.js");

const weRepos = ["WeIdentity", "WeEvent", "WeBASE"];
function checkRepo(repo) {
  // omits forked repo
  if (repo.fork) {
    console.warn(`omit forked repo: ${repo.name}`);
    return false;
  }

  if (repo.private) {
    console.warn(`omit private repo: ${repo.name}`);
    return false;    
  }

  if (repo.name == "netty-tcnative-sm") {
    console.warn(`omit repo: ${repo.name}`);
    return false;
  }

  if (repo.owner.login == "WeBankFinTech") {
    // Only contains repos in `weRepos`
    for (let weRepo of weRepos) {
      if (repo.name.startsWith(weRepo)) {
        return true;
      }
    }

    console.warn(`omit not-blockchain repo: ${repo.name}`);
    return false;
  }

  return true;
}

async function getRepos(org_name) {
  const per_page = 50;
  var page_index = 1;
  var ret = undefined;
  var repo_list = [];
  while (true) {
    try {
      var octokit = myOctokit.createOctokit();
      ret = await octokit.repos.listForOrg({
        org: org_name,
        type: "all",
        per_page: per_page,
        page: page_index,
      });
      if (ret.status == 403 || ret.status == 500) {
        await waitOctokit(octokit);
        continue;
      } else if (ret.status == 204) {
        return undefined;
      } else if (ret.status != 200) {
        throw new Error(
          `[getRepos]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
        );
      }
    } catch (e) {
      console.warn(e);
      return undefined;
    }

    for (var repo of ret.data) {
      if (checkRepo(repo)) {
        repo_list.push(repo);
      }
    }

    if (ret.data.length < per_page) {
      break;
    }

    page_index += 1;
  }

  return repo_list;
}

module.exports.getRepos = getRepos;
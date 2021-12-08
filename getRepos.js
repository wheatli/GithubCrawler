var myOctokit = require("./myOctokit.js");

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
        await myOctokit.waitOctokit(octokit);
        continue;
      } else if (ret.status == 204) {
        return undefined;
      } else if (ret.status != 200) {
        throw new Error(
          `[getRepos]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
        );
      }
    } catch (e) {
      //console.warn(e);
      await myOctokit.waitOctokit(octokit);
      continue;
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
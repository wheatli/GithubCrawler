
const myOctokit = require("./myOctokit.js");

async function getContributors(owner_name, repo_name) {
  const per_page = 100;
  var page_index = 1;
  var contributors = [];
  var ret = undefined;
  while (true) {
    try {
      var octokit = myOctokit.createOctokit();
      ret = await octokit.repos.listContributors({
        owner: owner_name,
        repo: repo_name,
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
          `[getContributors]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
        );
      }
    } catch (e) {
      console.warn(e);
      return undefined;
    }

    var contributor_list = ret.data;
    for (let contributor of contributor_list) {
      if (contributor.login.endsWith("[bot]")) {
          continue;
      }
      contributors.push(contributor.login);
    }

    if (contributor_list.length < per_page) {
      break;
    }        

    page_index += 1;
  } // end while

  return contributors;
}

module.exports.getContributors  = getContributors;
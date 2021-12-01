"use strict";

const { Octokit } = require("@octokit/rest");
const Excel = require("exceljs");

const orgs = [
    "FISCO-BCOS",
    "bcosorg",
    "WeBankBlockchain",
    "WeBankFinTech",
    "hyperledger",
    "xuperchain",
];

const weRepos = ["WeIdentity", "WeEvent", "WeBASE"];

var data = new Map();

async function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
}

function createOctokit() {
    const authes = [
        "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",
        "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",
    ];
    var rand = Math.random();
    rand *= authes.length;
    return new Octokit({
        auth: authes[Math.floor(rand)],
        request: {
            timeout: 20000,
        },
    });
}

async function pushData(org, repo, feature, value) {
    if (!data.has(org)) {
        data.set(org, new Map());
    } 
    if (!data.get(org).has(repo)) {
        data.get(org).set(repo, new Map());
    }
    
    data.get(org).get(repo).set(feature, value);
}

async function printData() {
    for (let [org, org_map] of data.entries()) {
        for (let [repo, rep_map] of org_map.entries()) {
            for(let [feature, value] of rep_map.entries()) {
                console.info(`${org} ${repo} ${feature} ${value}`);
            }
        }
    }

    let fabric_data = await mineFabricData();
    for (let [feature, value] of fabric_data.entries()) {
        console.info(`CombinedFabricData: ${feature} ${value}`);
    }

    let webank_data = await mineWeBankData();
    for (let [feature, value] of webank_data.entries()) {
        console.info(`CombinedWeBankData: ${feature} ${value}`);
    }
}

async function mineFabricData() {
    var fabric_data = new Map();
    var dedup_contributors = new Set();
    if (!data.has("hyperledger")) {
        return fabric_data;
    }
    for (let [repo, rep_map] of data.get("hyperledger").entries()) {
        if (!repo.startsWith("fabric")) {
            continue;
        }
        for(let [feature, value] of rep_map.entries()) {
            if (feature == "contributors_list") {
                for (let contributor of value) {
                    dedup_contributors.add(contributor);
                }
            } else if (!fabric_data.has(feature)) {
                fabric_data.set(feature, value);
            } else {
                var raw_value = fabric_data.get(feature);
                fabric_data.set(feature, raw_value+value);
            }
        }
    }

    fabric_data.set("contributors_count", dedup_contributors.size);
    var dedup_list = [];
    for (let contributor of dedup_contributors) {
        dedup_list.push(contributor);
    }
    fabric_data.set("contributors_list", dedup_list);

    return fabric_data;
}

async function mineWeBankData() {
    var webank_data = new Map();
    var dedup_contributors = new Set();
    for (let [org, org_map] of data.entries()) {
        if (!(org == "bcosorg" || org == "FISCO-BCOS" || org == "WeBankFinTech" || org == "WeBankBlockchain")) {
            continue;
        }
        for (let [repo, repo_map] of org_map.entries()) {
            for (let [feature, value] of repo_map.entries()) {
                if (feature == "contributors_list") {
                    for (let contributor of value) {
                        dedup_contributors.add(contributor);
                    }
                } else if (!webank_data.has(feature)) {
                    webank_data.set(feature, value);
                } else {
                    var raw_value = webank_data.get(feature);
                    webank_data.set(feature, raw_value+value);
                }
            }
        }
    }

    webank_data.set("contributors_count", dedup_contributors.size);
    var dedup_list = [];
    for (let contributor of dedup_contributors) {
        dedup_list.push(contributor);
    }
    webank_data.set("contributors_list", dedup_list);

    return webank_data;
}

async function exportToExcel(filename) {
    let workbook = new Excel.Workbook();
    const options = {
        dateFormat: 'DD/MM/YYYY HH:mm:ss',
        dateUTC: true, // use utc when rendering dates
      };
    let worksheet = workbook.addWorksheet("data");
    let row_index = 1;
    let row = undefined;
    worksheet.columns = [
        {header: 'org_name', key: 'org_name'},
        {header: 'repo_name', key: 'repo_name'},
        {header: 'watch', key: 'watch'},
        {header: 'star', key: 'star'},
        {header: 'fork', key: 'fork'},
        {header: 'open_issue_pr', key: 'open_issue_pr'},
        {header: 'commit_add', key: 'commit_add'},
        {header: 'commit_del', key: 'commit_del'},
        {header: 'commit_total', key: 'commit_total'},
        {header: 'issue', key: 'issue'},
        {header: 'open_issue', key: 'open_issue'},
        {header: 'pull_request', key: 'pull_request'},
        {header: 'open_pull_request', key: 'open_pull_request'},
        {header: 'contributors_count', key: 'contributors_count'},
        {header: 'contributors_list', key: 'contributors_list'}
      ];
    worksheet.columns.forEach(column => {
        column.width = column.header.length < 12 ? 12 : column.header.length
    });
    worksheet.getRow(row_index).font = {bold: true};
    
    // write raw data
    for (let [org, org_map] of data.entries()) {
        for (let [repo, rep_map] of org_map.entries()) {
            row_index += 1;
            row = worksheet.getRow(row_index);
            row.getCell("org_name").value = org;
            row.getCell("repo_name").value = repo;
            for (let [feature, value] of rep_map.entries()) {
                row.getCell(feature).value = value;
            }
        }
    }

    // write mined data
    let fabric_data = await mineFabricData();
    row_index += 1;
    row = worksheet.getRow(row_index);
    row.getCell("org_name").value = "combined_fabric";
    row.getCell("repo_name").value = "combined_fabric";
    for (let [feature, value] of fabric_data.entries()) {
        row.getCell(feature).value = value;
    }
    
    let webank_data = await mineWeBankData();
    row_index += 1;
    row = worksheet.getRow(row_index);
    row.getCell("org_name").value = "combined_webank";
    row.getCell("repo_name").value = "combined_webank";
    for (let [feature, value] of webank_data.entries()) {
        row.getCell(feature).value = value;
    }

    await workbook.csv.writeFile(filename, options);
}

function checkRepo(repo) {
    // omits forked repo
    if (repo.fork && repo.name != "FISCO-BCOS") {
        console.warn(`omit repo: ${repo.name}`);
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

        console.warn(`omit repo: ${repo.name}`);
        return false;
    }

    return true;
}

function retryCheck(ret) {
    if (ret == undefined) {
        return true;
    }
    if (ret.status == 403 || ret.status == 500) {
        return true;
    }
    return false;
}

async function getBasicInfoOfRepo(owner_name, repo_name) {
    var ret = undefined;
    while (true) {
        try {
            var octokit = createOctokit();
            ret = await octokit.rest.repos.get({
                owner : owner_name,
                repo : repo_name
              });
            if (ret.status != 200) {
                throw new Error(
                    `[getBasicInfoOfRepo]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
                );
            }
            break;
        } catch(e) {
            if (retryCheck(ret)) {
                await sleep(1000);
                continue;
            } else {
                console.warn(e);
                return;
            }
        }
    }

    var stat = ret.data;
    await pushData(owner_name, repo_name, "watch", stat.subscribers_count);
    await pushData(owner_name, repo_name, "star", stat.stargazers_count);
    await pushData(owner_name, repo_name, "fork", stat.forks_count);
    await pushData(owner_name, repo_name, "open_issue_pr", stat.open_issues_count);
    
    /*
    var repo_info = `${owner_name}/${repo_name} stat(watch,star,fork,open_issue) :`;
    repo_info += stat.subscribers_count + " ";
    repo_info += stat.stargazers_count + " ";
    repo_info += stat.forks_count + " ";
    repo_info += stat.open_issues_count + " ";
    console.info(repo_info);*/
    return;
}

async function getCommitOfRepo(owner_name, repo_name) {
    var ret = undefined;
    while (true) {
        try {
            var octokit = createOctokit();
            ret = await octokit.rest.repos.getCodeFrequencyStats({
                owner : owner_name,
                repo : repo_name
              });
            if (ret.status != 200) {
                throw new Error(
                    `[getCommitOfRepo]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
                );
            }
            break;
        } catch (e) {
            if (retryCheck(ret)) {
                await sleep(1000);
                continue;
            } else {
                console.warn(e);
                return;
            }
        }
    }

    var commits = ret.data;
    var total_add_count = 0;
    var total_del_count = 0;
    for (let commit of commits) {
        total_add_count += commit[1];
        total_del_count += commit[2];
    }

    await pushData(owner_name, repo_name, "commit_add", total_add_count);
    await pushData(owner_name, repo_name, "commit_del", total_del_count);
    await pushData(owner_name, repo_name, "commit_total", total_add_count + total_del_count);

    /*var repo_info = `${owner_name}/${repo_name} commit(add, del, total) :`
    repo_info += total_add_count + " ";
    repo_info += total_del_count + " ";
    var total_count = total_add_count + total_del_count;
    repo_info += total_count + " ";
    console.info(repo_info);*/
    return;
}

async function getIssueOfRepo(owner_name, repo_name) {
    const per_page = 100;
    var page_index = 1;
    var pull_request_count = 0;
    var issue_count = 0;
    var open_pull_request_count = 0;
    var open_issue_count = 0;
    var ret = [];
    while(true) {
        try {
            var octokit = createOctokit();
            ret = await octokit.rest.issues.listForRepo({
                owner : owner_name,
                repo : repo_name,
                state: "all",
                pulls: true,
                per_page: per_page,
                page: page_index,
              });
            
            if (ret.status != 200) {
                throw new Error(
                    `[getIssueOfRepo]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
                );
            }
        } catch(e) {
            if (retryCheck(ret)) {
                await sleep(1000);
                continue;
            } else {
                console.warn(e);
                return;
            }
        }

        var issues = ret.data;
        for (let issue of issues) {
            if (issue.pull_request != null) {
                pull_request_count += 1;
                if (issue.state == "open") {
                    open_pull_request_count += 1;
                }
            } else {
                issue_count += 1;
                if (issue.state == "open") {
                    open_issue_count += 1;
                }
            }
        }

        if (issues.length < per_page) {
            break;
        }
        page_index += 1;
        await sleep(1000);
    }

    await pushData(owner_name, repo_name, "issue", issue_count);
    await pushData(owner_name, repo_name, "open_issue", open_issue_count);
    await pushData(owner_name, repo_name, "pull_request", pull_request_count);
    await pushData(owner_name, repo_name, "open_pull_request", open_pull_request_count);

    /*var repo_info = `${owner_name}/${repo_name} issue(issue, open_issue, pr, open_pr) :`
    repo_info += issue_count + " ";
    repo_info += open_issue_count + " ";
    repo_info += pull_request_count + " ";
    repo_info += open_pull_request_count + " ";
    console.info(repo_info);*/
    return;
}

async function getContributorOfRepo(owner_name, repo_name) {
    const per_page = 100;
    var page_index = 1;
    var contributors = [];
    while (true) {
        var ret = undefined;
        try {
            var octokit = createOctokit();
            ret = await octokit.repos.listContributors({
                owner: owner_name,
                repo: repo_name,
                per_page: per_page,
                page: page_index,
            });

            if (ret.status != 200) {
                throw new Error(
                    `[getContributorOfRepo]${owner_name}/${repo_name} Invalid response status: ${ret.status}`
                );
            }
        } catch (e) {
            if (retryCheck(ret)) {
                await sleep(1000);
                continue;
            } else {
                console.warn(e);
                return [];
            }
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
        await sleep(100);
    }

    await pushData(owner_name, repo_name, "contributors_count", contributors.length);
    await pushData(owner_name, repo_name, "contributors_list", contributors);

    /*var repo_info = `${owner_name}/${repo_name} contains ${contributors.length} contributor(s):`;
    for (let contributor of contributors) {
        repo_info += " " + contributor;
    }
    console.info(repo_info);*/
    return contributors;
}

async function getStatOfOrg(org_name) {
    const per_page = 50;
    var page_index = 1;
    // Improve performance via creating promises of getting contributors of repos.
    // *DO NOT* use `await` here.
    var promises = [];
    var ret = undefined;
    var dedup_contributors = new Set();
    while (true) {
        try {
            var octokit = createOctokit();
            ret = await octokit.repos.listForOrg({
                org: org_name,
                type: "all",
                per_page: per_page,
                page: page_index,
            });
            if (ret.status != 200) {
                throw new Error(
                    `[getStatOfOrg]${org_name} Invalid response status: ${ret.status}`
                );
            }
        } catch(e) {
            if (retryCheck(ret)) {
                await sleep(1000);
                continue;
            } else {
                console.warn(e);
                return;
            }
        }
   
        var repos = ret.data;
        for (var repo of repos) {
            if (checkRepo(repo)) {
                promises.push(
                    getBasicInfoOfRepo(org_name, repo.name)
                );
                promises.push(
                    getCommitOfRepo(org_name, repo.name)
                );
                promises.push(
                    getIssueOfRepo(org_name, repo.name)
                );
                promises.push(
                    getContributorOfRepo(org_name, repo.name).then(
                        (contributors) => {
                            for (let contributor of contributors) {
                                dedup_contributors.add(contributor);
                            }
                        }
                    )
                );
            }
        }

        if (repos.length < per_page) {
            break;
        }

        page_index += 1;
    }
    await Promise.all(promises);

    await pushData(org_name, "all_repo_dedup", "contributors_count", dedup_contributors.size);
    var dedup_list = [];
    for (let contributor of dedup_contributors) {
        dedup_list.push(contributor);
    }
    await pushData(org_name, "all_repo_dedup", "contributors_list", dedup_list);

    /*var org_info = `${org_name} contains ${dedup_contributors.size} contributor(s):`;
    for (let contributor of dedup_contributors) {
        org_info += " " + contributor;
    }
    console.info(org_info);*/
    return;
}

async function startCrawler() {
    var promises = [];
    for (let org of orgs) {
        promises.push(
            getStatOfOrg(org)
        );
    }
    await Promise.all(promises);

    //await printData();
    await exportToExcel("test.csv");
}

async function testExcel() {
    data.set("FISCO-BCOS", new Map());
    data.get("FISCO-BCOS").set("java-sdk", new Map());
    data.get("FISCO-BCOS").get("java-sdk").set("watch", 100);
    data.get("FISCO-BCOS").get("java-sdk").set("star", 200);
    data.get("FISCO-BCOS").get("java-sdk").set("fork", 300);
    data.get("FISCO-BCOS").get("java-sdk").set("open_issue_pr", 400);
    data.get("FISCO-BCOS").get("java-sdk").set("commit_add", 500);
    data.get("FISCO-BCOS").get("java-sdk").set("commit_del", 600);
    data.get("FISCO-BCOS").get("java-sdk").set("commit_total", 700);
    data.get("FISCO-BCOS").get("java-sdk").set("issue", 800);
    data.get("FISCO-BCOS").get("java-sdk").set("open_issue", 900);
    data.get("FISCO-BCOS").get("java-sdk").set("pull_request", 1000);
    data.get("FISCO-BCOS").get("java-sdk").set("open_pull_request", 1100);
    data.get("FISCO-BCOS").get("java-sdk").set("contributors_count", 1200);
    data.get("FISCO-BCOS").get("java-sdk").set("contributors_list", ["a","b","c"]);

    await exportToExcel("test.csv");
}

startCrawler().then(() => {
    console.info("end");
    process.exit();
});


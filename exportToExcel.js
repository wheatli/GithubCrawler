
const Excel = require("exceljs");
const chartistSvg = require('svg-chartist');
const fs = require('fs');

async function exportToExcel(filename, output_data) {
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
    {header: 'issue', key: 'issue'},
    {header: 'open_issue', key: 'open_issue'},
    {header: 'pull_request', key: 'pull_request'},
    {header: 'open_pull_request', key: 'open_pull_request'},
    {header: 'contributors_count', key: 'contributors_count'},
    {header: 'contributors_list', key: 'contributors_list'},
    {header: 'commit_history', key: 'commit_history'},
    {header: 'acc_commit_history', key: 'acc_commit_history'},
    {header: 'issue_history', key: 'issue_history'},
    {header: 'acc_issue_history', key: 'acc_issue_history'},
    {header: 'pull_request_history', key: 'pull_request_history'},
    {header: 'acc_pull_request_history', key: 'acc_pull_request_history'},
    {header: 'star_history', key: 'star_history'},
    {header: 'acc_star_history', key: 'acc_star_history'},
    {header: 'fork_history', key: 'fork_history'},
    {header: 'acc_fork_history', key: 'acc_fork_history'}
    ];
  worksheet.columns.forEach(column => {
    column.width = column.header.length < 12 ? 12 : column.header.length
  });
  worksheet.getRow(row_index).font = {bold: true};
  
  // write raw data
  for (let [org, org_map] of output_data.entries()) {
    for (let [repo, rep_map] of org_map.entries()) {
      row_index += 1;
      row = worksheet.getRow(row_index);
      row.getCell("org_name").value = org;
      row.getCell("repo_name").value = repo;
      for (let [feature, value] of rep_map.entries()) {
        if (feature.endsWith("_history")) {
          row.getCell(feature).value = Array.from(value);
          if (repo == "all_repo_data" || repo == "fabric" || repo == "FISCO-BCOS" || repo == "xuperchain") {
            await exportHistorySvg(org, repo, feature, value);
          }
        } else {
          row.getCell(feature).value = value;
        }
      }
    }
  }
  
  await workbook.csv.writeFile(filename, options);
  return;
}

async function exportHistorySvg(org, repo, feature, map) {
  var series = [];
  series.push(Array.from(map.values()));
  const data = {
    labels : Array.from(map.keys()),
    series : series
  };

  const options = {
    fullWidth: true,
    chartPadding: {
      right: 40
    }
  }
  
  const opts = {
      options: options
  }

  let filename = "./svg/"+org+"#"+repo+"#"+feature+".html";
  var html = await chartistSvg('line', data, opts);
  fs.writeFileSync(filename, html);

  return;
}

module.exports.exportToExcel = exportToExcel;

const handleOrg = require("./handleOrg.js");
const exportToExcel = require("./exportToExcel.js");


const orgs = [
    "FISCO-BCOS",
    "bcosorg",
    "WeBankBlockchain",
    "WeBankFinTech",
    "hyperledger",
    "xuperchain",
];

var output_data = new Map();

async function mergeHistoryMap(map1, map2) {
    var map = new Map();
    for (let [key, value] of map1) {
        if (!map2.has(key)) {
            map.set(key, value);
        }else {
            map.set(key, value+map2.get(key));
        }
    }
    for (let [key, value] of map2) {
        if (!map1.has(key)) {
            map.set(key, value);
        }
    }
    return new Map([...map].sort());
}

async function mineFabricData(data) {
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
                if (feature.endsWith("_history")) {
                    var new_value = await mergeHistoryMap(raw_value, value);
                    fabric_data.set(feature, new_value);
                } else {
                    fabric_data.set(feature, raw_value+value);
                }
            }
        }
    }

    var dedup_list = Array.from(dedup_contributors);
    fabric_data.set("contributors_count", dedup_list.length);
    fabric_data.set("contributors_list", dedup_list);

    return fabric_data;
}

async function mineWeBankData(data) {
    var webank_data = new Map();
    var dedup_contributors = new Set();
    for (let [org, org_map] of data.entries()) {
        if (!(org == "bcosorg" || org == "FISCO-BCOS" || org == "WeBankFinTech" || org == "WeBankBlockchain")) {
            continue;
        }
        for (let [_, repo_map] of org_map.entries()) {
            for (let [feature, value] of repo_map.entries()) {
                if (feature == "contributors_list") {
                    for (let contributor of value) {
                        dedup_contributors.add(contributor);
                    }
                } else if (!webank_data.has(feature)) {
                    webank_data.set(feature, value);
                } else {
                    var raw_value = webank_data.get(feature);
                    if (feature.endsWith("_history")) {
                        var new_value = await mergeHistoryMap(raw_value, value);
                        webank_data.set(feature, new_value);
                    } else {
                        webank_data.set(feature, raw_value+value);
                    }
                }
            }
        }
    }

    var dedup_list = Array.from(dedup_contributors);
    webank_data.set("contributors_count", dedup_list.length);
    webank_data.set("contributors_list", dedup_list);

    return webank_data;
}

async function startCrawler() {
    for (let org of orgs) {
        var org_data = await handleOrg.handleOrg(org);
        output_data.set(org, org_data);
    }

    var fabric_data = await mineFabricData(output_data);
    var webank_data = await mineWeBankData(output_data);
    output_data.get("hyperledger").set("combined_fabric", fabric_data);
    output_data.get("WeBankBlockchain").set("combined_webank", webank_data);

    await exportToExcel.exportToExcel("test.csv", output_data);
}

startCrawler().then(() => {
    console.info("end");
    process.exit();
});


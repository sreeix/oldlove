var _ = require("underscore");
var Promise = require("bluebird");
var spawn = require("child_process").spawn;
var moment = require("moment");
var util = require("util");



var rootDir = process.cwd;
var filterPeriod = 6 ; //months
var branchToCompare = 'origin/beta';
var mergedBranches = [];

if( !_.isEmpty(process.argv[2])){
	rootDir = process.argv[2];
}

if( !_.isEmpty(process.argv[3])){
	filterPeriod = parseInt(process.argv[3], 10);
}

if( !_.isEmpty(process.argv[4])){
	branchToCompare = process.argv[4];
}


Promise.all([
	run("git", ['branch', '-r'], {cwd: rootDir}), 
	run('git',  ['branch', '-r', '--merged', branchToCompare], {cwd: rootDir})]).spread(function (res, alreadyMerged) {
	mergedBranches = parseBranchListing(alreadyMerged);
	
	console.log(mergedBranches);
	return parseBranchListing(res);	
})
.then(processBranches)
.then(function (branchInfos) {
	console.log(util.inspect(branchInfos));
	process.exit(0);
})
.catch(function (ex) {
	console.log("failed with ", ex);
	process.exit(1);
});


function parseBranchListing(res) {
	return _.chain(res.split("\n")).flatten().collect(function (branch) {
			if(branch.indexOf("->")!=-1)
				return "";
			return branch.trim();
		}).reject(function (branch) {
			return _.isEmpty(branch);
		}).value();
	
}
function run (cmd, args, opts) {
	return new Promise(function function_name (resolve, reject) {
		var allData = "", err = "";
		var child = spawn(cmd, args, opts);
		child.stdout.on('data', function (data) {
			allData += data;
		});

		child.stderr.on('data', function (data) {
			err += data;
		});

		child.on('close', function (code) {
			if( code == 0) {
				return resolve(allData)
			} else {
				return reject({code: code, err: err});
			}
		});
	});
}

function processBranches (branches) {
	var cutoffTime = moment().subtract(filterPeriod, 'months');
	return Promise.map(branches, gitInfo)
		.then(function function_name (branchDetails) {
			return _.chain(branchDetails).filter(function oldBranches(details) {
				return moment(details.lastCommitTime).isBefore(cutoffTime) || details.merged;
			}).groupBy(function (details) {
				return moment(details.lastCommitTime).fromNow(true);
			}).value();
		});
}


function gitInfo(branch) {
	return run("git", ["log", "-1", "--no-merges", branch],{cwd: rootDir}).then(function (gitLog) {
		var details = gitLog.split("\n");
		// commit 4af63bda164d34c17795c0a4cbae15362bae4e55
		// Author: V Sreekanth <sreekanth@bluejeansnet.com>
		// Date:   Wed Jul 22 16:56:05 2015 +0530

		// Bumping up version for breaking API compat
		return {
			name: branch,
			merged: _.indexOf(mergedBranches, branch) !== -1,
			sha: details[0].split(" ")[1], 
			author: details[1].match("Author: (.*)")[1].trim(),
			lastCommitTime: Date.parse(details[2].match('Date: (.*)')[1].trim()),
			lastMessage: details[4].trim()
		};
	});
}
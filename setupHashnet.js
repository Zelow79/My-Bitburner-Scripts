import { colorPicker, hms, format, formatPercent, numPad } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	const colorPalette = {
		money: 246,
		titles: 231,
		titlebar: 231,
		htitlebar: 231,
		mhash: 208,
		chash: 231,
		hashrate: 231,
		runtime: 246,
		starttime: 231,
		currenttime: 231,
		level: 231,
		cores: 231,
		ram: 231,
		usedram: 1,
		dollars: 231,
		funds: 231,
		tech: 231,
		minsec: 231,
		maxmon: 231,
		study: 231,
		train: 231,
		pnodes: 231,
		lnodes: 231,
		rnodes: 231,
		cnodes: 231,
		cashelevel: 231,
	}
	function scanner(a) {
		const servers = new Set(a);
		for (const server of servers) {
			for (const connectedServer of ns.scan(server)) {
				if (ns.getServerMaxMoney(connectedServer) < 1 || ns.getServer(connectedServer).purchasedByPlayer) continue
				servers.add(connectedServer);
			}
		}
		return Array.from(servers);
	}
	let choices = scanner(["home"]);
	choices.shift() // removes home from list
	let nodePurchases, levelUpgrades, ramUpgrades, coreUpgrades, cacheLvlUpgrades, studyingImproved, hashMoney, trainingImproved, hashCorpFund, redMinSec, incMaxMon, hashCorpTech;
	studyingImproved = levelUpgrades = ramUpgrades = coreUpgrades = cacheLvlUpgrades = nodePurchases = hashMoney = trainingImproved = redMinSec = incMaxMon = hashCorpTech = hashCorpFund = 0
	const scriptStartTime = new Date();
	const hashStudyPerms = await ns.prompt('Use "Improve Studying" auto upgrade?');
	const hashGymPerms = await ns.prompt('Use "Improve Gym Training" auto upgrade?');
	const hashCorpPerms = (ns.getPlayer().hasCorporation) ? await ns.prompt('Use "Sell for Corporation Funds" auto upgrade?') : false;
	const hashCorpTechPerms = (ns.getPlayer().hasCorporation) ? await ns.prompt('Use "Exchange for Corporation Research" auto upgrade?') : false;
	const hashServerMinSecPerms = await ns.prompt('Use "Reduce Minimum Security" auto upgrade?');
	const hashServerIncMaxMon = await ns.prompt('Use "Increase Maximum Money" auto upgrade?');
	const target = (hashServerMinSecPerms || hashServerIncMaxMon) ? await ns.prompt("Choose a target", { type: "select", choices: choices }) : "n00dles"; //defaulting to n00dles for simplicities sake if the script is running correctly this should only effect log display and help prevent issues with ns.getServer(target).minDifficulty
	const serverPerms = await ns.prompt("Auto upgrade Hacknet servers?");
	ns.tail();
	while (true) {
		ns.resizeTail(375, 475);
		ns.print('clearing log......');
		ns.clearLog();
		const targetMinSec = ns.getServer(target).minDifficulty;
		const targetMaxMon = ns.getServer(target).moneyMax;
		ns.print(colorPicker("-------Script Stats--------", colorPalette.titlebar));
		ns.print(`Script start: ${colorPicker(scriptStartTime.toLocaleString(), colorPalette.starttime)}`);
		const scriptCurrentTime = new Date();
		ns.print(`Current time: ${colorPicker(scriptCurrentTime.toLocaleString(), colorPalette.currenttime)}`);
		const runtime = (Date.now() - scriptStartTime);
		if (runtime >= 86400 * 1e3) { colorPalette.runtime = 200 } else if (runtime >= 36000 * 1e3) { colorPalette.runtime = 196 } else if (runtime >= 18000 * 1e3) { colorPalette.runtime = 208 } else if (runtime >= 3600 * 1e3) { colorPalette.runtime = 3 } else if (runtime >= 600 * 1e3) { colorPalette.runtime = 2 }
		ns.print(`Script runtime: ${colorPicker(hms(runtime), colorPalette.runtime)}`);
		const rate = [];
		for (var i = 0; i < ns.hacknet.numNodes(); i++)
			rate.push(ns.hacknet.getNodeStats(i).production)
		function sum(total, num) {
			return total + num;
		}
		let productionRate;
		if (ns.hacknet.numNodes() > 0) { productionRate = rate.reduce(sum) } else { productionRate = 0 }
		const pMoney = ns.getPlayer().money
		if (pMoney > 1e15) { colorPalette.money = 200 } else if (pMoney > 1e12) { colorPalette.money = 196 } else if (pMoney > 1e9) { colorPalette.money = 208 } else if (pMoney > 1e6) { colorPalette.money = 3 } else if (pMoney > 1e3) { colorPalette.money = 2 }
		if (pMoney > 1e33) { colorPalette.money = 231 }
		ns.print(`Money:  ${colorPicker("$" + format(pMoney), colorPalette.money)}`);
		ns.print(`Hashes: ${colorPicker(format(ns.hacknet.numHashes()), colorPalette.chash)} / ${colorPicker(format(ns.hacknet.hashCapacity()), colorPalette.mhash)}`);
		if (ns.hacknet.numNodes() > 0) ns.print(`Total Hashnet Production: ${colorPicker(format(productionRate), colorPalette.hashrate)} h / s`);
		const maxHash = ns.hacknet.hashCapacity();
		if (ns.hacknet.numHashes() > maxHash * 0.9) {
			const budget = Math.floor(maxHash * 0.25);
			if (budget > ns.hacknet.hashCost("Reduce Minimum Security") && targetMinSec > 1 && hashServerMinSecPerms) {
				ns.hacknet.spendHashes("Reduce Minimum Security", target);
				redMinSec++
			} else if (budget > ns.hacknet.hashCost("Increase Maximum Money") && hashServerIncMaxMon) {
				ns.hacknet.spendHashes("Increase Maximum Money", target);
				incMaxMon++
			} else if (budget > ns.hacknet.hashCost("Improve Studying") && hashStudyPerms) {
				ns.hacknet.spendHashes("Improve Studying");
				studyingImproved++
			} else if (budget > ns.hacknet.hashCost("Improve Gym Training") && hashGymPerms) {
				ns.hacknet.spendHashes("Improve Gym Training");
				trainingImproved++
			} else if (budget > ns.hacknet.hashCost("Sell for Corporation Funds") && ns.getPlayer().hasCorporation && hashCorpPerms) {
				ns.hacknet.spendHashes("Sell for Corporation Funds");
				hashCorpFund++
			} else if (budget > ns.hacknet.hashCost("Exchange for Corporation Research") && ns.getPlayer().hasCorporation && hashCorpTechPerms) {
				ns.hacknet.spendHashes("Exchange for Corporation Research");
				hashCorpTech++
			} else {
				ns.hacknet.spendHashes("Sell for Money");
				hashMoney++
			}
		}
		if (ns.hacknet.numNodes() < 1) {
			if (ns.getPlayer().money > ns.hacknet.getPurchaseNodeCost()) {
				ns.hacknet.purchaseNode();
				nodePurchases++
			} else {
				ns.print("Not enough money for first hacknet server.");
			}
		} else {
			for (let i = 0; i < ns.hacknet.numNodes(); i++) {
				if (ns.getPlayer().money > ns.hacknet.getLevelUpgradeCost(i, 1) && serverPerms) {
					ns.hacknet.upgradeLevel(i, 1);
					levelUpgrades++
				} else if (ns.getPlayer().money > ns.hacknet.getRamUpgradeCost(i, 1) && serverPerms) {
					ns.hacknet.upgradeRam(i, 1);
					ramUpgrades++
				} else if (ns.getPlayer().money > ns.hacknet.getCoreUpgradeCost(i, 1) && serverPerms) {
					ns.hacknet.upgradeCore(i, 1);
					coreUpgrades++
				} else if (ns.getPlayer().money > ns.hacknet.getCacheUpgradeCost(i, 1) && ns.hacknet.getNodeStats(i).hashCapacity < 3.2e4 && serverPerms) {
					ns.hacknet.upgradeCache(i, 1);
					cacheLvlUpgrades++
				}
			}
			if (ns.getPlayer().money > ns.hacknet.getPurchaseNodeCost() && ns.hacknet.numNodes() < ns.hacknet.maxNumNodes() && serverPerms) {
				ns.hacknet.purchaseNode();
				nodePurchases++
			}
		}
		if (hashStudyPerms) ns.print(`Current study mult: ${formatPercent(ns.hacknet.getStudyMult() - 1)}`);
		if (hashGymPerms) ns.print(`Current training mult: ${formatPercent(ns.hacknet.getTrainingMult() - 1)}`);
		if (hashServerMinSecPerms) ns.print(`${target}'s MinSec: ${format(targetMinSec)}`);
		if (hashServerIncMaxMon) ns.print(`${target}'s Max Server\$: ${"$" + format(targetMaxMon)}`);
		if (hashMoney > 0 || hashCorpFund > 0 || hashCorpTech > 0 || redMinSec > 0 || incMaxMon > 0 || studyingImproved > 0 || trainingImproved > 0 || nodePurchases > 0 || levelUpgrades > 0 || ramUpgrades > 0 || coreUpgrades > 0 || cacheLvlUpgrades > 0) ns.print(colorPicker("-------Since launch--------", colorPalette.titlebar));
		if (hashMoney > 0 || hashCorpFund > 0 || hashCorpTech > 0 || redMinSec > 0 || incMaxMon > 0 || studyingImproved > 0 || trainingImproved > 0) ns.print(colorPicker("Hash purchases:", colorPalette.titles));
		if (hashMoney > 0) ns.print(`${colorPicker("$" + format(hashMoney * 1e6), colorPalette.dollars)} dollars`);
		if (hashCorpFund > 0) ns.print(`${colorPicker("$" + format(hashCorpFund * 1e9), colorPalette.funds)} corp funds`);
		if (hashCorpTech > 0) ns.print(`${colorPicker(format(hashCorpTech * 1e3), colorPalette.tech)} Scientific Research`);
		if (redMinSec > 0) ns.print(`${colorPicker(numPad(redMinSec, 3), colorPalette.minsec)} Min Security Reduction(s)`);
		if (incMaxMon > 0) ns.print(`${colorPicker(numPad(incMaxMon, 3), onlanguagechange.maxmon)} Server Max\$ Increase(s)`);
		if (studyingImproved > 0) ns.print(`${colorPicker(numPad(studyingImproved, 3), colorPalette.study)} studying multiplier(s)`);
		if (trainingImproved > 0) ns.print(`${colorPicker(numPad(trainingImproved, 3), colorPalette.train)} training multiplier(s)`);
		if (nodePurchases > 0 || levelUpgrades > 0 || ramUpgrades > 0 || coreUpgrades > 0 || cacheLvlUpgrades > 0) ns.print(colorPicker("Hacknet server upgrades bought:", colorPalette.titles));
		if (nodePurchases > 0) ns.print(`${colorPicker(numPad(nodePurchases, 3), colorPalette.pnodes)} server node(s)`);
		if (levelUpgrades > 0) ns.print(`${colorPicker(numPad(levelUpgrades, 3), colorPalette.lnodes)} level upgrade(s)`);
		if (ramUpgrades > 0) ns.print(`${colorPicker(numPad(ramUpgrades, 3), colorPalette.rnodes)} RAM upgrade(s)`);
		if (coreUpgrades > 0) ns.print(`${colorPicker(numPad(coreUpgrades, 3), colorPalette.cnodes)} core upgrade(s)`);
		if (cacheLvlUpgrades > 0) ns.print(`${colorPicker(numPad(cacheLvlUpgrades, 3), colorPalette.cashelevel)} cache lvl upgrade(s)`);
		await ns.sleep(100);
	}
}
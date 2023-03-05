import { colorPicker, format, hms } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL"); //ns.enableLog("sleep");
	const [width, height, sleepTime, scriptStartTime] = [320, 320, 100, new Date()]
	let nodePurchases, levelUpgrades, ramUpgrades, coreUpgrades, cacheLvlUpgrades, hashMoney;
	levelUpgrades = ramUpgrades = coreUpgrades = cacheLvlUpgrades = nodePurchases = hashMoney = 0
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
	ns.tail();
	while (true) {
		ns.resizeTail(width, height);
		ns.print('clearing log......');
		ns.clearLog();
		ns.print(colorPicker("-------Script Stats--------", colorPalette.titlebar));
		ns.print(`Script start: ${colorPicker(scriptStartTime.toLocaleString(), colorPalette.starttime)}`);
		const scriptCurrentTime = new Date();
		ns.print(`Current time: ${colorPicker(scriptCurrentTime.toLocaleString(), colorPalette.currenttime)}`);
		const runtime = (Date.now() - scriptStartTime)
		if (runtime >= 86400 * 1000) { colorPalette.runtime = 200 } else if (runtime >= 36000 * 1000) { colorPalette.runtime = 196 } else if (runtime >= 18000 * 1000) { colorPalette.runtime = 208 } else if (runtime >= 3600 * 1000) { colorPalette.runtime = 3 } else if (runtime >= 600 * 1000) { colorPalette.runtime = 2 }
		ns.print(`Script runtime: ${colorPicker(hms(runtime), colorPalette.runtime)}`);
		const rate = [];
		for (var i = 0; i < ns.hacknet.numNodes(); i++)
			rate.push(ns.hacknet.getNodeStats(i).production)
		function sum(total, num) {
			return total + num;
		}
		let productionRate;
		if (ns.hacknet.numNodes() > 0) { productionRate = rate.reduce(sum) } else { productionRate = 0 }
		let pMoney = format(ns.getPlayer().money);
		if (pMoney > 1e33) { colorPalette.money = 231 } else if (pMoney > 1e15) { colorPalette.money = 200 } else if (pMoney > 1e12) { colorPalette.money = 196 } else if (pMoney > 1e9) { colorPalette.money = 208 } else if (pMoney > 1e6) { colorPalette.money = 3 } else if (pMoney > 1e3) { colorPalette.money = 2 }
		ns.print(`Money: ${colorPicker(pMoney, colorPalette.money)}`);
		ns.print(`Hashes: ${colorPicker(format(ns.hacknet.numHashes()), colorPalette.chash)} / ${colorPicker(format(ns.hacknet.hashCapacity()), colorPalette.mhash)}`);
		if (ns.hacknet.numNodes() > 0) ns.print(`Total Hashnet Production: ${colorPicker(format(productionRate), colorPalette.hashrate)} h / s`);
		for (let i = 0; i < 50; i++) {
			const x = ns.hacknet.spendHashes("Sell for Money");
			if (x) hashMoney++
		}
		if (ns.hacknet.numNodes() < 1) {
			if (ns.getPlayer().money > ns.hacknet.getPurchaseNodeCost()) {
				const x = ns.hacknet.purchaseNode();
				if (x) nodePurchases++
			} else {
				ns.print("Not enough money for first hacknet server.");
			}
		} else {
			for (let i = 0; i < ns.hacknet.numNodes(); i++) {
				if (ns.getPlayer().money > ns.hacknet.getLevelUpgradeCost(i, 1) && ns.hacknet.getNodeStats(i).level < 100) {
					const x = ns.hacknet.upgradeLevel(i, 1);
					if (x) levelUpgrades++
				} else if (ns.getPlayer().money > ns.hacknet.getRamUpgradeCost(i, 1)/* && ns.hacknet.getNodeStats(i).ram < 1e9*/) {
					const x = ns.hacknet.upgradeRam(i, 1);
					if (x) ramUpgrades++
				} else if (ns.getPlayer().money > ns.hacknet.getCoreUpgradeCost(i, 1) && ns.hacknet.getNodeStats(i).cores < 22) {
					const x = ns.hacknet.upgradeCore(i, 1);
					if (x) coreUpgrades++
				} else if (ns.getPlayer().money > ns.hacknet.getCacheUpgradeCost(i, 1) && ns.hacknet.getNodeStats(i).cache < 6) {
					const x = ns.hacknet.upgradeCache(i, 1);
					if (x) cacheLvlUpgrades++
				}
			}
			if (ns.getPlayer().money > ns.hacknet.getPurchaseNodeCost() && ns.hacknet.numNodes() < ns.hacknet.maxNumNodes()) {
				const x = ns.hacknet.purchaseNode();
				if (x) nodePurchases++
			}
		}
		ns.print(colorPicker("-------Since launch--------", colorPalette.titlebar));
		ns.print(colorPicker("Hash purchases:", colorPalette.titles));
		ns.print(`${colorPicker(format(hashMoney * 1e6), colorPalette.dollars)} dollars`);
		ns.print(colorPicker("Hacknet server upgrades bought:", colorPalette.titles));
		ns.print(`${colorPicker(format(nodePurchases), colorPalette.pnodes)} server node(s)`);
		ns.print(`${colorPicker(format(levelUpgrades), colorPalette.lnodes)} level upgrade(s)`);
		ns.print(`${colorPicker(format(ramUpgrades), colorPalette.rnodes)} RAM upgrade(s)`);
		ns.print(`${colorPicker(format(coreUpgrades), colorPalette.cnodes)} core upgrade(s)`);
		ns.print(`${colorPicker(format(cacheLvlUpgrades), colorPalette.cashelevel)} cache lvl upgrade(s)`);
		await ns.sleep(sleepTime);
	}
}
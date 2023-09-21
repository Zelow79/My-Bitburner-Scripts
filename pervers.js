import { numPad, formatGB, format } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('sleep'); ns.clearLog();
	if (ns.args[1] !== false) ns.tail(); await ns.sleep(50); ns.resizeTail(420, 550);
	while (1) {
		while (ns.getPurchasedServerLimit() > ns.getPurchasedServers().length && ns.getPlayer().money > ns.getPurchasedServerCost(2)) {
			ns.purchaseServer(`perver-${numPad(ns.getPurchasedServers().length, 2)}`, 2);
		}
		for (const perver of ns.getPurchasedServers()) {
			const limit = isNaN(ns.args[0]) || ns.args[0] === true ? true : ns.getServer(perver).maxRam < ns.args[0],
				smallerExists = ns.getPurchasedServers().some(s => ns.getServer(s).maxRam < ns.getServer(perver).maxRam),
				canUpgrade = ns.getServer(perver).maxRam < ns.getPurchasedServerMaxRam(),
				canAfford = ns.getPurchasedServerUpgradeCost(perver, ns.getServer(perver).maxRam * 2) <= ns.getPlayer().money;
			if (limit && !smallerExists && canUpgrade && canAfford) ns.upgradePurchasedServer(perver, ns.getServer(perver).maxRam * 2);
		}
		ns.clearLog();
		ns.print(`Max Servers Allowed: ${ns.getPurchasedServerLimit()}`);
		ns.print(`Servers Owned:       ${ns.getPurchasedServers().length}`);
		for (const perver of ns.getPurchasedServers()) {
			const cost = () => ns.getPurchasedServerUpgradeCost(perver, ns.getServer(perver).maxRam * 2);
			ns.print(`${perver} RAM: ${formatGB(ns.getServer(perver).maxRam * 1073741824)} Upgrade Cost: ${format(cost())}`);
		}
		if (!isNaN(ns.args[0]) && ns.getPurchasedServers().every(s => ns.getServer(s).maxRam === ns.args[0])
			|| ns.getPurchasedServers().every(s => ns.getServer(s).maxRam === ns.getPurchasedServerMaxRam())) ns.exit();
		await ns.sleep(10);
	}
}
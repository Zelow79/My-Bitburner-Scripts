import { numPad, formatGB, format } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('sleep'); ns.clearLog(); ns.tail(); await ns.sleep(50); ns.resizeTail(420, 550);
	const [serverRamRange, maxAllowedServers] = [[], ns.getPurchasedServerLimit()]
	for (let i = 2; i <= ns.getPurchasedServerMaxRam(); i *= 2) serverRamRange.push(i);

	while (1) {
		while (maxAllowedServers > ns.getPurchasedServers().length && ns.getPlayer().money > ns.getPurchasedServerCost(2)) {
			ns.purchaseServer(`perver-${numPad(ns.getPurchasedServers().length, 2)}`, 2);
		}
		for (const perver of ns.getPurchasedServers()) {
			const limit = isNaN(ns.args[0]) ? true : ns.getServer(perver).maxRam < ns.args[0]
			const smallerExists = ns.getPurchasedServers().some(s => ns.getServer(s).maxRam < ns.getServer(perver).maxRam);
			const canUpgrade = ns.getServer(perver).maxRam < ns.getPurchasedServerMaxRam();
			const canAfford = ns.getPurchasedServerUpgradeCost(perver, ns.getServer(perver).maxRam * 2) <= ns.getPlayer().money;
			if (limit && !smallerExists && canUpgrade && canAfford) ns.upgradePurchasedServer(perver, ns.getServer(perver).maxRam * 2);
		}
		printServerStatus();
		selfDestruct();
		await ns.sleep(10);
	}

	function printServerStatus() {
		ns.clearLog();
		ns.print(`Max Servers Allowed: ${maxAllowedServers}`);
		ns.print(`Servers Owned:       ${ns.getPurchasedServers().length}`);
		for (const perver of ns.getPurchasedServers()) {
			const cost = () => ns.getPurchasedServerUpgradeCost(perver, ns.getServer(perver).maxRam * 2);
			ns.print(`${perver} RAM: ${formatGB(ns.getServer(perver).maxRam * 1073741824)} Upgrade Cost: ${format(cost())}`);
		}
	}

	function selfDestruct() {
		if (!isNaN(ns.args[0]) && ns.getPurchasedServers().every(s => ns.getServer(s).maxRam === ns.args[0])) ns.exit();
		if (ns.getPurchasedServers().every(s => ns.getServer(s).maxRam === ns.getPurchasedServerMaxRam())) ns.exit();
	}
}
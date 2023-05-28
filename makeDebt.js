import { hmsms, format } from "ze-lib";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('sleep'); ns.clearLog(); ns.tail(); let traveled = 0, start = performance.now();
	ns.atExit(() => ns.print(`Spent \$${format(traveled * 2e5)} in ${hmsms(performance.now() - start)}`));
	while (ns.getPlayer().money < 1e22 && ns.getPlayer().money > -1e9) {
		if (ns.sleeve.travel(0, "Sector-12")) traveled++;
		if (traveled % 1000 === 0) await ns.sleep(0);
	}
}
import { shareIt, getAllServers, format, formatPercent } from "ze-lib"
/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog("ALL"); ns.tail();
	const pids = []
	for (const server of getAllServers(ns)) {
		const p = shareIt(ns, server);
		if (p === null) continue;
		pids.push(p);
	}
	ns.atExit(() => {
		const terminated = []
		pids.forEach(p => {
			if (ns.kill(p)) terminated.push(p);
		});
		ns.print(`Terminated PIDS: ${terminated.join(", ")}`);
	});
	while (1) {
		ns.clearLog();
		let threadCount = 0
		pids.forEach(p => {
			if (ns.getRunningScript(p) === null) pids.splice(pids.indexOf(p), 1);
			else threadCount += ns.getRunningScript(p).threads
		});
		ns.print(`Number of share scripts running: ${pids.length}`);
		ns.print(`Total threads allocated:         ${format(threadCount)}`);
		ns.print(`Total share power:               ${formatPercent(ns.getSharePower() - 1)}`);
		await ns.sleep(0);
	}
}
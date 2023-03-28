import { shareIt, getAllServers } from "ze-lib"
/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog("sleep"); ns.tail();
	const pids = []
	for (const server of getAllServers(ns)) {
		const p = shareIt(ns, server);
		if (p === null) continue;
		pids.push(p);
	}
	ns.atExit(() => pids.forEach(p => ns.kill(p)));
	while (1) await ns.sleep(0);
}
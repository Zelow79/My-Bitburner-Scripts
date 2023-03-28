import { shareIt, getAllServers, format, formatPercent } from "ze-lib"
/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog("ALL"); ns.tail();
	const [pids, excludes, servers] = [[], [], getAllServers(ns)]
	ns.args.forEach(a => {
		if (ns.serverExists(a)) excludes.push(a);
	});
	servers.forEach(server => {
		if (!excludes.includes(server)) {
			const p = shareIt(ns, server);
			if (p !== null) pids.push(p);
		}
	});
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
		const message = [`Active share scripts: ${pids.length}`]
		message.push(`Total threads:        ${format(threadCount)}`);
		message.push(`Total share power:    ${formatPercent(ns.getSharePower() - 1)}`);
		message.push(`Excluded Servers:     ${excludes.join(", ")}`);
		ns.print(message.join("\n"));
		await ns.sleep(0);
	}
}
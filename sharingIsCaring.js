/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog("ALL"); ns.ui.openTail();
	const [pids, excludes, servers] = [[], [], getServers()]
	ns.args.forEach(a => ns.serverExists(a) ? excludes.push(a) : null);
	servers.forEach(server => {
		if (!excludes.includes(server)) {
			const p = shareIt(server);
			if (p) pids.push(p);
		}
	});
	ns.atExit(() => {
		const terminated = pids.filter(p => ns.kill(p));
		ns.print(`Terminated PIDS: ${terminated.join(", ")}`);
	});
	while (1) {
		ns.clearLog();
		let threadCount = 0;
		pids.forEach(p => ns.getRunningScript(p) === null ? pids.splice(pids.indexOf(p), 1) : null);
		pids.forEach(p => threadCount += ns.getRunningScript(p).threads);
		const message = [`Active share scripts: ${pids.length}`];
		message.push(`Total threads:        ${ns.format.number(threadCount)}`);
		message.push(`Total share power:    ${ns.format.percent(ns.getSharePower())}`);
		message.push(`Excluded Servers:     ${excludes.join(", ")}`);
		ns.print(message.join("\n"));
		await ns.sleep(0);
	}

	function shareIt(target) {
		const shareScript = `export const main = async (ns) => { while (1) await ns.share(); }`
		ns.write("share.js", shareScript, "w");
		if (ns.scp("share.js", target)) {
			const freeRam = ns.getServerMaxRam(target) - ns.getServerUsedRam(target);
			if (freeRam < 4) return null;
			const threads = Math.max(Math.floor(freeRam / 4), 1);
			return ns.exec("share.js", target, threads);
		}
	}

	function getServers(homeless = false) {
		const x = new Set(["home"]);
		x.forEach(server => ns.scan(server).forEach(connectServer => x.add(connectServer)));
		if (homeless) x.delete("home");
		return Array.from(x);
	}
}
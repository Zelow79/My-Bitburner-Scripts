import { getAllServers } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('sleep'); ns.clearLog(); const fileName = "charge_marked.js"; ns.exec("superNuker.js", "home");
	while (ns.isRunning("superNuker.js", ns.getHostname())) await ns.sleep(0); ns.tail(); doIt(fileName);

	function doIt(fileName) {
		const fileSize = ns.getScriptRam(fileName), hns = [],
			killIt = (server, fileName) => ns.ps(server).forEach(script => script.filename === fileName && ns.kill(script.pid));
		for (let i = 0; i < ns.hacknet.numNodes(); i++) hns.push(`hacknet-node-${i}`); // hacknet servers are excluded
		for (const server of getAllServers(ns)) {
			const failChecks = server === "home" || hns.includes(server) || !ns.hasRootAccess(server) || ns.getServerMaxRam(server) < 2;
			if (failChecks) continue;
			if (ns.isRunning(fileName, server)) killIt(server, fileName);
			const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server), threads = Math.floor(availableRam / fileSize);
			if (availableRam < 2) continue;
			if (ns.scp(fileName, server) && ns.exec(fileName, server, threads)) ns.toast(`${fileName} started on ${server} with ${threads} threads.`);
		}
		killIt("home", fileName);
		ns.spawn(fileName, Math.floor((ns.getServerMaxRam("home") + ns.getScriptRam(ns.getScriptName()) - ns.getServerUsedRam("home")) / fileSize));
	}
}
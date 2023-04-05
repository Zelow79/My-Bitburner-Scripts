import { getAllServers } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('sleep'); ns.clearLog();
	const fileName = "charge_marked.js"
	ns.exec("superNuker.js", "home");
	while (ns.isRunning("superNuker.js", ns.getHostname())) await ns.sleep(0);
	ns.tail();
	doIt(fileName);

	function doIt(fileName) {
		const servers = getAllServers(ns),
			fileSize = ns.getScriptRam(fileName),
			hns = [],
			killIt = (server, fileName) => ns.ps(server).forEach(script => script.filename === fileName && ns.kill(script.pid));
		for (let i = 0; i < ns.hacknet.numNodes(); i++) hns.push(`hacknet-node-${i}`);
		for (const server of servers) {
			if (server === "home" || hns.includes(server)) continue;;
			const serverInfo = ns.getServer(server),
				maxRam = serverInfo.maxRam;
			if (!serverInfo.hasAdminRights || maxRam < 2) continue;
			if (ns.isRunning(fileName, server)) killIt(server, fileName);
			const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
			if (availableRam < 2) continue;
			const threads = Math.floor(availableRam / fileSize);
			if (ns.scp(fileName, server)) if (ns.exec(fileName, server, threads)) ns.toast(`${fileName} started on ${server} with ${threads} threads.`);
		}
		killIt("home", fileName);
		ns.spawn(fileName, Math.floor((ns.getServerMaxRam("home") + ns.getScriptRam(ns.getScriptName()) - ns.getServerUsedRam("home")) / fileSize));
	}
}
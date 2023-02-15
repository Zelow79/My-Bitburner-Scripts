import { getAllServers } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('sleep'); ns.clearLog();
	const fileName = "charge_marked.js"
	ns.exec("superNuker.js", "home");
	while (ns.isRunning("superNuker.js", ns.getHostname())) await ns.sleep(200);
	doIt(fileName);
	ns.tail();

	function doIt(fileName) {
		const servers = getAllServers(ns);
		const fileSize = ns.getScriptRam(fileName);
		const hns = []
		for (let i = 0; i < ns.hacknet.numNodes(); i++) hns.push(`hacknet-node-${i}`);
		for (const server of servers) {
			if (server === "home" || hns.includes(server)) continue;;
			const serverInfo = ns.getServer(server);
			const maxRam = serverInfo.maxRam;
			if (!serverInfo.hasAdminRights || maxRam < 2) continue;
			if (ns.isRunning(fileName, server)) {
				killIt(server, fileName);
			}
			const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
			ns.print(availableRam);
			if (availableRam < 2) continue;
			const threads = Math.floor(availableRam / fileSize);
			if (ns.scp(fileName, server)) if (ns.exec(fileName, server, threads)) ns.toast(`${fileName} started on ${server} with ${threads} threads.`);
		}
		killIt("home", fileName);
		const availableRam = (ns.getServerMaxRam("home") + ns.getScriptRam(ns.getScriptName())) - ns.getServerUsedRam("home");
		const threads = Math.floor(availableRam / fileSize);
		ns.spawn(fileName, threads);
	}
	
	function killIt(server, fileName) {
		const scripts = ns.ps(server);
		for (const script of scripts) {
			if (script.filename !== fileName) continue;
			ns.kill(script.pid);
		}
	}
}
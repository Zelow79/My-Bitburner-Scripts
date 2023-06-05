import { getAllServers } from "ze-lib";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('ALL'); ns.clearLog(); ns.tail(); const worker = "McAfee.js", workerWeight = ns.getScriptRam(worker),
		availableRam = (server) => ns.getServer(server).maxRam - ns.getServer(server).ramUsed,
		victims = getAllServers(ns).filter(server => ns.getServer(server).hasAdminRights && ns.getHackTime(server) / 4 < 60 * 1000
			&& ns.getServer(server).requiredHackingSkill <= ns.getHackingLevel()
			&& !ns.getServer(server).purchasedByPlayer && !ns.getServer(server).backdoorInstalled),
		ram = getAllServers(ns).filter(server => ns.getServer(server).hasAdminRights && availableRam(server) > workerWeight),
		scripts = []; ram.sort((a, b) => availableRam(a) - availableRam(b)); victims.sort((a, b) => ns.getHackTime(b) - ns.getHackTime(a));
	for (const server of victims) {
		for (const ramHost of ram) {
			if (availableRam(ramHost) < workerWeight) continue;
			scripts.push(await bdServer(server, ramHost));
			break;
		}
	}
	while (scripts.length > 0) {
		for (let i = 0; i < scripts.length; i++) {
			if (ns.isRunning(scripts[i])) continue;
			scripts.splice(i, 1); --i;
		}
		ns.clearLog(); ns.print(`Running Workers: ${scripts.join(", ")}`);
		await ns.sleep(0);
	}

	async function bdServer(server, host) {
		ns.singularity.connect("home"); const route = [server];
		while (route[0] != "home") route.unshift(ns.scan(route[0])[0]);
		for (const server of route) ns.singularity.connect(server);
		ns.scp(worker, host, "home"); const bdpid = ns.exec(worker, host, 1);
		await ns.getPortHandle(bdpid + 100).nextWrite();
		ns.singularity.connect("home"); return bdpid;
	}
}
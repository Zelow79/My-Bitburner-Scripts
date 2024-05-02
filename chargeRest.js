import { getAllServers } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('sleep'); ns.clearLog();
	const fileName = "charge_marked.js",
		startTime = performance.now(),
		launchMessages = [],
		workers = [];

	ns.exec("superNuker.js", "home");
	while (ns.isRunning("superNuker.js", ns.getHostname())) await ns.sleep(0);
	ns.exec("marker.js", "home");
	while (ns.isRunning("marker.js", ns.getHostname())) await ns.sleep(0);
	if (ns.args.includes("tail")) ns.tail();

	for (const server of getAllServers(ns)) {
		for (const script of ns.ps(server)) {
			if (script.pid === ns.pid) continue;
			ns.kill(script.pid); // death to all the others.
		}

		if (!ns.hasRootAccess(server) || ns.getServerMaxRam(server) < 2) continue;
		const availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server), threads = Math.floor(availableRam / 2);
		if (availableRam < 2) continue;
		if (ns.scp(fileName, server)) {
			const p = ns.exec(fileName, server, threads);
			if (p) {
				launchMessages.push(`PID: (${p}) File: ${fileName} started on ${server} with ${threads} threads.`);
				workers.push(p);
			}
		}
	}

	ns.atExit(() => {
		workers.forEach(w => ns.kill(w));
		ns.write("giftLayouts/chargeTimestamp.txt", Date.now(), "w");
		if (ns.args.includes("ai")) ns.exec("ai.js", "home"); // script name can be whatever you want ai.js is my start script
	});

	while (1) {
		ns.clearLog();
		ns.print(launchMessages.join("\n"));
		ns.print(`PIDS: ${workers.join(", ")}.`);
		await ns.sleep(1000); // to keep running
		if (Number.isInteger(ns.args[0]) && performance.now() > startTime + ns.args[0]) ns.kill(ns.pid);
	}
}
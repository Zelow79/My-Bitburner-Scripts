import { getAllServers } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog('ALL');
	const [currentLayout, fileName, s] = [[], "charge_guide.txt", ns.stanek]
	ns.print(`Filename set as: ${fileName}\n`);
	s.activeFragments().forEach(obj => obj.limit > 99 ? currentLayout.push({ x: obj.x, y: obj.y }) : null);

	ns.write(fileName, JSON.stringify(currentLayout), "w");
	ns.print(`Saved: ${fileName}`);
	const nowReadIt = JSON.parse(ns.read(fileName));
	ns.print(`Testing file read back:\n`);
	ns.print(nowReadIt);

	for (const server of getAllServers(ns)) {
		if (server === "home" || !ns.fileExists(fileName, ns.getHostname())) continue;
		if (ns.scp(fileName, server, ns.getHostname())) ns.print(`SUCCESS:${fileName} -> ${server}`);
	}
}
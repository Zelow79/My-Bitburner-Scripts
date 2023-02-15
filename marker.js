import { getAllServers } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog('ALL');
	const s = ns.stanek
	const currentLayout = []
	const fileName = "charge_guide.txt"
	ns.print(`Filename set as: ${fileName}\n`);

	for (const obj of s.activeFragments()) {
		if (obj.limit === 99) continue;
		const x = { x: obj.x, y: obj.y }
		currentLayout.push(x);
	}

	ns.write(fileName, JSON.stringify(currentLayout), "w");
	ns.print(`Saved: ${fileName}`);
	const nowReadIt = JSON.parse(ns.read(fileName));

	for (const server of getAllServers(ns)) {
		if (server === "home" || !ns.fileExists(fileName, ns.getHostname())) continue;
		if (ns.scp(fileName, server, ns.getHostname())) ns.print(`SUCCESS:${fileName} -> ${server}`);
	}
	ns.print(`Testing file read back:\n`);
	ns.print(nowReadIt);
	//ns.tail(); ns.resizeTail(500, 700);
}
import { dhms } from "ze-lib.js"
export async function main(ns) {
	ns.clearLog(); ns.disableLog("sleep");
	const doc = eval('document'),
		hook0 = doc.getElementById('overview-extra-hook-0'),
		hook1 = doc.getElementById('overview-extra-hook-1');
	ns.atExit(() => { hook0.innerText = "", hook1.innerText = "" });
	while (1) {
		const player = ns.getPlayer(),
			totalPlaytime = player.totalPlaytime,
			lastBitnode = Date.now() - ns.getResetInfo().lastNodeReset,
			lastAug = Date.now() - ns.getResetInfo().lastAugReset;
		hook0.innerText = `Playtime\nLast Aug:\nBN clear:\nTotal:`,
			hook1.innerText = `\n${dhms(lastAug)}\n${dhms(lastBitnode)}\n${dhms(totalPlaytime)}`;
		await ns.sleep(1000);
	}
}
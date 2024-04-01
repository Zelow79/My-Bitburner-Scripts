import { dhms, format } from "ze-lib.js";
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
		hook0.innerHTML = `${c("Karma:", 255, 0, 0)}
			</br>${c("Playtime")}</br>${c("Last Aug:")}</br>${c("BN clear:")}</br>${c("Total:")}`,
			hook1.innerHTML = `${c(format(ns.heart.break(), 2), 255, 0, 0)}
			</br></br>${dhms(lastAug)}</br>${dhms(lastBitnode)}</br>${dhms(totalPlaytime)}`;
		await ns.sleep(1000);
	}

	function c(text, r = 255, g = 255, b = 255) {
		return `<span style='color: rgb(${r}, ${g}, ${b})'>${text}</span>`;
	}
}
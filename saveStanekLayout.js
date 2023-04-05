/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog('ALL');
	const s = ns.stanek,
		gridName = await ns.prompt("What is this grids name?", { type: "text" }),
		fileType = await ns.prompt("js or txt?", { type: "select", choices: [".js", ".txt"] }),
		currentLayout = [],
		folder = "/giftLayouts/",
		fileName = gridName + "_" + s.giftWidth() + "x" + s.giftHeight() + fileType
	ns.print(`Filename set as: ${fileName}\n`);
	if (gridName == "" || fileType == "") {
		ns.print('Script terminating due to invalid filename');
		ns.exit();
	}

	for (const obj of s.activeFragments()) {
		currentLayout.push({ id: obj.id, x: obj.x, y: obj.y, rotation: obj.rotation });
	}

	ns.write(folder + fileName, JSON.stringify(currentLayout), "w");
	ns.print(`Saved: ${folder + fileName}`);
	const nowReadIt = JSON.parse(ns.read(folder + fileName));
	ns.print(nowReadIt);
	ns.tail(); ns.resizeTail(400, 600);
}
/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog(); ns.disableLog("ALL");
	const s = ns.stanek,
		layoutFile = await ns.prompt("Load which layout?", { type: "select", choices: ns.ls("home", "/giftLayouts/") });
	if (!ns.ls("home", "/giftLayouts/").includes(layoutFile)) ns.exit();
	const layout = JSON.parse(ns.read(layoutFile));
	if (s.acceptGift() && s.activeFragments().length == 0) {
		for (const frag of layout) {
			if (s.placeFragment(frag.x, frag.y, frag.rotation, frag.id))
				ns.print(`Fragment-#${frag.id} set in location X: ${frag.x}, Y: ${frag.y} & Rotation: ${frag.rotation}`);
		}
	}
	ns.tail(); ns.resizeTail(450, 600);
}
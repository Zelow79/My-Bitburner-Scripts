/** @param {NS} ns */
export async function main(ns) {
	const s = ns.stanek, rawData = ns.read("charge_guide.txt");
	if (rawData === "") { ns.tprint(`Missing charge data.`); ns.exit(); }
	const data = JSON.parse(rawData);
	async function charge(data) { for (const frag of data) await s.chargeFragment(frag.x, frag.y); }
	while (1) await charge(data);
}
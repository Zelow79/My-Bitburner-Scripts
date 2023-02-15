/** @param {NS} ns */
export async function main(ns) {
	const fileName = "charge_guide.txt"
	const rawData = ns.read(fileName);
	const s = ns.stanek

	if (rawData === "") {
		ns.tprint(`Missing charge data.`);
		ns.exit();
	}

	const data = JSON.parse(rawData);

	while (1) {
		await charge(data);
		await ns.sleep(20);
	}

	async function charge(data) {
		for (const frag of data) {
			await s.chargeFragment(frag.x, frag.y);
		}
	}
}
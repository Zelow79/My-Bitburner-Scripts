/** @param {NS} ns */
export async function main(ns) {
	ns.writePort(666, "started"); ns.getPortHandle(666).clear();
	await ns.singularity.installBackdoor();
}
import { MyEmployment } from "Jobs.js";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL"); ns.clearLog();
	if (ns.args.includes("tail")) ns.ui.openTail();
	for (const invite of ns.singularity.checkFactionInvitations()) {
		if (ns.singularity.joinFaction(invite)) ns.tprintRaw(`Accepted invite from ${invite}`);
	}
	const emp = new MyEmployment(ns);
	if (ns.args.filter(e => e != "tail").length > 0) {
		for (const arg of ns.args.filter(e => e != "tail")) {
			emp.applyCompany(arg);
		}
	} else {
		emp.apply4Factions();
	}
	emp.promoteMyJobs();
	emp.takeOutTrash();
}
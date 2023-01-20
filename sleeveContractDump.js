import { dhms, colorPicker, bar, format } from "ze-lib.js"
const [cycleLimit, width, height] = [200, 250, 670]
const contracts = ["Tracking", "Bounty Hunter", "Retirement"]
let [intTracking, intBounty, intRetire, startTime] = [0, 0, 0, 0]
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('ALL'); ns.tail();
	startTime = performance.now();
	const s = ns.sleeve
	const bb = ns.bladeburner
	intTracking = bb.getActionCountRemaining("Contracts", "Tracking");
	intBounty = bb.getActionCountRemaining("Contracts", "Bounty Hunter");
	intRetire = bb.getActionCountRemaining("Contracts", "Retirement");
	const sleeves = []
	for (let i = 0; i < s.getNumSleeves(); i++) {
		sleeves.push(i);
		s.setToSynchronize(i);
	}
	while (1) {
		bonusBuster(ns, sleeves);
		printInfo(ns);
		await ns.sleep(100);
	}
}

function bonusBuster(ns, sleeves) {
	const s = ns.sleeve
	const bb = ns.bladeburner
	sleeves.sort((a, b) => s.getSleeve(b).storedCycles - s.getSleeve(a).storedCycles);
	assign();

	function assign() {
		contracts.sort((a, b) => bb.getActionCountRemaining("Contracts", b) - bb.getActionCountRemaining("Contracts", a));
		sleeves.sort((a, b) => s.getSleeve(b).storedCycles - s.getSleeve(a).storedCycles);
		for (const task of contracts) {
			let isTask = false
			for (const steve2 of sleeves) {
				if (s.getTask(steve2) !== null) {
					if (s.getTask(steve2).type == "BLADEBURNER") {
						if (s.getTask(steve2).actionName == task) {
							isTask = true
						}
					}
				}
			}

			if (!isTask && bb.getActionCountRemaining("Contracts", task) > 20) {
				sleeves.sort((a, b) => s.getSleeve(b).storedCycles - s.getSleeve(a).storedCycles);
				for (const steve2 of sleeves) {
					if (s.getTask(steve2) !== null) continue;
					s.setToBladeburnerAction(steve2, "Take on contracts", task);
					return;
				}
			}
			for (const steve of sleeves) {
				if (s.getTask(steve) !== null && s.getSleeve(steve).storedCycles < 10) {
					if (s.getTask(steve).type == "BLADEBURNER") {
						if (s.getTask(steve).actionName == task) {
							sleeves.sort((a, b) => s.getSleeve(b).storedCycles - s.getSleeve(a).storedCycles);
							for (const steve2 of sleeves) {
								if (s.getTask(steve2) == null && s.getSleeve(steve2).storedCycles >= cycleLimit) {
									s.setToSynchronize(steve);
									s.setToBladeburnerAction(steve2, "Take on contracts", task);
									return;
								}
							}
						}
					}
				}
			}
		}
	}
}

function printInfo(ns) {
	const s = ns.sleeve
	const bb = ns.bladeburner
	ns.resizeTail(width, height); ns.clearLog();
	const currentTracking = bb.getActionCountRemaining("Contracts", "Tracking");
	const currentBounty = bb.getActionCountRemaining("Contracts", "Bounty Hunter");
	const currentRetire = bb.getActionCountRemaining("Contracts", "Retirement");
	const totalCurrentValues = currentTracking + currentBounty + currentRetire
	const totalIntValues = intTracking + intBounty + intRetire
	ns.print(`Contracts completed: ${(totalCurrentValues - totalIntValues < 0) ? colorPicker(format((totalCurrentValues - totalIntValues) * -1), "white") : ""}`);
	ns.print(`Remaining`);
	ns.print(` ${colorPicker("┣", "white")}${(contracts[0] == "Tracking") ? colorPicker("Track", 46) : (contracts[2] == "Tracking") ? colorPicker("Track", 202) : "Track"}:  ${ns.nFormat(currentTracking, "0.00a")}${(currentTracking - intTracking < 0) ? colorPicker("(" + format(currentTracking - intTracking) + ")", 202) : ""}`);
	ns.print(` ${colorPicker("┣", "white")}${(contracts[0] == "Bounty Hunter") ? colorPicker("Hunter", 46) : (contracts[2] == "Bounty Hunter") ? colorPicker("Hunter", 202) : "Hunter"}: ${ns.nFormat(currentBounty, "0.00a")}${(currentBounty - intBounty < 0) ? colorPicker("(" + format(currentBounty - intBounty) + ")", 202) : ""}`);
	ns.print(` ${colorPicker("┗", "white")}${(contracts[0] == "Retirement") ? colorPicker("Retire", 46) : (contracts[2] == "Retirement") ? colorPicker("Retire", 202) : "Retire"}: ${ns.nFormat(currentRetire, "0.00a")}${(currentRetire - intRetire < 0) ? colorPicker("(" + format(currentRetire - intRetire) + ")", 202) : ""}`);
	ns.print(`--Time-Elapsed-${dhms(Math.floor((performance.now() - startTime)))}-----`);
	for (let i = 0; i < s.getNumSleeves(); i++) {
		ns.print(`Sleeve-${i}     ${colorPicker("Int " + ns.nFormat(s.getSleeve(i).skills.intelligence, "0.[00]a"), 75)}`);
		const task = (s.getTask(i) !== null) ? colorPicker(s.getTask(i).actionName, "white") : colorPicker("idle", 242);
		ns.print(` ${colorPicker("┣", "white")}Task:     ${task}`);
		ns.print(` ${colorPicker("┣", "white")}Cycles:   ${format(s.getSleeve(i).storedCycles)}`);
		ns.print(` ${colorPicker("┗", "white")}Progress: ${bar(s.getSleeve(i).storedCycles / cycleLimit, "⚡")}`);
	}
}
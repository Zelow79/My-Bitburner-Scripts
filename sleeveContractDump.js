import { art, dhms, bar, format } from "ze-lib.js"
const [cycleLimit, width, height] = [200, 250, 670]
const contracts = ["Tracking", "Bounty Hunter", "Retirement"]
let [intTracking, intBounty, intRetire, startTime] = [0, 0, 0, 0]
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('ALL'); ns.tail();
	startTime = performance.now();
	const [s, bb, sleeves] = [ns.sleeve, ns.bladeburner, []]
	intTracking = bb.getActionCountRemaining("Contracts", "Tracking");
	intBounty = bb.getActionCountRemaining("Contracts", "Bounty Hunter");
	intRetire = bb.getActionCountRemaining("Contracts", "Retirement");

	for (let i = 0; i < s.getNumSleeves(); i++) {
		sleeves.push(i);
		s.setToIdle(i);
	}

	while (1) {
		bonusBuster(sleeves);
		printInfo();
		await ns.sleep(100);
	}

	function bonusBuster(sleeves) {
		sleeves.sort((a, b) => s.getSleeve(b).storedCycles - s.getSleeve(a).storedCycles);
		contracts.sort((a, b) => bb.getActionCountRemaining("Contracts", b) - bb.getActionCountRemaining("Contracts", a));

		for (const task of contracts) {
			let isTask = false
			for (const steve2 of sleeves) {
				if (s.getTask(steve2) !== null && s.getTask(steve2).type === "BLADEBURNER" && s.getTask(steve2).actionName === task) isTask = true
			}

			if (!isTask && bb.getActionCountRemaining("Contracts", task) > 20) {
				for (const steve2 of sleeves) {
					if (s.getTask(steve2) !== null) continue;
					s.setToBladeburnerAction(steve2, "Take on contracts", task);
					return;
				}
			}

			for (const steve of sleeves) {
				if (s.getTask(steve) !== null && s.getSleeve(steve).storedCycles < 10 && s.getTask(steve).type === "BLADEBURNER" && s.getTask(steve).actionName === task) {
					for (const steve2 of sleeves) {
						if (s.getTask(steve2) === null && s.getSleeve(steve2).storedCycles >= cycleLimit) {
							s.setToIdle(steve);
							s.setToBladeburnerAction(steve2, "Take on contracts", task);
							return;
						}
					}
				}
			}
		}
	}

	function printInfo() {
		ns.resizeTail(width, height); ns.clearLog();
		const currentTracking = bb.getActionCountRemaining("Contracts", "Tracking");
		const currentBounty = bb.getActionCountRemaining("Contracts", "Bounty Hunter");
		const currentRetire = bb.getActionCountRemaining("Contracts", "Retirement");
		const totalCurrentValues = currentTracking + currentBounty + currentRetire
		const totalIntValues = intTracking + intBounty + intRetire
		ns.print(`Contracts completed: ${(totalCurrentValues - totalIntValues < 0) ? art(format((totalCurrentValues - totalIntValues) * -1, 3), { color: 255 }) : ""}`);
		ns.print(`Remaining`);
		ns.print(` ${art("┣", { color: 255 })}${(contracts[0] === "Tracking") ? art("Track", { color: 46 }) : (contracts[2] === "Tracking") ? art("Track", { color: 202 }) : "Track"}:  ${format(currentTracking, 3)}${(currentTracking - intTracking < 0) ? art("(" + format(currentTracking - intTracking, 3) + ")", { color: 202 }) : ""}`);
		ns.print(` ${art("┣", { color: 255 })}${(contracts[0] === "Bounty Hunter") ? art("Hunter", { color: 46 }) : (contracts[2] === "Bounty Hunter") ? art("Hunter", { color: 202 }) : "Hunter"}: ${format(currentBounty, 3)}${(currentBounty - intBounty < 0) ? art("(" + format(currentBounty - intBounty, 3) + ")", { color: 202 }) : ""}`);
		ns.print(` ${art("┗", { color: 255 })}${(contracts[0] === "Retirement") ? art("Retire", { color: 46 }) : (contracts[2] === "Retirement") ? art("Retire", { color: 202 }) : "Retire"}: ${format(currentRetire, 3)}${(currentRetire - intRetire < 0) ? art("(" + format(currentRetire - intRetire, 3) + ")", { color: 202 }) : ""}`);
		ns.print(`---Time-Elapsed-${dhms(Math.floor((performance.now() - startTime)))}----`);

		const steves = []
		for (let i = 0; i < s.getNumSleeves(); i++) {
			if (s.getTask(i) === null) steves.push(i);
		}

		steves.sort((a, b) => s.getSleeve(b).storedCycles - s.getSleeve(a).storedCycles);

		for (let i = 0; i < s.getNumSleeves(); i++) {
			if (s.getTask(i) === null) continue;
			steves.unshift(i);
		}

		for (const steve of steves) {
			ns.print(`Sleeve-${steve}     ${art("Int " + format(s.getSleeve(steve).skills.intelligence, 3), { color: 75 })}`);
			const task = (s.getTask(steve) !== null) ? art(s.getTask(steve).actionName, { color: 255 }) : art("idle", { color: 242 });
			ns.print(` ${art("┣", { color: 255 })}Task:     ${task}`);
			ns.print(` ${art("┣", { color: 255 })}Cycles:   ${format(s.getSleeve(steve).storedCycles)}`);
			ns.print(` ${art("┗", { color: 255 })}Progress: ${bar(s.getSleeve(steve).storedCycles / cycleLimit, "⚡")}`);
		}
	}
}
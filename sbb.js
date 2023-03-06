import { dhms, colorPicker, bar, format } from "ze-lib.js"
const [cycleLimit, width, height] = [3000, 250, 670]
let [generatedOps, startTime] = [0, 0]
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('ALL'); ns.tail();
	const [s, sleeves] = [ns.sleeve, []]
	for (let i = 0; i < s.getNumSleeves(); i++) {
		sleeves.push(i);
		s.setToIdle(i); // set all sleeves to idle
	}
	generatedOps = 0
	startTime = performance.now();
	while (1) {
		await bonusBuster();
		printInfo();
		await ns.sleep(10);
	}

	async function bonusBuster() {
		sleeves.sort((a, b) => s.getSleeve(b).storedCycles - s.getSleeve(a).storedCycles);
		for (const steve of sleeves) {
			if (s.getSleeve(steve).storedCycles < cycleLimit) continue;
			const opsCanGen = Math.floor(s.getSleeve(steve).storedCycles / 300) * 0.5;
			while (1) {
				printInfo();
				if (s.getTask(steve) !== null && s.getSleeve(steve).storedCycles < 600) {
					if (s.getSleeve(steve).storedCycles < 300 - s.getTask(steve).cyclesWorked) break;
				}
				await ns.sleep(10);
				if (s.getTask(steve) !== null && s.getTask(steve).type == "INFILTRATE") continue;
				s.setToBladeburnerAction(steve, "Infiltrate synthoids");
			}
			generatedOps += opsCanGen
			s.setToIdle(steve);
			break;
		}
	}

	function printInfo() {
		ns.resizeTail(width, height); ns.clearLog();  // resizeTail can be removed here if you do not want it sized
		ns.print(`Sleeve Operation Creation`);
		ns.print(`Total gained: ${format(round(generatedOps), 3)}`);
		ns.print(`Time Elapsed: ${dhms(Math.floor((performance.now() - startTime)))}`);
		ns.print(`Avg Gained Per hour: ${format(generatedOps / ((performance.now() - startTime) / (1000 * 60 * 60)), 3)}`);
		ns.print(`Current Cycle Limit: ${format(cycleLimit, 3, 0)}\n `)
		for (const steve of sleeves) {
			ns.print(`Sleeve-${steve}     ${colorPicker("Int " + format(s.getSleeve(steve).skills.intelligence, 3), 75)}`);
			const task = (s.getTask(steve) !== null) ? colorPicker(s.getTask(steve).type.toLowerCase(), "white") : colorPicker("idle", 242);
			ns.print(` ${colorPicker("┣", "white")}Task:     ${task}`);
			ns.print(` ${colorPicker("┣", "white")}Cycles:   ${format(s.getSleeve(steve).storedCycles)}`);
			ns.print(` ${colorPicker("┗", "white")}Progress: ${bar(s.getSleeve(steve).storedCycles / cycleLimit, "⚡")}`);
		}

		function round(value, step = 0.5) {
			var inv = 1.0 / step;
			return Math.round(value * inv) / inv;
		}
	}
}
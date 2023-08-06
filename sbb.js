import { art, dhms, bar, format, tem } from "ze-lib";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('ALL'); ns.tail(); ns.setTitle(tem("🧍BladeBurner:Sleeves", { color: "rgb(0,255,0)", "font-family": 'Brush Script MT, cursive' }));
	const [s, sleeves, cycleLimit, width, height] = [ns.sleeve, [], 3000, 250, 670];
	let [generatedOps, startTime] = [0, performance.now()];
	for (let i = 0; i < s.getNumSleeves(); i++) { sleeves.push(i); s.setToIdle(i); }
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
				if (s.getSleeve(steve)?.storedCycles < 600 && s.getSleeve(steve).storedCycles < 300 - s.getTask(steve).cyclesWorked) break;
				await ns.sleep(10);
				if (s.getTask(steve)?.type == "INFILTRATE") continue;
				s.setToBladeburnerAction(steve, "Infiltrate synthoids");
			}
			generatedOps += opsCanGen;
			s.setToIdle(steve);
			break;
		}
	}

	function printInfo() {
		ns.resizeTail(width, height); ns.clearLog();  // resizeTail can be removed here if you do not want it sized
		ns.print(`Sleeve Operation Creation`);
		ns.print(`Total Gained: ${format(round(generatedOps), 3)}`);
		ns.print(`Time Elapsed: ${dhms(Math.floor((performance.now() - startTime)))}`);
		ns.print(`Avg Gained Per Hour: ${format(generatedOps / ((performance.now() - startTime) / (1000 * 60 * 60)), 3)}`);
		ns.print(`Current Cycle Limit: ${format(cycleLimit, 3, 0)}\n `);
		for (const steve of sleeves) {
			ns.print(`Sleeve-${steve}     ${art("Int " + format(s.getSleeve(steve).skills.intelligence, 3), { color: 75 })}`);
			const task = (s.getTask(steve) !== null) ? art(s.getTask(steve).type.toLowerCase(), { color: 255 }) : art("idle", { color: 242 });
			ns.print(` ${art("┣", { color: 255 })}Task:     ${task}`);
			ns.print(` ${art("┣", { color: 255 })}Cycles:   ${format(s.getSleeve(steve).storedCycles)}`);
			ns.print(` ${art("┗", { color: 255 })}Progress: ${bar(s.getSleeve(steve).storedCycles / cycleLimit, "⚡")}`);
		}

		function round(value, step = 0.5) {
			const inv = 1.0 / step;
			return Math.round(value * inv) / inv;
		}
	}
}
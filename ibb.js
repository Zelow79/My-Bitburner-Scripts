import { colorPicker, format, formatPercent, hms, cities } from "ze-lib.js"
/** @param {NS} ns */
export async function main(ns) {
	const [width, height] = [250, 710]
	ns.tail(); ns.disableLog("ALL"); ns.resizeTail(width, height); ns.clearLog();
	const b = ns.bladeburner
	let lastKnownAssSpree

	while (1) {
		await ns.sleep(500);
		if (!b.inBladeburner()) continue;
		printInfo();
	}

	function printInfo() {
		ns.resizeTail(width, height); ns.clearLog();
		const divider = "══════════════════════════════"//"-------------------------------"//
		ns.print("BLADEBURNER INFORMATION");
		const currentTask = b.getCurrentAction();
		const cTaskTime = b.getActionTime(currentTask.type, currentTask.name);
		ns.print(`Current Task: ${colorPicker(currentTask.name, "white")}`);
		const timeLeft = Math.ceil((cTaskTime - b.getActionCurrentTime()));
		ns.print(` ${colorPicker("┣", "white")}Time Left: ${colorPicker(hms(timeLeft), "white")}`);
		const stamina = b.getStamina()[0] / b.getStamina()[1];
		ns.print(` ${colorPicker("┗", "white")}Stamina:   ${colorPicker(formatPercent(stamina), "white")}`);
		const assCount = b.getActionCountRemaining("Operations", "Assassination");
		if (assCount == 0) {
			lastKnownAssSpree = Date.now() // timestamp spree start time
		}
		const assLevel = b.getActionCurrentLevel("Operations", "Assassination");
		const maxAssLevel = b.getActionMaxLevel("Operations", "Assassination");
		ns.print(divider);
		ns.print("Assassination Info");
		ns.print(` ${colorPicker("┣", "white")}Current Count: ${colorPicker(format(assCount,3), "white")}`);
		ns.print(` ${colorPicker("┣", "white")}Level(Max):    ${colorPicker(format(assLevel,2), "white")}(${colorPicker(format(maxAssLevel,2), "white")})`);
		const successes = b.getActionSuccesses("Operations", "Assassination");
		ns.print(` ${colorPicker("┣", "white")}Lv Post-Spree: ${colorPicker(format(levelAfter(successes, assCount), 3), "white")}${levelAfter(successes, assCount) > maxAssLevel ? colorPicker("(+" + format(levelAfter(successes, assCount) - maxAssLevel, 3) + ")", "green") : ""}`);
		ns.print(` ${colorPicker("┣", "white")}Successes:     ${colorPicker(format(successes,3), "white")}`);
		const successesToLevel = Math.floor(0.5 * (maxAssLevel) * (2 * 2.5 + (maxAssLevel - 1))) - successes // number of additional successes needed for next level up
		const successesLeftToGet = successesToLevel - assCount // factor successes needed after subtracting current assassination count
		ns.print(` ${colorPicker("┗", "white")}Success to lv: ${colorPicker(format(successesToLevel,3), "white")}${successesLeftToGet > 0 ? colorPicker("(" + format(successesLeftToGet) + ")", "green") : ""}`)
		const assMs = (lastKnownAssSpree) ? `*${colorPicker(hms((Math.floor((Date.now() - lastKnownAssSpree))), '00:00:00'), "white")} since last spree` : ""
		ns.print(assMs);
		ns.print(divider);
		const unspentPoints = b.getSkillPoints();
		const rank = b.getRank();
		const skillLevel = x => b.getSkillLevel(x);
		ns.print("Skill Info");
		ns.print(` ${colorPicker("┣", "white")}BB Rank:        ${colorPicker(format(rank,3), "white")}`);
		ns.print(` ${colorPicker("┣", "white")}Skill Points:   ${colorPicker(format(unspentPoints,3), "white")}`);
		ns.print(` ${colorPicker("┣", "white")}Overclock:      ${colorPicker(format(skillLevel("Overclock"),3), "white")}`);
		ns.print(` ${colorPicker("┣", "white")}Reaper:         ${colorPicker(format(skillLevel("Reaper"),3), "white")}`);
		ns.print(` ${colorPicker("┣", "white")}Evasive System: ${colorPicker(format(skillLevel("Evasive System"),3), "white")}`);
		ns.print(` ${colorPicker("┣", "white")}Hands of Midas: ${colorPicker(format(skillLevel("Hands of Midas"),3), "white")}`);
		ns.print(` ${colorPicker("┗", "white")}Hyperdrive:     ${colorPicker(format(skillLevel("Hyperdrive"),3), "white")}`);
		ns.print(divider);
		for (const city of cities) {
			const chaos = b.getCityChaos(city);
			const estPop = b.getCityEstimatedPopulation(city);
			ns.print(`${colorPicker(city, "white")} ${colorPicker(city === b.getCity() ? "--You are here--" : "", 81)}`);
			ns.print(` ${colorPicker("┣", "white")}Est Population: ${colorPicker(format(estPop,3), "white")}`);
			ns.print(` ${colorPicker("┗", "white")}Current Chaos:  ${colorPicker(format(chaos,3), "white")}`);
		}

		function levelAfter(successes, count, operation = true, level = 0) {
			const type = !operation ? 3 : 2.5
			const succForLevel = (x) => Math.floor(0.5 * x * (2 * type + (x - 1)));
			while (successes + count >= succForLevel(level)) level++
			return level;
		}
	}
}
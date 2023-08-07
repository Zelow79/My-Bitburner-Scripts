import { art, format, formatPercent, hms, cities, tem } from "ze-lib"
/** @param {NS} ns */
export async function main(ns) {
	const [width, height] = [250, 710], b = ns.bladeburner;
	ns.tail(); ns.disableLog("ALL"); ns.resizeTail(width, height); ns.clearLog();
	ns.setTitle(tem("🔍BladeBurner:Info", { "font-family": 'Brush Script MT, cursive' }));
	let lastKnownAssSpree;

	while (1) {
		await ns.sleep(500);
		if (!b.inBladeburner()) continue;
		printInfo();
	}

	function printInfo() {
		ns.resizeTail(width, height); ns.clearLog();
		const divider = "══════════════════════════════";
		ns.print("BLADEBURNER INFORMATION");
		const currentTask = b.getCurrentAction(),
			cTaskTime = b.getActionTime(currentTask.type, currentTask.name);
		ns.print(`Current Task: ${art(currentTask.name, { color: 255 })}`);
		const timeLeft = Math.ceil((cTaskTime - b.getActionCurrentTime()));
		ns.print(` ${art("┣", { color: 255 })}Time Left: ${art(hms(timeLeft), { color: 255 })}`);
		const stamina = b.getStamina()[0] / b.getStamina()[1];
		ns.print(` ${art("┗", { color: 255 })}Stamina:   ${art(formatPercent(stamina), { color: 255 })}`);
		const assCount = b.getActionCountRemaining("Operations", "Assassination");
		if (assCount == 0) lastKnownAssSpree = Date.now(); // timestamp spree start time
		const assLevel = b.getActionCurrentLevel("Operations", "Assassination"),
			maxAssLevel = b.getActionMaxLevel("Operations", "Assassination");
		ns.print(divider);
		ns.print("Assassination Info");
		ns.print(` ${art("┣", { color: 255 })}Current Count: ${art(format(assCount, 3), { color: 255 })}`);
		ns.print(` ${art("┣", { color: 255 })}Level(Max):    ${art(format(assLevel, 2), { color: 255 })}(${art(format(maxAssLevel, 2), { color: 255 })})`);
		const successes = b.getActionSuccesses("Operations", "Assassination");
		ns.print(` ${art("┣", { color: 255 })}Lv Post-Spree: ${art(format(levelAfter(successes, assCount), 3), { color: 255 })}${levelAfter(successes, assCount) > maxAssLevel ? art("(+" + format(levelAfter(successes, assCount) - maxAssLevel, 3) + ")", { color: 10 }) : ""}`);
		ns.print(` ${art("┣", { color: 255 })}Successes:     ${art(format(successes, 3), { color: 255 })}`);
		const successesToLevel = Math.floor(0.5 * (maxAssLevel) * (2 * 2.5 + (maxAssLevel - 1))) - successes, // number of additional successes needed for next level up
			successesLeftToGet = successesToLevel - assCount; // factor successes needed after subtracting current assassination count
		ns.print(` ${art("┗", { color: 255 })}Success to lv: ${art(format(successesToLevel, 2), { color: 255 })}${successesLeftToGet > 0 ? art("(" + format(successesLeftToGet, 2) + ")", { color: 10 }) : ""}`);
		const assMs = (lastKnownAssSpree) ? `*${art(hms((Math.floor((Date.now() - lastKnownAssSpree))), '00:00:00'), { color: 255 })} since last spree` : "";
		ns.print(assMs); ns.print(divider);
		const unspentPoints = b.getSkillPoints(),
			rank = b.getRank(),
			skillLevel = x => b.getSkillLevel(x);
		ns.print("Skill Info");
		ns.print(` ${art("┣", { color: 255 })}BB Rank:        ${art(format(rank, 3), { color: 255 })}`);
		ns.print(` ${art("┣", { color: 255 })}Skill Points:   ${art(format(unspentPoints, 3), { color: 255 })}`);
		ns.print(` ${art("┣", { color: 255 })}Overclock:      ${art(format(skillLevel("Overclock"), 3), { color: 255 })}`);
		ns.print(` ${art("┣", { color: 255 })}Reaper:         ${art(format(skillLevel("Reaper"), 3), { color: 255 })}`);
		ns.print(` ${art("┣", { color: 255 })}Evasive System: ${art(format(skillLevel("Evasive System"), 3), { color: 255 })}`);
		ns.print(` ${art("┣", { color: 255 })}Hands of Midas: ${art(format(skillLevel("Hands of Midas"), 3), { color: 255 })}`);
		ns.print(` ${art("┗", { color: 255 })}Hyperdrive:     ${art(format(skillLevel("Hyperdrive"), 3), { color: 255 })}`);
		ns.print(divider);
		for (const city of cities) {
			const chaos = b.getCityChaos(city),
				estPop = b.getCityEstimatedPopulation(city);
			ns.print(`${art(city, { color: 255 })} ${art(city === b.getCity() ? "--You are here--" : "", { color: 81 })}`);
			ns.print(` ${art("┣", { color: 255 })}Est Population: ${art(format(estPop, 3), { color: 255 })}`);
			ns.print(` ${art("┗", { color: 255 })}Current Chaos:  ${art(format(chaos, 3), { color: 255 })}`);
		}

		function levelAfter(successes, count, operation = true, level = 0) {
			const type = !operation ? 3 : 2.5,
				succForLevel = (x) => Math.floor(0.5 * x * (2 * type + (x - 1)));
			while (successes + count >= succForLevel(level)) level++;
			return level;
		}
	}
}
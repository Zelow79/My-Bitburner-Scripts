/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL"); ns.clearLog();
	if (ns.args.includes("tail")) ns.tail(); ns.resizeTail(450, 720);
	const steves = [],
		updateTime = 10000,
		workScriptTimer = 1000 * 60 * 5,
		blackListedFacs = ["Church of the Machine God", "Bladeburners"],
		workScript = "workWork.js"; // script for getting/promoting/quitting jobs
	for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) steves.push(i);
	ns.atExit(() => {
		for (const steve of steves) {
			if (ns.sleeve.getSleeve(steve).shock > 0) ns.sleeve.setToShockRecovery(steve);
		}
	});

	let timeCheck = 0,
		workScriptCheck = 0;

	while (1) {
		if (timeCheck < performance.now()) { // only update if timeCheck is less that current performance.now()
			if (ns.getServerMaxRam("home") > ns.getScriptRam(workScript) && workScriptCheck < performance.now()) {
				ns.run(workScript, 1, "ECorp", "Clarke Incorporated");
				workScriptCheck = performance.now() + workScriptTimer;
			}
			for (const steve of steves) ns.sleeve.setToIdle(steve); // start with all sleeves to idle so assigning should be easier
			steves.sort((a, b) => ns.sleeve.getSleeve(b).storedCycles - ns.sleeve.getSleeve(a).storedCycles)
			let factions = [],
				baseFactions = ns.getPlayer().factions;

			baseFactions.sort((a, b) => ns.singularity.getFactionFavor(b) - ns.singularity.getFactionFavor(a));
			baseFactions = baseFactions.filter(e => !blackListedFacs.includes(e));
			if (ns.gang.inGang()) baseFactions = baseFactions.filter(e => ns.gang.getGangInformation().faction !== e); // remove gang from baseFactions
			const focusFac = ns.getPlayer().factions.includes("ECorp") ? baseFactions.splice(baseFactions.indexOf("ECorp"), 1)[0] : baseFactions.shift();

			for (const fac of baseFactions) {
				if (factionMinRep(fac) === 0 || fac === "Daedalus") continue;
				factions.push({
					name: fac,
					limit: factionMinRep(fac)
				});
			}

			factions.sort((a, b) => a.limit - b.limit); // sort with lowest rep needed first
			if (ns.getPlayer().factions.includes("Daedalus") // if we're in Daedalus
				&& focusFac !== "Daedalus" // and Daedalus isn't our focus
				&& factionMinRep("Daedalus") !== 0) { // and we have less rep than the higest aug they offer
				factions.unshift({ name: "Daedalus", limit: factionMinRep("Daedalus") }); // put Daedalus infront behind focus
			}
			if (focusFac !== undefined) factions.unshift({ name: focusFac }); // put our focus first if it isn't undefined

			for (const steve of steves) {
				farmRep(steve, factions);
			}

			const jobs = []; // quick write up, might need redoing, but inteded to run after faction work is mostly done
			Object.keys(ns.getPlayer().jobs).forEach(k => jobs.push(k));
			for (const steve of steves) {
				for (const [index, job] of jobs.entries()) {
					let check = false;
					if (ns.sleeve.getTask(steve) != null || jobs.length === 0) continue;
					check = ns.sleeve.setToCompanyWork(steve, job);
					if (check) {
						jobs.splice(index, 1);
						break;
					}
				}
			}

			timeCheck = performance.now() + updateTime; // timestamp now + update time so we wait updateTime ms before next update
		}

		printOut();
		await ns.sleep(0); // sleep for a time *10s for now* to let actions run for a bit
	}

	function farmRep(steve, factions) { // assign sleeve a rep task based on factions available
		if (factions.length === 0) return;
		for (const [index, faction] of factions.entries()) {
			let check = false; // check if a sleeve was set to faction work and break out of this scope if true later
			const tasks = ["hacking", "field", "security"].sort((a, b) =>
				ns.formulas.work.factionGains(ns.sleeve.getSleeve(steve), b, ns.singularity.getFactionFavor(faction.name)).reputation
				- ns.formulas.work.factionGains(ns.sleeve.getSleeve(steve), a, ns.singularity.getFactionFavor(faction.name)).reputation);
			for (const t of tasks) {
				try {
					check = ns.sleeve.setToFactionWork(steve, faction.name, t);
					if (check) factions.splice(index, 1);
				} catch (e) {
					ns.tprint(e)
				}
				if (check) break; // if check is true break scope to move on to next sleeve
			}
			if (check) break; // if check is true break scope to move on to next sleeve
		}
	}

	function factionMinRep(faction) { // get the hist rep cost among augs for this faction
		let result = 0;
		try {
			let mostRep = 0;
			for (const aug of ns.singularity.getAugmentationsFromFaction(faction)) {
				const rep = ns.singularity.getAugmentationRepReq(aug);
				if (!ns.singularity.getOwnedAugmentations(true).includes(aug) && rep > mostRep) {
					mostRep = rep;
				}
			}
			result = mostRep > ns.singularity.getFactionRep(faction) ? mostRep : 0;
		} catch (e) { ns.printRaw(e); }
		return result;
	}

	function art(x, style) {                                     // x = what you want colored
		const o = {                                                      // accepts style as an object, all options are optional
			color: !isNaN(style.color) ? style.color : -1,                // style.color uses 256 color codes
			background: !isNaN(style.background) ? style.background : -1, // style.background 256 color codes aswell
			bold: style.bold ? true : false,                              // style.bold is boolean true for bold else false
			underline: style.underline ? true : false                     // style.underline is boolean true for underline else false
		}
		return `\x1b[${o.color >= 0 ? `38;5;${o.color}` : null}${o.bold ? ";1" : null}${o.underline ?
			";4" : null}${o.background >= 0 ? `;48;5;${o.background}` : null}m${x}\x1b[0m`;
	}

	function bar(progress, bar = true, length = 15) { // progress bar, orginal design came from NightElf from BB discord
		if (bar == true) bar = "#";
		const empty = " ",
			progressValue = Math.min(progress, 1),
			barProgress = Math.floor(progressValue * length),
			colors = [196, 202, 226, 46, 33],
			fullColor = 255,
			categoryValue = Math.min(colors.length - 1, Math.floor(progressValue * colors.length)),
			color = progressValue < 1 ? colors[categoryValue] : fullColor,
			array = new Array(barProgress).fill(bar).concat(new Array(length - barProgress).fill(empty));
		return `[${art(array.join(""), { color })}]`;
	}

	function printOut() {
		ns.setTitle(React.createElement("span", { style: { color: "rgb(255,255,255)" } }, ns.getScriptName())); ns.clearLog();
		ns.print(`Seconds until next update: ${art(Math.ceil((timeCheck - performance.now()) / 1000), { color: 255, bold: true })}`);
		const colors = [15, 10, 11, 27, 13, 14, 202, 135]; // colors for sleeve numbers to help distinguish what sleeve went where.
		for (const steve of steves) {
			const task = ns.sleeve.getTask(steve),
				overclocked = ns.sleeve.getSleeve(steve).storedCycles >= 15,
				color = overclocked ? 11 : 255;
			if (task === null) {
				ns.print(`Steve: ${art(steve, { color: colors[steve], bold: true })} is idle.`);
			} else if (task.type === "FACTION") {
				ns.print(`Steve: ${art(steve, { color: colors[steve], bold: true })} is doing ${art(task.factionWorkType, { color })} work for ${art(task.factionName, { color })}`);
				if (factionMinRep(task.factionName) > 0) {
					const repGoal = Math.ceil(factionMinRep(task.factionName)),
						facRep = Math.floor(ns.singularity.getFactionRep(task.factionName)),
						favor = ns.singularity.getFactionFavor(task.factionName),
						facGains = ns.formulas.work.factionGains(ns.sleeve.getSleeve(steve), task.factionWorkType, favor),
						postFavor = ns.formulas.reputation.calculateRepToFavor(ns.formulas.reputation.calculateFavorToRep(ns.singularity.getFactionFavor(task.factionName))
							+ ns.singularity.getFactionRep(task.factionName));
					ns.print(` - Progress:     ${bar(facRep / repGoal, true, 25)}`);
					ns.print(` - rep/goal:     ${art(ns.formatNumber(facRep), { color })} / ${art(ns.formatNumber(repGoal), { color })} ${art("+" + (facGains.reputation * 5 * (overclocked ? 3 : 1)).toFixed(2) + "/s", { color: 10 })}`);
					ns.print(` - favor(post):  ${art(ns.formatNumber(Math.floor(favor)), { color: favor > ns.getFavorToDonate() ? 11 : 255 })}(${art(Math.floor(postFavor), { color: postFavor > ns.getFavorToDonate() ? 11 : 255 })}) ${postFavor > favor ? art("+" + (postFavor - favor).toFixed(2), { color: 10 }) : ""}`);
				} else {
					const facRep = Math.floor(ns.singularity.getFactionRep(task.factionName)),
						favor = ns.singularity.getFactionFavor(task.factionName),
						facGains = ns.formulas.work.factionGains(ns.sleeve.getSleeve(steve), task.factionWorkType, favor),
						postFavor = ns.formulas.reputation.calculateRepToFavor(ns.formulas.reputation.calculateFavorToRep(ns.singularity.getFactionFavor(task.factionName))
							+ ns.singularity.getFactionRep(task.factionName));
					ns.print(` - rep:          ${art(ns.formatNumber(facRep), { color })} ${art("+" + (facGains.reputation * 5 * (overclocked ? 3 : 1)).toFixed(2) + "/s", { color: 10 })}`);
					ns.print(` - favor(post):  ${art(ns.formatNumber(Math.floor(favor)), { color:  favor > ns.getFavorToDonate() ? 11 : 255 })}(${art(Math.floor(postFavor), { color:  postFavor > ns.getFavorToDonate() ? 11 : 255 })}) ${postFavor > favor ? art("+" + (postFavor - favor).toFixed(2), { color: 10 }) : ""}`);
				}
			} else if (task.type === "COMPANY") {
				ns.print(`Steve: ${art(steve, { color: colors[steve], bold: true })} is working job at ${art(task.companyName, { color })}`);
				const companyRep = ns.singularity.getCompanyRep(task.companyName),
					position = ns.getPlayer().jobs[task.companyName],
					compGains = ns.formulas.work.companyGains(ns.sleeve.getSleeve(steve), task.companyName, position, ns.singularity.getCompanyFavor(task.companyName)),
					pay = compGains.money * 5 * (overclocked ? 3 : 1);
				ns.print(` - position:     ${art(position, { color })}`);
				ns.print(` - pay:          ${art("$" + ns.formatNumber(pay, 0) + "/s", { color: 226 })}`);
				ns.print(` - company rep:  ${art(ns.formatNumber(companyRep), { color })} ${art("+" + (compGains.reputation * 5 * (overclocked ? 3 : 1)).toFixed(2) + "/s", { color: 10 })}`);
			} else {
				ns.print(`Steve: ${art(steve, { color: colors[steve], bold: true })} is doing something...`);
			}

			if (ns.args.includes("bonus")) ns.print(` - bonus cycles: ${art(ns.sleeve.getSleeve(steve).storedCycles, { color: 255, bold: true })}`);
		}
	}
}
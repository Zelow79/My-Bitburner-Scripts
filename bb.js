import { bar, format, cities } from "ze-lib.js";
const [globalChaLimit, ass_target, actionLogSize, skillLogSize, width, height] = [1e6, 1e4, 7, 30, 550, 710]
const logs = {
	skill: [],
	action: []
}
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('ALL'); ns.clearLog(); ns.tail();
	const sleepTime = 500
	logs.action.length = 0
	for (var i = 0; i < actionLogSize; i++) logs.action.push(" ");
	logs.skill.length = 0
	for (var i = 0; i < skillLogSize; i++) logs.skill.push(" ");
	if (!ns.scriptRunning("ibb.js", ns.getHostname())) ns.exec("ibb.js", ns.getHostname());
	while (1) {
		printLog(ns);
		joiner(ns);

		if (ns.bladeburner.inBladeburner()) {
			await violence(ns);
			await healthCheck(ns);
			await skillBuyer(ns);
			await cleanUp(ns);
			await chaosEater(ns);

			await doAction(ns);
			mughurTime(ns)
			//await getHyper(ns);
		}
		await ns.sleep(sleepTime);
	}
}

function joiner(ns) {
	if (ns.bladeburner.joinBladeburnerDivision() && !ns.bladeburner.inBladeburner()) addLog("action", '-Joined Bladeburner Division'); //attempt to join bladeburners
	else if (ns.bladeburner.joinBladeburnerFaction() && !ns.getPlayer().factions.includes('Bladeburners')) addLog("action", '-Joined Bladeburner Faction'); //attempt to join bladeburners faction
}

function getBBSkill(ns) {
	const bbSkills = []
	if (ns.bladeburner.getSkillLevel('Overclock') < 33) {
		const x = {
			name: 'Overclock',
			upgradeCost: ns.bladeburner.getSkillUpgradeCost('Overclock')
		}
		bbSkills.push(x);
		return bbSkills
	}

	for (const skill of ns.bladeburner.getSkillNames()) {
		if (skillLimiter(ns, skill)) continue;
		const x = {
			name: skill,
			upgradeCost: ns.bladeburner.getSkillUpgradeCost(skill)
		}
		bbSkills.push(x);
	}
	if (bbSkills.length == 0) return false;
	bbSkills.sort((a, b) => (a.upgradeCost - b.upgradeCost))
	return bbSkills
}

async function skillBuyer(ns) {
	while (getBBSkill(ns) !== false && getBBSkill(ns)[0].upgradeCost < ns.bladeburner.getSkillPoints()) {
		const cheapestSkill = getBBSkill(ns)[0]
		if (ns.bladeburner.upgradeSkill(cheapestSkill.name)) addLog("skill", `${cheapestSkill.name} upgraded to level ${ns.bladeburner.getSkillLevel(cheapestSkill.name)} for ${cheapestSkill.upgradeCost} skill points.`);
		await ns.sleep(20);
	}
}

function skillLimiter(ns, skill) {
	const skillLimits = [
		{ name: "Blade's Intuition", limit: 150 }, //Each level of this skill increases your success chance for all Contracts, Operations, and BlackOps by 3%
		{ name: "Cloak", limit: 100 },             //Each level of this skill increases your success chance in stealth-related Contracts, Operations, and BlackOps by 5.5%
		{ name: "Short-Circuit", limit: 50 },      //Each level of this skill increases your success chance in Contracts, Operations, and BlackOps that involve retirement by 5.5%
		{ name: "Digital Observer", limit: 100 },  //Each level of this skill increases your success chance in all Operations and BlackOps by 4%
		{ name: "Tracer", limit: 20 },             //Each level of this skill increases your success chance in all Contracts by 4%
		{ name: "Overclock", limit: 90 },          //Each level of this skill decreases the time it takes to attempt a Contract, Operation, and BlackOp by 1% (Max Level: 90)
		{ name: "Reaper", limit: 50 },             //Each level of this skill increases your effective combat stats for Bladeburner actions by 2%
		{ name: "Evasive System", limit: 50 },     //Each level of this skill increases your effective dexterity and agility for Bladeburner actions by 4%
		{ name: "Datamancer", limit: 40 },         //Each level of this skill increases your effectiveness in synthoid population analysis and investigation by 5%. This affects all actions that can potentially increase the accuracy of your synthoid population/community estimates.
		{ name: "Cyber's Edge", limit: 25 },       //Each level of this skill increases your max stamina by 2%
		{ name: "Hands of Midas", limit: 50 },     //Each level of this skill increases the amount of money you receive from Contracts by 10%
		{ name: "Hyperdrive", limit: 1000 }        //Each level of this skill increases the experience earned from Contracts, Operations, and BlackOps by 10%
	]
	if (skillLimits.find(({ name }) => name === skill) != undefined) return skillLimits.find(({ name }) => name === skill).limit <= ns.bladeburner.getSkillLevel(skill);
	else return false;
}

function action(ns, type = "general") {
	const blackOps = []
	const operations = []
	const contracts = []
	const general = []

	for (const op of ns.bladeburner.getBlackOpNames()) {
		const x = {
			name: op,
			time: ns.bladeburner.getActionTime("BlackOps", op),
			countRemaining: ns.bladeburner.getActionCountRemaining("BlackOps", op),
			minSuccessChance: ns.bladeburner.getActionEstimatedSuccessChance("BlackOps", op)[0],
			maxSuccessChance: ns.bladeburner.getActionEstimatedSuccessChance("BlackOps", op)[1],
			reqBlackOpRank: ns.bladeburner.getBlackOpRank(op)
		}
		blackOps.push(x);
	}

	for (const op of ["Assassination", "Undercover Operation", "Investigation"]) { //"Sting Operation", "Raid", "Stealth Retirement Operation", ,
		const x = {
			name: op,
			time: ns.bladeburner.getActionTime("Operations", op),
			countRemaining: ns.bladeburner.getActionCountRemaining("Operations", op),
			minSuccessChance: ns.bladeburner.getActionEstimatedSuccessChance("Operations", op)[0],
			maxSuccessChance: ns.bladeburner.getActionEstimatedSuccessChance("Operations", op)[1],
		}
		operations.push(x);
	}

	for (const op of ["Tracking"]) {
		const x = {
			name: op,
			time: ns.bladeburner.getActionTime("Contracts", op),
			countRemaining: ns.bladeburner.getActionCountRemaining("Contracts", op),
			minSuccessChance: ns.bladeburner.getActionEstimatedSuccessChance("Contracts", op)[0],
			maxSuccessChance: ns.bladeburner.getActionEstimatedSuccessChance("Contracts", op)[1],
		}
		contracts.push(x);
	}

	for (const op of ns.bladeburner.getGeneralActionNames()) {
		const x = {
			name: op,
			time: ns.bladeburner.getActionTime("General", op),
			minSuccessChance: ns.bladeburner.getActionEstimatedSuccessChance("General", op)[0],
			maxSuccessChance: ns.bladeburner.getActionEstimatedSuccessChance("General", op)[1],
		}
		general.push(x);
	}

	switch (type) {
		case "general":
			return general;
		case "contracts":
			return contracts;
		case "operations":
			return operations;
		case "blackops":
			return blackOps;
	}
}

async function doAction(ns, aSuccessChance = 1) {
	const blackOps = action(ns, "blackops");
	const operations = action(ns, "operations");
	operations.sort((a, b) => (b.minSuccessChance - a.minSuccessChance));
	const contracts = action(ns, "contracts");
	contracts.sort((a, b) => (b.minSuccessChance - a.minSuccessChance));
	const general = action(ns, "general");
	general.sort((a, b) => (b.minSuccessChance - a.minSuccessChance));

	for (const act of blackOps) {
		if (act.countRemaining < 1) continue;
		if (act.minSuccessChance < aSuccessChance || ns.bladeburner.getBlackOpRank(act.name) > ns.bladeburner.getRank()) break;
		if (ns.bladeburner.getCurrentAction().name == act.name) return;
		if (!ns.singularity.getOwnedAugmentations().includes("The Blade's Simulacrum")) ns.singularity.stopAction();
		if (ns.bladeburner.startAction("BlackOps", act.name)) {
			addLog("action", `ACT: ${act.name}`);
			await ns.sleep(ns.bladeburner.getActionTime("BlackOps", act.name));
			return;
		}
	}

	for (const act of operations) {
		if (act.minSuccessChance < aSuccessChance || act.countRemaining < 1) continue;
		if (ns.bladeburner.getCurrentAction().name == act.name) return;
		if (!ns.singularity.getOwnedAugmentations().includes("The Blade's Simulacrum")) ns.singularity.stopAction();
		if (ns.bladeburner.startAction("Operations", act.name)) {
			addLog("action", `ACT: ${act.name}`);
			await ns.sleep(ns.bladeburner.getActionTime("Operations", act.name));
			return;
		}
	}

	for (const act of contracts) {
		if (act.minSuccessChance < aSuccessChance || act.countRemaining < 1) continue;
		if (ns.bladeburner.getCurrentAction().name == act.name) return;
		if (!ns.singularity.getOwnedAugmentations().includes("The Blade's Simulacrum")) ns.singularity.stopAction();
		if (ns.bladeburner.startAction("Contracts", act.name)) {
			addLog("action", `ACT: ${act.name}`);
			await ns.sleep(ns.bladeburner.getActionTime("Contracts", act.name));
			return;
		}
	}

	const lastResort = [{ name: "Investigation", type: "Operations" }, { name: "Field Analysis", type: "General" }] // {name: "Diplomacy", type: "General"},

	for (const act of lastResort) {
		if (act.name == "Diplomacy" && ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) < 5 || act.name == "Investigation" && ns.bladeburner.getActionCountRemaining("Operations", "Investigation") < 1) continue;
		if (ns.bladeburner.getCurrentAction().name == act.name) return;
		if (!ns.singularity.getOwnedAugmentations().includes("The Blade's Simulacrum")) ns.singularity.stopAction();
		if (ns.bladeburner.startAction(act.type, act.name)) {
			addLog("action", `ACT: ${act.name}`);
			await ns.sleep(ns.bladeburner.getActionTime(act.type, act.name));
			return;
		}
	}
}

async function healthCheck(ns) {
	if (ns.getPlayer().hp.current / ns.getPlayer().hp.max < 0.5) {
		while (ns.getPlayer().hp.current / ns.getPlayer().hp.max < 1) {
			ns.singularity.stopAction(); //this mess is totally temp. Shouldn't even need to hospalize at all, but the HP gain is bugged for when def levels.
			ns.singularity.hospitalize();
			await ns.sleep(20);
			if (ns.getPlayer().hp.current / ns.getPlayer().hp.max === 1) continue;
			if (ns.bladeburner.getCurrentAction().name === "Hyperbolic Regeneration Chamber") continue;
			if (!ns.singularity.getOwnedAugmentations().includes("The Blade's Simulacrum")) ns.singularity.stopAction();
			if (ns.bladeburner.startAction('General', "Hyperbolic Regeneration Chamber")) addLog("action", 'ACT: Hyperbolic Regeneration Chamber');
		}
	}
	if (ns.bladeburner.getStamina()[0] / ns.bladeburner.getStamina()[1] < 0.7) {
		const initStam = ns.bladeburner.getStamina()[0];
		const startTime = new Date();
		const possibleActions = ["Training", "Hyperbolic Regeneration Chamber"];
		let action = possibleActions[0];
		while (ns.bladeburner.getStamina()[0] / ns.bladeburner.getStamina()[1] < 1) {
			if (startTime + 1000 * 60 * 2 <= Date.now() && initStam >= ns.bladeburner.getStamina()[0]) action = possibleActions[1];
			await ns.sleep(20);
			if (ns.bladeburner.getCurrentAction().name === action) continue;
			if (!ns.singularity.getOwnedAugmentations().includes("The Blade's Simulacrum")) ns.singularity.stopAction();
			if (ns.bladeburner.startAction('General', action)) addLog("action", `ACT: ${action}`);
		}
	}
}

async function chaosEater(ns) {
	const b = ns.bladeburner
	const c = b.getCity();
	const act = "Diplomacy"
	if (b.getCityChaos(c) > 20) {
		while (b.getCityChaos(c) > 0) {
			printLog(ns);
			await ns.sleep(500); //precautionary sleep incase it gets caught in returning below
			if (b.getCurrentAction().name == act) continue;
			if (!ns.singularity.getOwnedAugmentations().includes("The Blade's Simulacrum")) ns.singularity.stopAction();
			const ms = b.getActionTime("General", act);
			b.startAction("General", act);
			addLog("action", `ACT: ${act} until city chaos is 0. ${act} ETA: ${ms / 1000} seconds`);
			await ns.sleep(0);
		}
		addLog("action", 'INFO: Chaos reduced to 0.');
	}
}

function mughurTime(ns) {
	const b = ns.bladeburner
	const x = "Hyperdrive"
	let n = 1
	while (b.getSkillUpgradeCost(x, n * 2) < b.getSkillPoints()) n *= 2;
	for (let i = n; i >= 1; i /= 2) {
		if (b.getSkillUpgradeCost(x, n + i) < b.getSkillPoints()) n += i;
	}
	if (ns.bladeburner.getSkillLevel(x) + n > ns.bladeburner.getSkillLevel(x)) {
		if (b.upgradeSkill(x, n)) addLog("skill", `Got ${format(n, 2, 2)} ${x}${(n >= 2) ? "s" : ""} for ${format(b.getSkillUpgradeCost(x, n), 2, 2)} sp`);
	}
}

async function violence(ns) {
	const b = ns.bladeburner
	const assLevel = () => b.getActionCountRemaining("Operations", "Assassination");
	const act = "Incite Violence"
	if (ns.getPlayer().skills.charisma < globalChaLimit) return; //we only wanna act after if we have the charisma to correct it. Testing 1e6 for 50 
	if (assLevel() == 0) {
		while (assLevel() < ass_target) {
			printLog(ns);
			await ns.sleep(500); //precautionary sleep when it gets caught in 'continue' below
			if (b.getCurrentAction().name == act) continue;
			if (!ns.singularity.getOwnedAugmentations().includes("The Blade's Simulacrum")) ns.singularity.stopAction();
			b.startAction("General", act);
			addLog("action", `ACT: ${act} until ${format(ass_target)} ass operations`);
		}
		addLog("action", `Ass qty now ${assLevel()}. Violence protocol - Complete`);
	}
}

async function cleanUp(ns) {
	const boarder = "------------------------------"
	const b = ns.bladeburner
	if (!cities.some(e => b.getCityChaos(e) > 1e50) || ns.getPlayer().skills.charisma < globalChaLimit) return;
	b.stopBladeburnerAction();
	let highestPop = {
		name: "New Tokyo",
		pop: 0
	}
	const startTime = new Date();
	let cleanUpMessage = `\n${startTime.toLocaleString()} - clean up phase began\n\n-----------Reports------------`
	for (const c of cities) {
		b.switchCity(c);
		cleanUpMessage += `\nCity:        ${c}`
		cleanUpMessage += `\nOld Chaos:   ${format(b.getCityChaos(c), 3)}`
		if (b.getCityChaos(c) > 50) {
			addLog("action", `Diplomatic Relations started in: ${c}`);
			b.startAction("General", "Diplomacy");
			while (b.getCityChaos(c) > 0) { await ns.sleep(0) }
			cleanUpMessage += `\nNew Chaos:   ${format(b.getCityChaos(c), 3)}`
		}
		else {
			addLog("action", "Chaos too low, skipping Diplomacy.");
			cleanUpMessage += "\n***Diplomacy Skipped***"
		}
		const popStart = b.getCityEstimatedPopulation(c);
		cleanUpMessage += `\nOld Est Pop: ${format(popStart, 3)}`
		const check1 = b.getCityChaos(c) === 0
		const check2 = b.getActionTime("Operations", "Investigation") === 1000
		const check3 = b.getActionEstimatedSuccessChance("Operations", "Investigation")[1] > 0.99
		if (check1 && check2 && check3) {
			addLog("action", `Running Investigations at ${c} to improve pop estimation.`);
			b.startAction("Operations", "Investigation");
			await ns.sleep(2000);
			b.stopBladeburnerAction();
			addLog("action", `Investigations at ${c} complete.`);
			const popEnd = b.getCityEstimatedPopulation(c);
			cleanUpMessage += `\nNew Est Pop: ${format(popEnd, 3)} (${(popEnd - popStart > 0) ? "+" + format(popEnd - popStart, 3) : format(popEnd - popStart, 3)})`
		}
		else {
			addLog("action", `Investigations at ${c} were skipped.`);
			cleanUpMessage += "\n***Investigations Skipped***"
		}
		if (b.getCityEstimatedPopulation(c) > highestPop.pop) {
			highestPop.name = c
			highestPop.pop = b.getCityEstimatedPopulation(c);
		}
		cleanUpMessage += `\n${boarder}`
		printLog(ns);
	}
	b.switchCity(highestPop.name);
	const endTime = new Date();
	cleanUpMessage += `\nMoving BBHQ to highest est pop: ${highestPop.name}\n${endTime.toLocaleString()} - clean up phase ended\n${(endTime - startTime > 60 * 1000) ? format((endTime - startTime) / 1000 / 60) + " minutes" : (endTime - startTime > 1000) ? format((endTime - startTime) / 1000) + " seconds" : format(endTime - startTime, 0) + "ms"} to finish clean up`
	ns.tprint(cleanUpMessage);
}

function printLog(ns) {
	ns.resizeTail(width, height); ns.clearLog();
	const b = ns.bladeburner
	if (logs.action.length > 0) {
		ns.print(`--action report--`);
		for (const report of logs.action) {
			ns.print(report);
		}
	}
	if (logs.skill.length > 0) {
		ns.print(`--skill report--`);
		for (const report of logs.skill) {
			ns.print(report);
		}
	}
	ns.print(bar(b.getActionCountRemaining("Operations", "Assassination") / ass_target, "⚡") + `${b.getActionCountRemaining("Operations", "Assassination")}/${ass_target} Assassinations`)
}

function addLog(type, x) {
	const maxLength = (type == "action") ? actionLogSize : skillLogSize
	if (logs[type].length < maxLength) {
		logs[type].push(x);
	} else {
		logs[type].shift();
		logs[type].push(x);
	}
}
import { bar, format, cities, tem } from "ze-lib";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog('ALL'); ns.clearLog(); ns.tail(); ns.setTitle(tem("💀BladeBurner:Headquarters", { "font-family": 'Brush Script MT, cursive' }));
	const [globalChaLimit, chaosLimit, ass_target, actionLogSize, skillLogSize, width, height, sleepTime, b, s] = [1e6, 50, 1e4, 7, 30, 375, 710, 500, ns.bladeburner, ns.singularity],
		logs = { skill: [], action: [] }
	for (let i = 0; i < actionLogSize; i++) logs.action.push(" ");
	for (let i = 0; i < skillLogSize; i++) logs.skill.push(" ");
	if (!ns.scriptRunning("ibb.js", ns.getHostname())) ns.exec("ibb.js", ns.getHostname());
	while (1) {
		printLog();
		joiner();
		if (b.inBladeburner()) {
			await violence();
			await healthCheck();
			await skillBuyer();
			await cleanUp();
			await chaosEater();
			await doAction();
			mughurTime();
		}
		await ns.sleep(sleepTime);
	}

	function joiner() {
		if (b.joinBladeburnerDivision() && !b.inBladeburner()) addLog("action", '-Joined Bladeburner Division'); //attempt to join bladeburners
		if (b.inBladeburner() && b.joinBladeburnerFaction() && !ns.getPlayer().factions.includes('Bladeburners')) addLog("action", '-Joined Bladeburner Faction'); //attempt to join bladeburners faction
	}

	function getBBSkill() {
		const bbSkills = [];
		if (b.getSkillLevel('Overclock') < 20) {
			const x = {
				name: 'Overclock',
				upgradeCost: b.getSkillUpgradeCost('Overclock')
			}
			bbSkills.push(x);
			return bbSkills;
		}

		for (const skill of b.getSkillNames()) {
			if (skillLimiter(skill)) continue;
			const x = {
				name: skill,
				upgradeCost: b.getSkillUpgradeCost(skill)
			}
			bbSkills.push(x);
		}
		if (bbSkills.length == 0) return false;
		bbSkills.sort((a, b) => (a.upgradeCost - b.upgradeCost));
		return bbSkills;
	}

	async function skillBuyer() {
		let i = 0;
		while (getBBSkill() !== false && getBBSkill()[0].upgradeCost < b.getSkillPoints()) {
			const cheapestSkill = getBBSkill()[0];
			if (b.upgradeSkill(cheapestSkill.name)) addLog("skill", `Got 1 ${cheapestSkill.name} for ${cheapestSkill.upgradeCost} SP`);
			if (i % 1000 === 0) await ns.sleep(0);
			i++;
		}
	}

	function skillLimiter(skill) {
		const comStats = b.getRank() > 4e5 ? Math.max(Math.min(2e4, b.getRank() * 1e-4), 1e3) : 400, // experimental scaling for combat skills post 400k rank
			opStats = b.getRank() > 4e5 ? Math.max(Math.min(1e4, b.getRank() * 7.5e-5), 1e3) : 200, // same as comStats, but for operation success chance
			skillLimits = [
				{ name: "Blade's Intuition", limit: opStats }, //Each level of this skill increases your success chance for all Contracts, Operations, and BlackOps by 3%
				{ name: "Cloak", limit: opStats },             //Each level of this skill increases your success chance in stealth-related Contracts, Operations, and BlackOps by 5.5%
				{ name: "Short-Circuit", limit: 100 },         //Each level of this skill increases your success chance in Contracts, Operations, and BlackOps that involve retirement by 5.5%
				{ name: "Digital Observer", limit: opStats },  //Each level of this skill increases your success chance in all Operations and BlackOps by 4%
				{ name: "Tracer", limit: 20 },                 //Each level of this skill increases your success chance in all Contracts by 4%
				{ name: "Overclock", limit: 90 },              //Each level of this skill decreases the time it takes to attempt a Contract, Operation, and BlackOp by 1% (Max Level: 90)
				{ name: "Reaper", limit: comStats },           //Each level of this skill increases your effective combat stats for Bladeburner actions by 2%
				{ name: "Evasive System", limit: comStats },   //Each level of this skill increases your effective dexterity and agility for Bladeburner actions by 4%
				{ name: "Datamancer", limit: 80 },             //Each level of this skill increases your effectiveness in synthoid population analysis and investigation by 5%. This affects all actions that can potentially increase the accuracy of your synthoid population/community estimates.
				{ name: "Cyber's Edge", limit: 50 },           //Each level of this skill increases your max stamina by 2%
				{ name: "Hands of Midas", limit: 200 },        //Each level of this skill increases the amount of money you receive from Contracts by 10%
				{ name: "Hyperdrive", limit: 200 }             //Each level of this skill increases the experience earned from Contracts, Operations, and BlackOps by 10%
			]
		if (skillLimits.find(({ name }) => name === skill) != undefined) return skillLimits.find(({ name }) => name === skill).limit <= b.getSkillLevel(skill);
		else return false;
	}

	async function doAction(aSuccessChance = 1) {
		for (const act of b.getBlackOpNames()) {
			if (b.getActionCountRemaining("BlackOps", act) < 1) continue;
			if (b.getActionEstimatedSuccessChance("BlackOps", act)[0] < aSuccessChance || b.getBlackOpRank(act) > b.getRank()) break;
			if (b.getCurrentAction()?.name == act) return;
			if (!s.getOwnedAugmentations().includes("The Blade's Simulacrum")) s.stopAction();
			if (b.startAction("BlackOps", act)) {
				addLog("action", `ACT: ${act}`);
				await ns.sleep(b.getActionTime("BlackOps", act) / (b.getBonusTime() > 1000 ? 5 : 1));
				return;
			}
		}

		for (const act of [{ name: "Assassination", type: "Operations" }, { name: "Undercover Operation", type: "Operations" }, { name: "Investigation", type: "Operations" }, { name: "Tracking", type: "Contracts" }, { name: "Bounty Hunter", type: "Contracts" }, { name: "Retirement", type: "Contracts" }]) {
			if (b.getActionEstimatedSuccessChance(act.type, act.name)[0] < aSuccessChance || b.getActionCountRemaining(act.type, act.name) < 1) continue;
			if (b.getCurrentAction()?.name == act.name) return;
			if (!s.getOwnedAugmentations().includes("The Blade's Simulacrum")) s.stopAction();
			if (b.startAction(act.type, act.name)) {
				addLog("action", `ACT: ${act.name}`);
				await ns.sleep(b.getActionTime(act.type, act.name) / (b.getBonusTime() > 1000 ? 5 : 1));
				return;
			}
		}

		for (const act of [{ name: "Investigation", type: "Operations" }, { name: "Field Analysis", type: "General" }]) {
			if (act.name == "Investigation" && b.getActionCountRemaining(act.type, act.name) < 1) continue;
			if (b.getCurrentAction()?.name == act.name) return;
			if (!s.getOwnedAugmentations().includes("The Blade's Simulacrum")) s.stopAction();
			if (b.startAction(act.type, act.name)) {
				addLog("action", `ACT: ${act.name}`);
				await ns.sleep(b.getActionTime(act.type, act.name) / (b.getBonusTime() > 1000 ? 5 : 1));
				return;
			}
		}
	}

	async function healthCheck() {
		if (ns.getPlayer().hp.current / ns.getPlayer().hp.max < 0.5) {
			while (ns.getPlayer().hp.current / ns.getPlayer().hp.max < 1) {
				await ns.sleep(20);
				if (ns.getPlayer().hp.current / ns.getPlayer().hp.max === 1) continue;
				if (b.getCurrentAction()?.name === "Hyperbolic Regeneration Chamber") continue;
				if (!s.getOwnedAugmentations().includes("The Blade's Simulacrum")) s.stopAction();
				if (b.startAction('General', "Hyperbolic Regeneration Chamber")) addLog("action", 'ACT: Hyperbolic Regeneration Chamber');
			}
		}
		if (b.getStamina()[0] / b.getStamina()[1] < 0.7) {
			const initStam = b.getStamina()[0],
				startTime = new Date(),
				possibleActions = ["Training", "Hyperbolic Regeneration Chamber"];
			let action = possibleActions[0];
			while (b.getStamina()[0] / b.getStamina()[1] < 1) {
				if (startTime + 60000 * 2 <= Date.now() && initStam >= b.getStamina()[0]) action = possibleActions[1];
				await ns.sleep(20);
				if (b.getCurrentAction()?.name === action) continue;
				if (!s.getOwnedAugmentations().includes("The Blade's Simulacrum")) s.stopAction();
				if (b.startAction('General', action)) addLog("action", `ACT: ${action}`);
			}
		}
	}

	async function chaosEater() {
		const c = b.getCity(),
			act = "Diplomacy";
		if (b.getCityChaos(c) > chaosLimit) {
			while (b.getCityChaos(c) > 0) {
				printLog();
				await ns.sleep(500); //precautionary sleep incase it gets caught in returning below
				if (b.getCurrentAction()?.name == act) continue;
				if (!s.getOwnedAugmentations().includes("The Blade's Simulacrum")) s.stopAction();
				b.startAction("General", act);
				addLog("action", `ACT: ${act}`);
			}
			addLog("action", 'INFO: Chaos reduced to 0.');
		}
	}

	function mughurTime() {
		if (b.getSkillPoints() < 1e5) return; let x = "Hyperdrive", n = 1;
		while (b.getSkillUpgradeCost(x, n * 2) < b.getSkillPoints()) n *= 2;
		for (let i = n; i >= 1; i /= 2) if (b.getSkillUpgradeCost(x, n + i) < b.getSkillPoints()) n += i;
		if (b.getSkillLevel(x) + n > b.getSkillLevel(x)) if (b.upgradeSkill(x, n)) {
			addLog("skill", `Got ${format(n, 2, 2)} ${x}${(n >= 2) ? "s" : ""} for ${format(b.getSkillUpgradeCost(x, n), 2, 2)} sp`);
		}
	}

	async function violence() {
		const assLevel = () => b.getActionCountRemaining("Operations", "Assassination"),
			act = "Incite Violence";
		if (ns.getPlayer().skills.charisma < globalChaLimit) return; //we only wanna act after if we have the charisma to correct it. Testing 1e6.
		if (assLevel() == 0) {
			while (assLevel() < ass_target) {
				printLog();
				await ns.sleep(500); //precautionary sleep when it gets caught in 'continue' below
				if (b.getCurrentAction()?.name == act) continue;
				if (!s.getOwnedAugmentations().includes("The Blade's Simulacrum")) s.stopAction();
				b.startAction("General", act);
				addLog("action", `ACT: ${act}`);
			}
			addLog("action", `Violence protocol - Complete`);
		}
	}

	async function cleanUp() {
		const boarder = "------------------------------"
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
			cleanUpMessage += `\nCity:        ${c}`;
			cleanUpMessage += `\nOld Chaos:   ${format(b.getCityChaos(c), 3)}`;
			if (b.getCityChaos(c) > 50) {
				addLog("action", `Diplomacy: ${c}`);
				b.startAction("General", "Diplomacy");
				while (b.getCityChaos(c) > 0) await ns.sleep(0);
				cleanUpMessage += `\nNew Chaos:   ${format(b.getCityChaos(c), 3)}`;
			}
			else {
				addLog("action", `Diplomacy: ${c} - Skipped`);
				cleanUpMessage += "\n***Diplomacy Skipped***";
			}
			const popStart = b.getCityEstimatedPopulation(c),
				check1 = b.getCityChaos(c) === 0,
				check2 = b.getActionTime("Operations", "Investigation") === 1000,
				check3 = b.getActionEstimatedSuccessChance("Operations", "Investigation")[1] > 0.99;
			cleanUpMessage += `\nOld Est Pop: ${format(popStart, 3)}`;
			if (check1 && check2 && check3) {
				addLog("action", `Investigations: ${c}`);
				b.startAction("Operations", "Investigation");
				await ns.sleep(2000);
				b.stopBladeburnerAction();
				addLog("action", `Investigations: ${c} - complete`);
				const popEnd = b.getCityEstimatedPopulation(c);
				cleanUpMessage += `\nNew Est Pop: ${format(popEnd, 3)} (${(popEnd - popStart > 0) ? "+" + format(popEnd - popStart, 3) : format(popEnd - popStart, 3)})`;
			}
			else {
				addLog("action", `Investigations: ${c} - skipped`);
				cleanUpMessage += "\n***Investigations Skipped***";
			}
			if (b.getCityEstimatedPopulation(c) > highestPop.pop) {
				highestPop.name = c;
				highestPop.pop = b.getCityEstimatedPopulation(c);
			}
			cleanUpMessage += `\n${boarder}`;
			printLog();
		}
		b.switchCity(highestPop.name);
		const endTime = new Date(),
			folder = "/bladeburner_reports/",
			fileName = "cleanup_" + (endTime.getMonth() + 1) + "-" + endTime.getDate() + "-" + endTime.getFullYear() + ".txt";
		cleanUpMessage += `\nMoving BBHQ to highest est pop: ${highestPop.name}\n${endTime.toLocaleString()} - clean up phase ended\n${(endTime - startTime > 60 * 1000) ? format((endTime - startTime) / 1000 / 60) + " minutes" : (endTime - startTime > 1000) ? format((endTime - startTime) / 1000) + " seconds" : format(endTime - startTime, 0) + "ms"} to finish clean up`;
		ns.tprint(cleanUpMessage);
		ns.write(folder + fileName, cleanUpMessage, "w");
	}

	function printLog() {
		ns.resizeTail(width, height); ns.clearLog();
		if (logs.action.length > 0) {
			ns.print(`--action report--`);
			for (const report of logs.action) {
				ns.print(report);
			}
		}
		if (logs.skill.length > 0) {
			ns.print(`--skill report--`);
			for (const report of logs.skill) ns.print(report);
		}
		if (b.inBladeburner()) ns.print(bar(b.getActionCountRemaining("Operations", "Assassination") / ass_target, "⚡") + `${Math.floor(b.getActionCountRemaining("Operations", "Assassination"))}/${ass_target} Assassinations`);
	}

	function addLog(type, x) {
		const maxLength = (type === "action") ? actionLogSize : skillLogSize;
		if (logs[type].length >= maxLength) logs[type].shift();
		logs[type].push(x);
	}
}
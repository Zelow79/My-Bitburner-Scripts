import { format } from "ze-lib.js"
/** @param {NS} ns */
export async function main(ns) {
	ns.tail(); ns.disableLog('ALL'); ns.clearLog();
	await skillBuyer(ns);
}

function getBBSkill(ns) {
	const bbSkills = []
	for (const skill of ns.bladeburner.getSkillNames()) {
		if (skillLimiter(ns, skill)) continue;
		const x = {
			name: skill,
			upgradeCost: ns.bladeburner.getSkillUpgradeCost(skill)
		}
		bbSkills.push(x);
	}
	if (bbSkills.length == 0) return false;
	bbSkills.sort((a, b) => (a.upgradeCost - b.upgradeCost));
	return bbSkills;
}

async function skillBuyer(ns) {
	while (getBBSkill(ns) !== false && getBBSkill(ns)[0].upgradeCost < ns.bladeburner.getSkillPoints()) {
		const cheapestSkill = getBBSkill(ns)[0]
		await getSkilled(ns, cheapestSkill.name);
		await ns.sleep(20);
	}
}

function skillLimiter(ns, skill, fudge = false) {
	const value = 1e23
	const skillLimits = [
		{ name: "Blade's Intuition", limit: value },   //Each level of this skill increases your success chance for all Contracts, Operations, and BlackOps by 3%
		{ name: "Cloak", limit: value },               //Each level of this skill increases your success chance in stealth-related Contracts, Operations, and BlackOps by 5.5%
		{ name: "Short-Circuit", limit: value },       //Each level of this skill increases your success chance in Contracts, Operations, and BlackOps that involve retirement by 5.5%
		{ name: "Digital Observer", limit: value },    //Each level of this skill increases your success chance in all Operations and BlackOps by 4%
		{ name: "Tracer", limit: value },              //Each level of this skill increases your success chance in all Contracts by 4%
		{ name: "Overclock", limit: 90 },              //Each level of this skill decreases the time it takes to attempt a Contract, Operation, and BlackOp by 1% (Max Level: 90)
		{ name: "Reaper", limit: value },              //Each level of this skill increases your effective combat stats for Bladeburner actions by 2%
		{ name: "Evasive System", limit: value },      //Each level of this skill increases your effective dexterity and agility for Bladeburner actions by 4%
		{ name: "Datamancer", limit: value },          //Each level of this skill increases your effectiveness in synthoid population analysis and investigation by 5%. This affects all actions that can potentially increase the accuracy of your synthoid population/community estimates.
		{ name: "Cyber's Edge", limit: value },        //Each level of this skill increases your max stamina by 2%
		{ name: "Hands of Midas", limit: value },      //Each level of this skill increases the amount of money you receive from Contracts by 10%
		{ name: "Hyperdrive", limit: value }           //Each level of this skill increases the experience earned from Contracts, Operations, and BlackOps by 10%
	]
	if (fudge && skillLimits.find(({ name }) => name === skill) != undefined) return skillLimits.find(({ name }) => name === skill).limit;
	if (skillLimits.find(({ name }) => name === skill) != undefined) return skillLimits.find(({ name }) => name === skill).limit <= ns.bladeburner.getSkillLevel(skill);
	else return false;
}

async function getSkilled(ns, x) {
	const b = ns.bladeburner
	let n = 1
	while (b.getSkillUpgradeCost(x, n * 2) < b.getSkillPoints() && ns.bladeburner.getSkillLevel(x) + n * 2 < skillLimiter(ns, x, true)) n *= 2;
	for (let i = n; i >= 1; i /= 2) {
		if (ns.bladeburner.getSkillLevel(x) + n + i > skillLimiter(ns, x, true)) continue;
		if (b.getSkillUpgradeCost(x, n + i) < b.getSkillPoints()) n += i;
	}
	if (ns.bladeburner.getSkillLevel(x) + n > ns.bladeburner.getSkillLevel(x)) if (b.upgradeSkill(x, n)) ns.print(`Got ${format(n)} ${x}${(n >= 2) ? "s" : ""} for ${format(b.getSkillUpgradeCost(x, n))} sp`);
}
import { diceBar, bar } from "ze-lib.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	ns.clearLog();
	ns.tail();
	const windowHeight = 900
	const windowWidth = 255
	ns.resizeTail(windowWidth, windowHeight);
	const faction = "Slum Snakes" // pick the faction you wanna join
	let otherGangsInfoPrevCycle = undefined;
	let nextTick = undefined;
	while (true) {
		ns.resizeTail(windowWidth, windowHeight);
		ns.clearLog();
		if (ns.gang.inGang()) {
			let myGang = ns.gang.getGangInformation();
			let allowClash = true;
			gangMemberAscension(ns);
			if (ns.getBitNodeMultipliers().GangSoftcap > 0.6 || ns.gang.getEquipmentCost("Baseball Bat") / 1e6 < 0.4) equipmentcheck(ns);
			let territoryTime = (myGang.territory < 1) ? tickCheck(ns, otherGangsInfoPrevCycle, allowClash, nextTick, myGang) : { tw: false }
			if (myGang.territory >= 1) ns.gang.setTerritoryWarfare(false); // not really needed just added for personal pref, to catch if war is still engaged after 100%
			nextTick = territoryTime.nextTickOut
			otherGangsInfoPrevCycle = territoryTime.otherGangsInfoPrevCycleOut
			if (!territoryTime.tw) gangMemberStuff(ns);
			printInfo(ns, myGang);
		} else {
			ns.print(`Current Karma: ${ns.nFormat(ns.heart.break(), '0,0.[00]a')}`)
			ns.singularity.joinFaction(faction);
			ns.gang.createGang(faction);
		}

		await ns.sleep(1000 * 1);
	}
}

function tickCheck(ns, otherGangsInfoPrevCycle, allowClash, nextTick, myGang) {
	// *** Territory warfaire *** credit: Sin from the Discord. I modified their detect tick method into a function to work with my script.
	// Detect new tick
	let otherGangsInfo = ns.gang.getOtherGangInformation();
	let members = ns.gang.getMemberNames();
	let newTick = false;
	for (let i = 0; i < Object.keys(otherGangsInfo).length; i++) {
		const gangName = Object.keys(otherGangsInfo)[i];
		if (gangName == myGang.faction) continue;

		if (ns.gang.getChanceToWinClash(gangName) < 0.55)
			allowClash = false;

		let gi = Object.values(otherGangsInfo)[i];
		let ogi = otherGangsInfoPrevCycle ? Object.values(otherGangsInfoPrevCycle)[i] : gi;

		let powerChanged = gi.power != ogi.power;
		let territoryChanged = gi.territory != ogi.territory;
		let changed = powerChanged || territoryChanged;

		if (changed) {
			newTick = true;
		}
	}

	// If we're in a new tick, take note of when next one is going to happen
	if (newTick) {
		ns.print('WARN: -- NEW TICK DETECTED --');
		nextTick = Date.now() + 19000;
	}

	// Assign members to territory warfare
	let tw;
	if (nextTick != undefined && Date.now() + 500 > nextTick) {
		ns.print('WARN: Assigning all members to territory warfare');
		for (let member of members) {
			if (allowClash && ns.gang.getMemberInformation(member).def < 600) {
				ns.print(`${member} avoided war for saftey.`);
				printMemberStats(ns, ns.gang.getMemberInformation(member));
				continue;
			}
			ns.gang.setMemberTask(member, 'Territory Warfare');
			ns.print(`${member} set to Territory Warfare.`);
			printMemberStats(ns, ns.gang.getMemberInformation(member));
			tw = true
		}
	}

	let nextTickOut = nextTick;
	let otherGangsInfoPrevCycleOut = otherGangsInfo;
	ns.gang.setTerritoryWarfare(allowClash && myGang.territory < 1);
	return {
		tw,
		otherGangsInfoPrevCycleOut,
		nextTickOut
	}
}

function gangMemberAscension(ns) {
	let squadInfo = []
	for (const member of ns.gang.getMemberNames()) {
		squadInfo.push(ns.gang.getMemberInformation(member));
	}
	squadInfo.sort((a, b) => (a.str_asc_mult > b.str_asc_mult) ? 1 : -1);
	for (const member of squadInfo) {
		const ascensionInfo = ns.gang.getAscensionResult(member.name);
		const ganginfo = ns.gang.getGangInformation();
		if (ascensionInfo == undefined) continue; // if cannot ascend skip
		const respLoss = ascensionInfo.respect; // amount of respect lost if ascended
		ganginfo.respect -= respLoss // remove amount that would be lost from amount respect gang has
		const penAftAsc = 1 - ns.formulas.gang.wantedPenalty(ganginfo); // penalty after you ascend
		if (penAftAsc > 0.01) continue; // skip if penalty after ascension is too high
		if (ascensionInfo.str > calculateAscendTreshold(ns, member.name, "str_asc_mult") || ascensionInfo.def > calculateAscendTreshold(ns, member.name, "def_asc_mult") || ascensionInfo.dex > calculateAscendTreshold(ns, member.name, "dex_asc_mult") || ascensionInfo.agi > calculateAscendTreshold(ns, member.name, "agi_asc_mult")) {
			if (ns.gang.ascendMember(member.name) != undefined) ns.print(`Gang Member: ${member.name} Ascended.`);
			break;
		}
	}
}

function equipmentcheck(ns) {
	let squadInfo = []
	for (const member of ns.gang.getMemberNames()) {
		squadInfo.push(ns.gang.getMemberInformation(member));
	}
	squadInfo.sort((a, b) => (a.str_asc_mult > b.str_asc_mult) ? 1 : -1);
	for (const member of squadInfo) {
		const allEquipment = ns.gang.getEquipmentNames();
		const currentlyEquipped = ns.gang.getMemberInformation(member.name).upgrades;
		let ofInterest = allEquipment.filter(n => !currentlyEquipped.includes(n));
		let equipmentToGet = []
		for (const x of ofInterest) {
			if (ns.gang.getEquipmentStats(x).str > 0 || ns.gang.getEquipmentStats(x).def > 0) {
				equipmentToGet.push({
					name: x,
					hack: (ns.gang.getEquipmentStats(x).hack != null) ? ns.gang.getEquipmentStats(x).hack : 0,
					str: (ns.gang.getEquipmentStats(x).str != null) ? ns.gang.getEquipmentStats(x).str : 0,
					def: (ns.gang.getEquipmentStats(x).def != null) ? ns.gang.getEquipmentStats(x).def : 0,
					dex: (ns.gang.getEquipmentStats(x).dex != null) ? ns.gang.getEquipmentStats(x).dex : 0,
					agi: (ns.gang.getEquipmentStats(x).agi != null) ? ns.gang.getEquipmentStats(x).agi : 0,
					cha: (ns.gang.getEquipmentStats(x).cha != null) ? ns.gang.getEquipmentStats(x).cha : 0
				});
			}
		}
		equipmentToGet.sort((a, b) => (a.str < b.str) ? 1 : -1); // recently added to make str gear bought first
		for (const y of equipmentToGet) {
			if (ns.getPlayer().money > ns.gang.getEquipmentCost(y.name)) {
				const purchase = ns.gang.purchaseEquipment(member.name, y.name);
				if (purchase) ns.print(`Gang member: ${member.name} purchased: ${y.name}.`);
			}
		}
	}
}

function gangMemberStuff(ns) {
	const targetValue = 100 // amount each stat will be trained up to. Recently changed to work more like a weight to use against ascension multiplier
	while (ns.gang.canRecruitMember()) {
		const gangsterNames = ns.gang.getMemberNames();
		const name = parseInt(gangsterNames[gangsterNames.length - 1], 10) >= 0 ? ns.nFormat(parseInt(gangsterNames[gangsterNames.length - 1], 10) + 1, "00") : "00" // recently attempted to add a 2 digit number padding. Hopefully names will be 00, 01, 02 etc.
		ns.gang.recruitMember(name);
		ns.print(`${name} has been recruited.`);
	}
	for (const name of ns.gang.getMemberNames()) {
		let arrayTaskObjects = []
		let myGang = ns.gang.getGangInformation();
		const memberInfo = ns.gang.getMemberInformation(name);
		const statCheck = memberInfo.str < targetValue * memberInfo.str_asc_mult || memberInfo.def < targetValue * memberInfo.def_asc_mult || memberInfo.dex < targetValue * memberInfo.dex_asc_mult || memberInfo.agi < targetValue * memberInfo.agi_asc_mult
		if (statCheck && 1 - myGang.wantedPenalty < 0.02) {
			ns.gang.setMemberTask(memberInfo.name, "Train Combat");
			ns.print(`${memberInfo.name} set to Train Combat.`);
			printMemberStats(ns, memberInfo);
			continue;
		}

		for (const task of ns.gang.getTaskNames()) {
			const taskStats = ns.gang.getTaskStats(task);
			const wantGain = ns.formulas.gang.wantedLevelGain(myGang, memberInfo, taskStats);
			const respGain = ns.formulas.gang.respectGain(myGang, memberInfo, taskStats);
			const moneGain = ns.formulas.gang.moneyGain(myGang, memberInfo, taskStats);
			arrayTaskObjects.push({
				name: task,
				wantGain,
				respGain,
				moneGain
			});
		}

		const priority = (myGang.respect < 2e6) ? arrayTaskObjects.sort((a, b) => (a.respGain < b.respGain) ? 1 : -1) : arrayTaskObjects.sort((a, b) => (a.moneGain < b.moneGain) ? 1 : -1);

		const canFight = myGang.territoryClashChance == 0 || memberInfo.def > 600
		if (ns.gang.getBonusTime() > 5000 && canFight && myGang.territory < 1) {
			ns.gang.setMemberTask(name, "Territory Warfare");
			ns.print("***BONUS TIME***");
			ns.print(`${name} task: "Territory Warfare".`);
			printMemberStats(ns, memberInfo)
		} else {
			for (const x of arrayTaskObjects) {
				if (x.name == "Vigilante Justice" || x.name == "Territory Warfare" || x.name == "Train Hacking" || x.name == "Train Charisma" || x.name == "Ethical Hacking") continue
				if (x.respGain < x.wantGain * 99) continue;
				ns.gang.setMemberTask(name, x.name);
				ns.print(`${name} task: ${x.name}`);
				printMemberStats(ns, memberInfo)
				break;
			}
		}
	}
}

function printMemberStats(ns, memberInfo) {
	ns.printf("%s %8s %s %8s\n", `┣STR:`, `${format(ns, memberInfo.str)}`, `┣DEF:`, `${format(ns, memberInfo.def)}`);
	ns.printf("%s %8s %s %8s\n", `┗RES:`, `${format(ns, memberInfo.respectGain)}`, `┗MON:`, `${format(ns, memberInfo.moneyGain)}`);
	//ns.printf("%s %8s %s %8s\n", `┗AGI:`, `${ns.nFormat(memberInfo.agi, "0.[000]a")}`, `┗CHA:`, `${ns.nFormat(memberInfo.cha, "0.[000]a")}`);
}

// Credit: Mysteyes. https://discord.com/channels/415207508303544321/415207923506216971/940379724214075442
function calculateAscendTreshold(ns, member, prop) {
	let mult = ns.gang.getMemberInformation(member)[prop];
	if (mult < 1.632) return 1.6326;
	if (mult < 2.336) return 1.4315;
	if (mult < 2.999) return 1.284;
	if (mult < 3.363) return 1.2125;
	if (mult < 4.253) return 1.1698;
	if (mult < 4.860) return 1.1428;
	if (mult < 5.455) return 1.1225;
	if (mult < 5.977) return 1.0957;
	if (mult < 6.496) return 1.0869;
	if (mult < 7.008) return 1.0789;
	if (mult < 7.519) return 1.073;
	if (mult < 8.025) return 1.0673;
	if (mult < 8.513) return 1.0631;

	return 1.0591;
}

function printInfo(ns, myGang) {
	//ns.print(`\n   *** GANG REPORT ***`);
	ns.print(`\nFaction name    : ${myGang.faction}`);
	ns.print(`Total Respect   : ${format(ns, myGang.respect)}`);
	ns.print(`New Member at   : ${ns.nFormat(getRespectNeededToRecruitMember(ns, ns.gang.getMemberNames()), "0a")} resp.`);
	ns.print(`Wanted Level    : ${format(ns, myGang.wantedLevel)}`);
	ns.print(`Wanted Penalty  : -${ns.nFormat(1 - myGang.wantedPenalty, "0.00%")}`);
	ns.print(`Money gain rate : ${format(ns, myGang.moneyGainRate * 5)} / s`);
	ns.print(`Is war allowed? : ${myGang.territoryWarfareEngaged}`);
	ns.print(`Min Win Chance  : ${ns.nFormat(lowestClashChance(ns), '0[.]00%') + "\n" + diceBar(lowestClashChance(ns), 29)}`);
	ns.print(`Territory Power : ${format(ns, myGang.power)}`);
	ns.print(`Territory Owned : ${ns.nFormat(myGang.territory, "0.[00]%") + "\n" + bar(myGang.territory, "", 29)}`);
	ns.print(`Faction Rep     : ${format(ns, ns.singularity.getFactionRep(myGang.faction))}`);
}

function getRespectNeededToRecruitMember(ns, members) {
	// First N gang members are free (can be recruited at 0 respect)
	const numFreeMembers = 3;
	if (members.length < numFreeMembers || members.length > 11) return 0;

	const i = members.length - (numFreeMembers - 1);
	return Math.pow(5, i);
}

function lowestClashChance(ns) {
	let lowestChance = 1
	const gangInfo = ns.gang.getOtherGangInformation();
	for (let i = 0; i < Object.keys(gangInfo).length; i++) {
		const gangName = Object.keys(gangInfo)[i]
		if (gangName == ns.gang.getGangInformation().faction) continue;
		if (ns.gang.getChanceToWinClash(gangName) < lowestChance) {
			lowestChance = ns.gang.getChanceToWinClash(Object.keys(gangInfo)[i])
		}
	}
	return lowestChance
}

function format(ns, value) {
	return (value >= 1e15) ? ns.nFormat(value, "0.[00]e+0") : ns.nFormat(value, "0.[00]a");
}
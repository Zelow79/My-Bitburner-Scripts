import { bar, format, formatPercent, colorPicker, names } from "ze-lib";
const [discountThresh, wantedPenThresh] = [0.8, 0.05]
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL"); ns.clearLog(); ns.tail();
	const [faction, windowHeight, windowWidth] = ["Slum Snakes", 888, 390]
	const tick = {
		tw: false,
		otherGangsInfoPrevCycle: undefined,
		nextTick: undefined
	}
	await ns.sleep(500);
	ns.resizeTail(windowWidth, windowHeight);
	while (true) {
		ns.resizeTail(windowWidth, windowHeight); ns.clearLog();
		if (ns.gang.inGang()) {
			if (ns.args[1] === "metric") metricCheck(ns);
			let [myGang, allowClash] = [ns.gang.getGangInformation(), true]
			gangMemberAscension();

			const purchaseAllowed = ns.getBitNodeMultipliers().GangSoftcap > 0.8 || ns.args[0] === true // softcap over ride, call script with true as first args
			if (purchaseAllowed && ns.args[0] !== false) equipmentcheck();
			else if (getDiscount() > 0.5 && ns.args[0] !== false) equipmentcheck(); // try to buy equipment if discount is good enough

			myGang.territory < 1 ? tickCheck(allowClash, myGang) : tick.tw = false
			if (myGang.territory >= 1) ns.gang.setTerritoryWarfare(false); // not really needed just added for personal pref, to catch if war is still engaged after 100%
			if (!tick.tw) gangMemberStuff();
			printInfo();
		} else {
			ns.print(`Current Karma: ${format(ns.heart.break())}`)
			ns.singularity.joinFaction(faction);
			ns.gang.createGang(faction);
		}
		await ns.sleep(500);
	}

	function tickCheck(allowClash, myGang) {
		// *** Territory warfaire *** credit: Sin from the Discord. I modified their detect tick method into a function to work with my script.
		// Detect new tick
		const [otherGangsInfo, members] = [ns.gang.getOtherGangInformation(), ns.gang.getMemberNames()];
		let newTick = false;
		for (let i = 0; i < Object.keys(otherGangsInfo).length; i++) {
			const gangName = Object.keys(otherGangsInfo)[i];
			if (gangName == myGang.faction) continue;

			if (ns.gang.getChanceToWinClash(gangName) < 0.55)
				allowClash = false;

			const gi = Object.values(otherGangsInfo)[i],
				ogi = tick.otherGangsInfoPrevCycle ? Object.values(tick.otherGangsInfoPrevCycle)[i] : gi;

			const powerChanged = gi.power != ogi.power,
				territoryChanged = gi.territory != ogi.territory,
				changed = powerChanged || territoryChanged;

			if (changed) {
				newTick = true;
			}
		}

		// If we're in a new tick, take note of when next one is going to happen
		if (newTick) {
			ns.print('WARN: -- NEW TICK DETECTED --');
			tick.nextTick = Date.now() + 19000;
		}

		// Assign members to territory warfare
		if (tick.nextTick != undefined && Date.now() + 500 > tick.nextTick) {
			ns.print('WARN: Assigning all members to territory warfare');
			for (const member of members) {
				if (allowClash && ns.gang.getMemberInformation(member).def < 600) {
					ns.print(`${colorPicker(namSpa(member), "white")} avoided war for saftey.`);
					printMemberStats(ns.gang.getMemberInformation(member));
					continue;
				}
				ns.gang.setMemberTask(member, 'Territory Warfare');
				ns.print(`${colorPicker(namSpa(member), "white")} task: ${colorPicker("Territory Warfare", "white")}.`);
				printMemberStats(ns.gang.getMemberInformation(member));
				tick.tw = true
			}
		} else { tick.tw = false }

		tick.otherGangsInfoPrevCycle = otherGangsInfo;
		ns.gang.setTerritoryWarfare(allowClash && myGang.territory < 1);
	}

	function gangMemberAscension() {
		const squadInfo = []
		for (const member of ns.gang.getMemberNames()) squadInfo.push(ns.gang.getMemberInformation(member));
		squadInfo.sort((a, b) => a.str_asc_mult > b.str_asc_mult ? 1 : -1);
		for (const member of squadInfo) {
			const [ganginfo, ascensionInfo] = [ns.gang.getGangInformation(), ns.gang.getAscensionResult(member.name)]
			if (ascensionInfo === undefined) continue; // if cannot ascend skip
			ganginfo.respect -= ascensionInfo.respect // remove amount that would be lost from amount of respect the gang has
			if (1 - ns.formulas.gang.wantedPenalty(ganginfo) > wantedPenThresh) continue; // skip if penalty after ascension is too high
			if (ascensionInfo.str > calculateAscendTreshold(member.name, "str_asc_mult")
				|| ascensionInfo.def > calculateAscendTreshold(member.name, "def_asc_mult")
				|| ascensionInfo.dex > calculateAscendTreshold(member.name, "dex_asc_mult")
				|| ascensionInfo.agi > calculateAscendTreshold(member.name, "agi_asc_mult")) {
				if (ns.gang.ascendMember(member.name)) {
					ns.print(`Gang Member: ${member.name} Ascended.`);
					break; // break on ascension to force 1 ascension per call
				}
			}
		}
	}

	function equipmentcheck() {
		let squadInfo = []
		for (const member of ns.gang.getMemberNames()) {
			squadInfo.push(ns.gang.getMemberInformation(member));
		}
		squadInfo.sort((a, b) => (a.str_asc_mult > b.str_asc_mult) ? 1 : -1);
		for (const member of squadInfo) {
			const ofInterest = ns.gang.getEquipmentNames().filter(n => !member.upgrades.includes(n));
			const equipmentToGet = []
			for (const x of ofInterest) {
				const alwaysWanted = ns.gang.getEquipmentStats(x).str > 0 || ns.gang.getEquipmentStats(x).def > 0 || ns.gang.getEquipmentStats(x).dex > 0 || ns.gang.getEquipmentStats(x).agi > 0
				const cheapEnough = getDiscount() > discountThresh
				if (alwaysWanted || cheapEnough) {
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
			equipmentToGet.sort((a, b) => b.agi - a.agi || b.dex - a.dex || b.def - a.def); // experimental sorting agi -> dex -> def -> rest in most to least fashion
			//equipmentToGet.sort((a, b) => (a.str < b.str) ? 1 : -1); // recently added to make str gear bought first
			for (const y of equipmentToGet) {
				if (ns.getPlayer().money > ns.gang.getEquipmentCost(y.name) && ns.gang.purchaseEquipment(member.name, y.name)) {
					ns.print(`Gang member: ${member.name} purchased: ${y.name}.`);
				}
			}
		}
	}

	function gangMemberStuff() {
		const targetValue = 100 // amount each stat will be trained up to. Recently changed to work more like a weight to use against ascension multiplier
		while (ns.gang.canRecruitMember()) {
			const gangsterNames = names.filter(name => !ns.gang.getMemberNames().includes(name));
			const name = gangsterNames[Math.floor(Math.random() * (gangsterNames.length - 0) + 0)]
			ns.gang.recruitMember(name);
			ns.print(`${name} has been recruited.`);
			ns.tprint(`${name} has joined the gang!!`);
		}
		for (const name of ns.gang.getMemberNames()) {
			let arrayTaskObjects = []
			let myGang = ns.gang.getGangInformation();
			const memberInfo = ns.gang.getMemberInformation(name);
			const statCheck = memberInfo.str < targetValue * memberInfo.str_asc_mult || memberInfo.def < targetValue * memberInfo.def_asc_mult || memberInfo.dex < targetValue * memberInfo.dex_asc_mult || memberInfo.agi < targetValue * memberInfo.agi_asc_mult
			if (statCheck && 1 - myGang.wantedPenalty < wantedPenThresh) {
				ns.gang.setMemberTask(memberInfo.name, "Train Combat");
				ns.print(`${colorPicker(namSpa(memberInfo.name), "white")} task: ${colorPicker("Train Combat", "white")}.`);
				printMemberStats(memberInfo);
				continue;
			}

			for (const task of ns.gang.getTaskNames()) {
				const dontWant = ["Territory Warfare", "Vigilante Justice", "Train Hacking", "Train Charisma", "Ethical Hacking"]
				if (dontWant.includes(task)) continue;
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

			myGang.respect < 2e6 || 1 - ns.gang.getGangInformation().wantedPenalty > wantedPenThresh ? arrayTaskObjects.sort((a, b) => (a.respGain < b.respGain) ? 1 : -1) : arrayTaskObjects.sort((a, b) => (a.moneGain < b.moneGain) ? 1 : -1);

			const canFight = myGang.territoryClashChance == 0 || memberInfo.def > 600
			if (ns.gang.getBonusTime() > 5000 && canFight && myGang.territory < 1) {
				ns.gang.setMemberTask(name, "Territory Warfare");
				ns.print(`${colorPicker(namSpa(name), "white")} task: ${colorPicker("Territory Warfare", "white")}`);
				printMemberStats(memberInfo)
			} else {
				for (const x of arrayTaskObjects) {
					if (x.respGain < x.wantGain * 99) continue; // old value 99
					ns.gang.setMemberTask(name, x.name);
					ns.print(`${colorPicker(namSpa(name), "white")} task: ${colorPicker(x.name, "white")}`);
					printMemberStats(memberInfo)
					break;
				}
			}
		}
	}

	function namSpa(name) {
		let len = 1
		names.forEach(name => {
			if (name.length > len) len = name.length
		});
		if (name.toString().length < len) name = name + " ".repeat(len - name.toString().length);
		return name.toString();
	}

	function printMemberStats(memberInfo) {
		ns.print(`┣STR: ${colorPicker(format(memberInfo.str).padStart(8, " "), "white")} ┣DEF: ${colorPicker(format(memberInfo.def).padStart(8, " "), "white")} ┣MON: ${colorPicker(format(memberInfo.moneyGain * 5).padStart(8, " "), "white")}`);
		ns.print(`┗DEX: ${colorPicker(format(memberInfo.dex).padStart(8, " "), "white")} ┗AGI: ${colorPicker(format(memberInfo.agi).padStart(8, " "), "white")} ┗RES: ${colorPicker(format(memberInfo.respectGain * 5).padStart(8, " "), "white")}`);
	}

	// Credit: Mysteyes. https://discord.com/channels/415207508303544321/415207923506216971/940379724214075442
	function calculateAscendTreshold(member, prop) {
		const mult = ns.gang.getMemberInformation(member)[prop];
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
		if (mult < 20) return 1.0591;
		return 1.04;
	}

	function getDiscount() {
		return 1 - (ns.gang.getEquipmentCost("Baseball Bat") / 1e6);
	}

	function printInfo() {
		//ns.print(`\n   *** GANG REPORT ***`);
		const myGang = ns.gang.getGangInformation();
		ns.gang.getBonusTime() > 5000 ? ns.print(colorPicker("***BONUS TIME***", 226)) : ns.print(" ");
		ns.print(`Faction name:       ${colorPicker(myGang.faction.padStart(27, " "), "white")}`);
		ns.print(`Faction Rep:        ${colorPicker(format(ns.singularity.getFactionRep(myGang.faction)).padStart(27, " "), "white")}`);
		ns.print(`Total Respect:      ${colorPicker(format(myGang.respect).padStart(27, " "), "white")}`);
		if (getRespectNeededToRecruitMember(ns.gang.getMemberNames()) > 0) {
			ns.print(`New Member at:      ${colorPicker((format(getRespectNeededToRecruitMember(ns.gang.getMemberNames())) + " resp").padStart(27, " "), "white")}`);
		}
		const discountColor = getDiscount() > discountThresh ? "green" : getDiscount() > 0.2 ? "white" : "red"
		ns.print(`Equip Discount:     ${colorPicker(("-" + formatPercent(getDiscount(), 2)).padStart(27, " "), discountColor)}`);
		ns.print(`Wanted Level:       ${colorPicker(format(myGang.wantedLevel).padStart(27, " "), "white")}`);
		const wantedPenColor = 1 - myGang.wantedPenalty < wantedPenThresh ? "green" : 1 - myGang.wantedPenalty < 0.5 ? "white" : "red"
		ns.print(`Wanted Penalty:     ${colorPicker(("-" + formatPercent(1 - myGang.wantedPenalty, 2)).padStart(27, " "), wantedPenColor)}`);
		ns.print(`Money gain rate:    ${colorPicker((format(myGang.moneyGainRate * 5) + " /s").padStart(27, " "), "white")}`);
		ns.print(`Is war allowed?:    ${colorPicker((myGang.territoryWarfareEngaged).toString().padStart(27, " "), "white")}`);
		ns.print(`Territory Power:    ${colorPicker(format(myGang.power).padStart(27, " "), "white")}`);
		ns.print(`Min Win Chance:   ${bar(lowestClashChance(), "⚡", 20)}${colorPicker(formatPercent(lowestClashChance()).padStart(7, " "), "white")}`);
		ns.print(`Territory Owned:  ${bar(myGang.territory, "⚡", 20)}${colorPicker(formatPercent(myGang.territory).padStart(7, " "), "white")}`);
	}

	function getRespectNeededToRecruitMember(members) {
		// First N gang members are free (can be recruited at 0 respect)
		const numFreeMembers = 3;
		if (members.length < numFreeMembers || members.length > 11) return 0;

		const i = members.length - (numFreeMembers - 1);
		return Math.pow(5, i);
	}

	function lowestClashChance() {
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

	function reportMetrics(data, start = false) { // data is expected to be a single line string
		const file = "/gang_reports/metrics.txt"
		ns.write(file, new Date().toLocaleString() + ": Milestone - " + data + "\n", start === true ? "w" : "a");
	}

	function metricCheck() {
		if (!metricsFlags.gangMade) {
			reportMetrics(`Gang Created`, true);
			metricsFlags.gangMade = true
		}
		if (ns.gang.getGangInformation().territoryWarfareEngaged && !metricsFlags.warfareEnganged) {
			reportMetrics(`Territory Warfare engaged`);
			metricsFlags.warfareEnganged = true
		}
		if (ns.gang.getGangInformation().territory >= 0.2 && !metricsFlags.t20) {
			reportMetrics(`20% territory owned`);
			metricsFlags.t20 = true
		}
		if (ns.gang.getGangInformation().territory >= 0.3 && !metricsFlags.t30) {
			reportMetrics(`30% territory owned`);
			metricsFlags.t30 = true
		}
		if (ns.gang.getGangInformation().territory >= 0.4 && !metricsFlags.t40) {
			reportMetrics(`40% territory owned`);
			metricsFlags.t40 = true
		}
		if (ns.gang.getGangInformation().territory >= 0.5 && !metricsFlags.halfTerritory) {
			reportMetrics(`50% territory owned`);
			metricsFlags.halfTerritory = true
		}
		if (ns.gang.getGangInformation().territory >= 0.6 && !metricsFlags.t60) {
			reportMetrics(`60% territory owned`);
			metricsFlags.t60 = true
		}
		if (ns.gang.getGangInformation().territory >= 0.7 && !metricsFlags.t70) {
			reportMetrics(`70% territory owned`);
			metricsFlags.t70 = true
		}
		if (ns.gang.getGangInformation().territory >= 0.8 && !metricsFlags.t80) {
			reportMetrics(`80% territory owned`);
			metricsFlags.t80 = true
		}
		if (ns.gang.getGangInformation().territory >= 0.9 && !metricsFlags.t90) {
			reportMetrics(`90% territory owned`);
			metricsFlags.t90 = true
		}
		if (ns.gang.getGangInformation().territory === 1 && !metricsFlags.fullTerritory) {
			reportMetrics(`100% territory owned`);
			metricsFlags.fullTerritory = true
		}
		if (ns.gang.getMemberNames().length >= 1 && !metricsFlags.m1) {
			reportMetrics(`1st member recruited`);
			metricsFlags.m1 = true
		}
		if (ns.gang.getMemberNames().length >= 2 && !metricsFlags.m2) {
			reportMetrics(`2nd member recruited`);
			metricsFlags.m2 = true
		}
		if (ns.gang.getMemberNames().length >= 3 && !metricsFlags.m3) {
			reportMetrics(`3rd member recruited`);
			metricsFlags.m3 = true
		}
		if (ns.gang.getMemberNames().length >= 4 && !metricsFlags.m4) {
			reportMetrics(`4th member recruited`);
			metricsFlags.m4 = true
		}
		if (ns.gang.getMemberNames().length >= 5 && !metricsFlags.m5) {
			reportMetrics(`5th member recruited`);
			metricsFlags.m5 = true
		}
		if (ns.gang.getMemberNames().length >= 6 && !metricsFlags.m6) {
			reportMetrics(`6th member recruited`);
			metricsFlags.m6 = true
		}
		if (ns.gang.getMemberNames().length >= 7 && !metricsFlags.m7) {
			reportMetrics(`7th member recruited`);
			metricsFlags.m7 = true
		}
		if (ns.gang.getMemberNames().length >= 8 && !metricsFlags.m8) {
			reportMetrics(`8th member recruited`);
			metricsFlags.m8 = true
		}
		if (ns.gang.getMemberNames().length >= 9 && !metricsFlags.m9) {
			reportMetrics(`9th member recruited`);
			metricsFlags.m9 = true
		}
		if (ns.gang.getMemberNames().length >= 10 && !metricsFlags.m10) {
			reportMetrics(`10th member recruited`);
			metricsFlags.m10 = true
		}
		if (ns.gang.getMemberNames().length >= 11 && !metricsFlags.m11) {
			reportMetrics(`11th member recruited`);
			metricsFlags.m11 = true
		}
		if (ns.gang.getMemberNames().length === 12 && !metricsFlags.twelvthMember) {
			reportMetrics(`12th member recruited`);
			metricsFlags.twelvthMember = true
		}
		if (ns.gang.getGangInformation().moneyGainRate * 5 >= 1e6 && !metricsFlags.rateOneMill) {
			reportMetrics(`Gang money rate 1m /s`);
			metricsFlags.rateOneMill = true
		}
		if (ns.gang.getGangInformation().moneyGainRate * 5 >= 1e7 && !metricsFlags.rateTenMill) {
			reportMetrics(`Gang money rate 10m /s`);
			metricsFlags.rateTenMill = true
		}
		if (ns.gang.getGangInformation().moneyGainRate * 5 >= 1e8 && !metricsFlags.rateOneHundredMill) {
			reportMetrics(`Gang money rate 100m /s`);
			metricsFlags.rateOneHundredMill = true
		}
		if (ns.gang.getGangInformation().moneyGainRate * 5 >= 1e9 && !metricsFlags.rateOneBill) {
			reportMetrics(`Gang money rate 1b /s`);
			metricsFlags.rateOneBill = true
		}
		if (ns.gang.getGangInformation().moneyGainRate * 5 >= 1e10 && !metricsFlags.rateTenBill) {
			reportMetrics(`Gang money rate 10b /s`);
			metricsFlags.rateTenBill = true
		}
		if (ns.gang.getGangInformation().moneyGainRate * 5 >= 1e11 && !metricsFlags.rateOneHundredBill) {
			reportMetrics(`Gang money rate 100b /s`);
			metricsFlags.rateOneHundredBill = true
		}
	}
}

const metricsFlags = {
	gangMade: false,
	warfareEnganged: false,
	t20: false,
	t30: false,
	t40: false,
	halfTerritory: false,
	t60: false,
	t70: false,
	t80: false,
	t90: false,
	fullTerritory: false,
	m1: false,
	m2: false,
	m3: false,
	m4: false,
	m5: false,
	m6: false,
	m7: false,
	m8: false,
	m9: false,
	m10: false,
	m11: false,
	twelvthMember: false,
	rateOneMill: false,
	rateTenMill: false,
	rateOneHundredMill: false,
	rateOneBill: false,
	rateTenBill: false,
	rateOneHundredBill: false
}
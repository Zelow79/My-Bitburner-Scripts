/** @param {NS} ns */
export async function main(ns) {
	class Aug {
		/** @param {NS} ns */
		constructor(ns, augName, factionName) {
			this.augment = augName;
			this.faction = factionName;
			this.rep = ns.singularity.getAugmentationRepReq(this.augment);
			this.stats = ns.singularity.getAugmentationStats(this.augment);
			this.preReq = ns.singularity.getAugmentationPrereq(this.augment);
			this.baseCost = ns.singularity.getAugmentationBasePrice(this.augment);
			this.cost = () => ns.singularity.getAugmentationPrice(this.augment);
			this.updaterep = () => this.rep = ns.singularity.getAugmentationRepReq(this.augment);
			this.buyIt = () => ns.singularity.purchaseAugmentation(this.faction, this.augment)
				? ns.tprintRaw(React.createElement("span", { style: { color: "rgb(0,255,0)" } }, `${this.augment} was purchased from ${this.faction}.`))
				: ns.tprintRaw(React.createElement("span", { style: { color: "rgb(255, 0, 0)" } }, `⚠️ Failure: Could not purchase ${this.augment} from ${this.faction}.`));
		}
	}

	const mode = {
		["hacking"]: ns.args.includes("hacking") || ns.args.includes("hack") ? true : false, // a pool of augs that effect hacking
		["hacknet"]: ns.args.includes("hacknet") ? true : false, // augs that include hacknet cost/profits
		combat: ns.args.includes("combat") ? true : false, // combat stat augs str, def, dex, agi
		bb: ns.args.includes("bb") ? true : false, // bb augs analysis, max_stamina etc
		cha: ns.args.includes("cha") || ns.args.includes("charisma") ? true : false, // charisma
		comprep: ns.args.includes("company") || ns.args.includes("rep") ? true : false, // company reputation gain augs
		factionrep: ns.args.includes("faction") || ns.args.includes("rep") ? true : false, // faction rep gain and rep for both comp and faction
		["work"]: ns.args.includes("work") ? true : false, // work money gained
		nfg: ns.args.includes("nfg") ? true : false, // if NFG should be purchased or not
		["stanek"]: ns.args.includes("stanek") ? true : false, // if stanek should be purchased or not
		all: ns.args.includes("all") ? true : false, // will attempt from a pool of any augments
		donate: ns.args.includes("donate") ? true : false, // will donate to a faction when purchasing NFG
		cheap: ns.args.includes("cheap") ? true : false, // sort augs cheapest first *default is the most expensive first
		install: ns.args.includes("install") ? true : false // if true will perform install after aug purchases
	}, theGift = ["Stanek's Gift - Awakening", "Stanek's Gift - Serenity"], nfg = "NeuroFlux Governor", trp = "The Red Pill", augs = getChrome();

	if (mode.cheap) {
		augs.sort((a, b) => a.cost() - b.cost());
	} else {
		augs.sort((a, b) => b.cost() - a.cost()); // default sort with most expensive first
	}

	for (const o of augs) { // iterate the array for non-stanek or nfg augs and buy first come first serve
		const nameCheck = o.augment === nfg || o.augment === trp || theGift.includes(o.augment),
			costCheck = ns.getPlayer().money < o.cost() || o.rep > ns.singularity.getFactionRep(o.faction),
			didWeGetIt = ns.singularity.getOwnedAugmentations(true).includes(o.augment);
		if (nameCheck || costCheck || didWeGetIt) continue;
		preReqCheck(o.augment);
		o.buyIt();
	}

	if (mode.nfg || mode.all) { // only if nfg and/or all modes are enabled
		for (const o of augs) { // iterate the array again and buy up all the nfg I can
			if (o.augment === nfg) {
				let i = 0, purchased = 0, amtDonated = 0;
				while (ns.getPlayer().money > o.cost()) {
					if (i % 100 === 0) await ns.sleep(0);
					i++;
					if (mode.donate && ns.singularity.getFactionRep(o.faction) < o.rep) { //if mode.donate is on will donate to boost NFG count
						const amt = Math.floor(ns.getPlayer().money * 0.01); // 1% of money floored
						if (!ns.singularity.donateToFaction(o.faction, amt)) {
							ns.tprint("failed to doante");
							break;
						} else {
							amtDonated += amt;
							//ns.tprint(`Successfully donated ${amt} to ${o.faction}`) 
						};
						o.updaterep();
					}

					if (ns.singularity.purchaseAugmentation(o.faction, o.augment)) {
						purchased++;
					}
					o.updaterep();
				}
				if (amtDonated > 0) {
					ns.tprintRaw(React.createElement("span", { style: { color: "rgb(200, 200, 20)" } },
						`💸 \$${ns.formatNumber(amtDonated)} was donated to ${o.faction}.`));
				}
				if (purchased > 0) {
					ns.tprintRaw(React.createElement("span", { style: { color: "rgb(0, 255, 255)" } },
						`👾 ${purchased} level${purchased > 1 ? "s" : ""} of ${o.augment} purchased from ${o.faction}.`));
				}
			}
		}
	}

	if (mode["stanek"] || mode.all) { // only if stanek and/or all modes are enabled
		for (const o of augs) { // finally iterate the array one last time for Stanek augs
			if (theGift.includes(o.augment)) {
				if (ns.singularity.getFactionRep(o.faction) > o.rep) {
					preReqCheck(o.augment);
					if (ns.singularity.purchaseAugmentation(o.faction, o.augment)) {
						ns.tprintRaw(React.createElement("span", { style: { color: "rgb(173, 255, 47)" } }, `🙏 ${o.augment} was bestowed upon us praise our lord and savior!`));
					}
				}
			}
		}
	}

	for (const o of augs) { // finally iterate the array one last time for TRP
		if (o.augment === trp) {
			if (ns.singularity.getFactionRep(o.faction) > o.rep) {
				preReqCheck(o.augment);
				if (ns.singularity.purchaseAugmentation(o.faction, o.augment)) {
					ns.tprintRaw(React.createElement("span", { style: { color: "rgb(255, 0, 0)" } }, `💊 ${o.augment} has been taken! 💊`));
				}
			}
		}
	}

	if (mode.install) ns.singularity.installAugmentations(); // will install augments when true TODO: add callback script when ready

	function preReqCheck(augname) {
		const filteredPreReq = ns.singularity.getAugmentationPrereq(augname).filter(n => !ns.singularity.getOwnedAugmentations(true).includes(n));
		if (filteredPreReq.length > 0) {
			for (const y of filteredPreReq) {
				preReqCheck(y);
				if (ns.singularity.getOwnedAugmentations(true).includes(y)) continue;
				for (const a of augs) {
					if (a.augment === y && ns.singularity.purchaseAugmentation(a.faction, y)) ns.tprintRaw(React.createElement("span", { style: { color: "rgb(225, 255, 255)" } }, `${y} was purchased from ${a.faction}. -PreReq Purchase`));
				}
			}
		}
	}

	function getChrome() {
		const factions = ns.getPlayer().factions, augs = [];
		factions.sort((a, b) => ns.singularity.getFactionRep(b) - ns.singularity.getFactionRep(a)); // sort factions by highest to lowest rep

		if (factions.length === 0) {
			ns.tprintRaw(`You're not in any factions, terminating...`);
			return augs;
		}

		for (const faction of factions) {
			for (const aug of ns.singularity.getAugmentationsFromFaction(faction)) {
				const o = new Aug(ns, aug, faction);

				const bbwant = mode.bb && (o.stats.bladeburner_analysis > 1
					|| o.stats.bladeburner_max_stamina > 1
					|| o.stats.bladeburner_stamina_gain > 1
					|| o.stats.bladeburner_success_chance > 1),
					hackwant = mode["hacking"] && (o.stats["hacking"] > 1
						|| o.stats.hacking_chance > 1
						|| o.stats.hacking_exp > 1
						|| o.stats.hacking_speed > 1
						|| o.stats.hacking_money > 1
						|| o.stats.hacking_grow > 1),
					combatwant = mode.combat && (o.stats["strength"] > 1
						|| o.stats.strength_exp > 1
						|| o.stats["defense"] > 1
						|| o.stats.defense_exp > 1
						|| o.stats["dexterity"] > 1
						|| o.stats.dexterity_exp > 1
						|| o.stats["agility"] > 1
						|| o.stats.agility_exp > 1),
					chawant = mode.cha && (o.stats.charisma > 1
						|| o.stats.charisma_exp > 1),
					hacknetwant = mode["hacknet"] && (o.stats.hacknet_node_money > 1
						|| o.stats.hacknet_node_purchase_cost < 1
						|| o.stats.hacknet_node_ram_cost < 1
						|| o.stats.hacknet_node_level_cost < 1
						|| o.stats.hacknet_node_core_cost < 1),
					comprepwant = mode.comprep && o.stats.company_rep > 1,
					factionrepwant = mode.factionrep && o.stats.faction_rep > 1,
					workwant = mode["work"] && o.stats.work_money > 1;

				if (augs.some(temp => temp.augment === aug) || (aug !== nfg && ns.singularity.getOwnedAugmentations(true).some(t => t === aug))) continue;
				if (mode.all || o.augment === trp || bbwant || hackwant || combatwant || chawant || hacknetwant || comprepwant || factionrepwant || workwant) augs.push(o);
			}
		}
		return augs;
	}
}
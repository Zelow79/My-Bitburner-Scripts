import { hms, format } from "ze-lib";
/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep"); ns.clearLog(); ns.tail(); ns.resizeTail(450, 200);
	const mode = {
		["hacking"]: ns.args.includes("hacking") || ns.args.includes("hack") ? true : false, // a pool of augs that effect hacking
		["hacknet"]: ns.args.includes("hacknet") ? true : false, // augs that include hacknet cost/profits
		combat: ns.args.includes("combat") ? true : false, // combat stat augs str, def, dex, agi
		bb: ns.args.includes("bb") ? true : false, // bb augs analysis, max_stamina etc
		cha: ns.args.includes("cha") || ns.args.includes("charisma") ? true : false, // charisma
		comprep: ns.args.includes("company") || ns.args.includes("rep") ? true : false, // company reputation gain augs
		factionrep: ns.args.includes("faction") || ns.args.includes("rep") ? true : false, // faction rep gain and rep for both comp and faction
		["work"]: ns.args.includes("work") ? true : false, // work money gained
		all: ns.args.includes("all") ? true : false, // will attempt from a pool of any augments
		fast: ns.args.includes("fast") ? true : false, // sort augs fastest first *try to only use one sort at a time
		cheap: ns.args.includes("cheap") ? true : false, // sort augs cheapest first *default is the most expensive first
		["super"]: ns.args.includes("super") ? true : false // super mode is intended to take priority over other tasks
	}

	while (1) {
		await ns.sleep(0); // Safety sleep
		const priority = ["Neuroreceptor Management Implant", "The Blade's Simulacrum", "nickofolas Congruity Implant"],
			remaining = [];

		for (const aug of priority) {
			if (aug === "The Blade's Simulacrum") { // check for Bladeburners faction or mode before allowing Simulacrum
				if (!mode.bb || !ns.getPlayer().factions.includes("Bladeburners")) continue;
			}
			if (!ns.singularity.getOwnedAugmentations(true).includes(aug)) remaining.push(aug);
		}

		const start = performance.now();
		while (ns.singularity.getCurrentWork() !== null) { // basically sleep until idle
			ns.clearLog();
			if (ns.singularity.getCurrentWork().type === "GRAFTING") {
				const task = ns.singularity.getCurrentWork(),
					graftTime = ns.grafting.getAugmentationGraftTime(task.augmentation),
					pool = getCrackAugs();
				ns.printRaw("Current Task Type:  " + task.type); // if current task is grafting display some information
				ns.printRaw("Augment Grafting:   " + task.augmentation);
				ns.printRaw("Grafting Time:      " + hms(Math.ceil(graftTime)));
				ns.printRaw("Time Left:          " + hms(Math.ceil(graftTime - task.cyclesWorked * 200)));
				ns.printRaw("Time Progress:      " + hms(task.cyclesWorked * 200));
				ns.printRaw("Cycles Worked:      " + task.cyclesWorked);
				ns.printRaw("Augments in Pool:   " + format(pool.length, 2));
				let poolcost = 0, pooltime = 0;
				pool.forEach(o => {
					poolcost += o.cost;
					pooltime += o.graftTime;
				});
				ns.printRaw("Total cost of Pool: \$" + format(poolcost, 2));
				ns.printRaw("Total time of Pool: " + hms(pooltime));
			} else {
				ns.printRaw("Current Task Type: " + ns.singularity.getCurrentWork().type); // information for tasks that aren't grafting
				ns.print("Not Grafting for " + (Math.floor(performance.now() - start)) + " ms");
				if (mode["super"]) ns.singularity.stopAction(); // stop current task so we can start grafting when super mode is on
			}
			await ns.sleep(1000);
		}

		if (remaining.length === 0) {
			//code for rest of graftables
			ns.clearLog();
			ns.printRaw("All priority augments already installed or grafted.");
			const graftableAugs = getCrackAugs();
			ns.printRaw(graftableAugs.length + " graftable augs remain.");

			if (graftableAugs.length > 0) {
				for (const aug of graftableAugs) {
					if (ns.getPlayer().money > aug.cost) {
						ns.tprintRaw(`Grafting ${aug.name} for \$${format(aug.cost, 2)} and will take ${hms(Math.ceil(aug.graftTime))}`);
						ns.grafting.graftAugmentation(aug.name, !ns.singularity.getOwnedAugmentations(false).includes("Neuroreceptor Management Implant"));
						break;
					}
				}
			} else {
				ns.printRaw(`No more Augments in pool.`);
				ns.printRaw(`Terminating...`);
				ns.exit();
			}
		} else {
			if (ns.getPlayer().money > ns.grafting.getAugmentationGraftPrice(remaining[0])) {
				ns.grafting.graftAugmentation(remaining[0], !ns.singularity.getOwnedAugmentations(false).includes("Neuroreceptor Management Implant"));
			} else {
				ns.printRaw(`Not enough money to graft ${remaining[0]} Cost: \$${format(ns.grafting.getAugmentationGraftPrice(remaining[0]), 2)}`);
				ns.printRaw(`Terminating...`);
				ns.exit();
			}
		}
	}

	function getCrackAugs(graftableAugs = ns.grafting.getGraftableAugmentations()) {
		const chosen = [];
		for (const a of graftableAugs) {
			const preReqs = ns.singularity.getAugmentationPrereq(a);
			if (preReqs.length > 0) { // check if there is preReqs for the aug
				const actuallyNeed = []; // create container for augs we really need
				for (const p of preReqs) { // iterate list of potential augs needed
					if (ns.singularity.getOwnedAugmentations(true).includes(p)) continue; // skip if we got it
					actuallyNeed.push(p); // push aug into actuallyNeed 
				}
				if (actuallyNeed.length > 0) continue; // skip a if preReqs are still needed
			}

			const o = {
				name: a,
				cost: ns.grafting.getAugmentationGraftPrice(a),
				stats: ns.singularity.getAugmentationStats(a),
				graftTime: ns.grafting.getAugmentationGraftTime(a),
				preReqs: ns.singularity.getAugmentationPrereq(a)
			}

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

			if (mode.all || bbwant || hackwant || combatwant || chawant || hacknetwant || comprepwant || factionrepwant || workwant) chosen.push(o);
		}

		if (mode.cheap) {
			chosen.sort((a, b) => a.cost - b.cost); // if cheap mode is on, sort by cheapest first
		} else if (mode.fast) {
			chosen.sort((a, b) => a.graftTime - b.graftTime); // if fast mode is on shortest time first
		} else {
			chosen.sort((a, b) => b.cost - a.cost); // most expensive first by default
		}
		return chosen;
	}
}
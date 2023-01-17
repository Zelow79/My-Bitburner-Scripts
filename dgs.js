import { getAllServers } from "ze-lib.js";
/** @param {NS} ns */
export async function main(ns) {
	for (const faction of ns.singularity.checkFactionInvitations()) {
		ns.singularity.joinFaction(faction);
	}

	const mostFavorable = []
	for (const faction of ns.getPlayer().factions) {
		mostFavorable.push({
			name: faction,
			favor: ns.singularity.getFactionFavor(faction)
		});
	}

	mostFavorable.sort((a, b) => b.favor - a.favor);
	ns.corporation.bribe(mostFavorable[0].name, ns.corporation.getCorporation().funds);
	while (ns.getPlayer().money < ns.corporation.getCorporation().dividendEarnings) await ns.sleep(0);
	await getSomeNFG(ns); //purchases NFG with remaining money
	ns.tprint('Jobs done.');
	for (const server of getAllServers(ns)) ns.killall(server, true);
	await ns.sleep(500);
	ns.singularity.installAugmentations('dgs.js'); //start ai script after install
}

async function getSomeNFG(ns) {
	const nfg = 'NeuroFlux Governor'
	const factions = []
	for (const faction of ns.getPlayer().factions) { //creates a list of joined factions
		const obj = {
			name: faction,
			factionRep: ns.singularity.getFactionRep(faction)
		}
		factions.push(obj);
	}
	factions.sort((a, b) => (b.factionRep - a.factionRep)); //sorts the list with highest rep first

	for (const x of factions) {
		if (!ns.singularity.getAugmentationsFromFaction(x.name).includes(nfg)) continue; //skip if faction doesn't sell NFG
		let i = 1 //NFG purchase starting count
		while (ns.getPlayer().money > ns.singularity.getAugmentationPrice(nfg)) { //attempt buying NFG as long we have money
			if (ns.singularity.getFactionRep(x.name) < ns.singularity.getAugmentationRepReq(nfg)) await donateNeeded(x.name, nfg, ns.getPlayer().money * 0.1);
			if (ns.singularity.getFactionRep(x.name) < ns.singularity.getAugmentationRepReq(nfg)) break; //stop if repCost too high
			if (ns.singularity.purchaseAugmentation(x.name, nfg)) { //attempt actual purchase of NFG
				ns.tprint(`SUCCESS: NFG bought ${i} times`); //if successful tprint result with purchase count
				i++ //inc NFG purchase count
			}
			await ns.sleep(0); //this is actually required when buying thousands or the game freezes
		}
		break; //when we get this far kill function, jobs done
	}

	async function donateNeeded(faction, nfg, amt = 1000) {
		while (ns.getPlayer().money > amt && ns.singularity.getFactionRep(faction) < ns.singularity.getAugmentationRepReq(nfg)) {
			ns.singularity.donateToFaction(faction, amt);
			ns.tprint(`donated to ${faction} costing ${amt}`)
			await ns.sleep(20);
		}
	}
}
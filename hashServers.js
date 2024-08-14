/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	if (ns.args.includes("tail")) ns.tail();
	const h = ns.hacknet;
	while (1) {
		ns.clearLog();
		const servers = [],
			serversInfo = [],
			// default max values if not changed when called in args
			max = { servers: 10, ram: 8192, cores: 32, cache: 1, levels: 100, unit_level: 20 }

		for (const arrrg of ns.args) { // check args for new max values
			if (typeof arrrg === "string"
				&& arrrg.includes(":")
				&& max[arrrg.split(":")[0]] // if first value is a property on max
				&& !isNaN(parseInt(arrrg.split(":")[1]))) { // and a number
				max[arrrg.split(":")[0]] = parseInt(arrrg.split(":")[1]); // set that property to new nummber
			}
		}

		const cutoff = Math.min(max.servers, h.maxNumNodes()), // cut off for if script should purchase new servers
			checkLevels = () => servers.map(s => h.getNodeStats(s)).reduce((c, a) => c + a.level, 0); // get total server levels

		if (h.numNodes() < cutoff) h.purchaseNode(); // if server count below cutoff try to buy new server

		for (let i = 0; i < h.numNodes(); i++) { // iterate servers and apply upgrades
			let stats = h.getNodeStats(i);
			if (stats.ram < max.ram) h.upgradeRam(i); // upgrade ram
			if (stats.cores < max.cores) h.upgradeCore(i); // upgrade cores
			if (stats.cache < max.cache) h.upgradeCache(i);// upgrade cache
			stats = h.getNodeStats(i); // update stats 
			servers.push(i);
			serversInfo.push({ index: i, ...stats });
		}

		if (checkLevels() < max.levels) { // upgrade level until total is 100
			for (const server of serversInfo) {
				if (checkLevels() >= max.levels) continue; // skip if total max level achieved
				if (server.level < max.unit_level) h.upgradeLevel(server.index); // skip if individual level achieved
			}
		}

		const check = {
			node: h.numNodes() >= cutoff,
			ram: servers.every(s => h.getNodeStats(s).ram >= max.ram),
			core: servers.every(s => h.getNodeStats(s).cores >= max.cores),
			cache: servers.every(s => h.getNodeStats(s).cache >= max.cache),
			level: checkLevels() >= max.levels
		}

		ns.print("Active servers: " + servers.length + "/" + cutoff);
		ns.print("Total level:    " + checkLevels())
		ns.print("Cap Values:     " + JSON.stringify(max));
		ns.print("Caps Reached:   " + JSON.stringify(check));
		for (const server of serversInfo) {
			ns.print(`-${server.name
				}: Level: ${server.level.toString().padStart(3, " ")
				} -- Ram: ${ns.formatRam(server.ram).padStart(6, " ")
				} -- Cores: ${server.cores.toString().padStart(3, " ")
				} -- Cache: ${server.cache.toString().padStart(2, " ")}`);
		}

		if (check.node && check.level && check.ram && check.core && check.cache) {
			ns.print("Jobs Done"); // kill script if we complete all our goals
			ns.exit();
		}
		await ns.sleep(500);
	}
}
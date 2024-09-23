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
				&& !isNaN(parseInt(arrrg.split(":")[1]))) { // and a number is the 2nd value
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
			ram: servers.every(s => [8192, max.ram].some(option => h.getNodeStats(s).ram >= option)),
			core: servers.every(s => [128, max.cores].some(option => h.getNodeStats(s).cores >= option)),
			cache: servers.every(s => [15, max.cache].some(option => h.getNodeStats(s).cache >= option)),
			level: checkLevels() >= max.levels
		}

		// max length of server stat values for print padding
		let maxLen = { serverName: 0, level: 0, ram: 0, cores: 0, cache: 0 }
		for (const server of serversInfo) {
			if (maxLen.serverName < server.name.length) maxLen.serverName = server.name.length;
			if (maxLen.level < server.level.toString().length) maxLen.level = server.level.toString().length;
			if (maxLen.ram < ns.formatRam(server.ram).length) maxLen.ram = ns.formatRam(server.ram).length;
			if (maxLen.cores < server.cores.toString().length) maxLen.cores = server.cores.toString().length;
			if (maxLen.cache < server.cache.toString().length) maxLen.cache = server.cache.toString().length;
		}

		ns.print("Active servers: " + servers.length + "/" + cutoff);
		ns.print("Total level:    " + checkLevels())
		ns.print("Cap Values:     " + JSON.stringify(max));
		ns.print("Caps Reached:   " + JSON.stringify(check));
		for (const server of serversInfo) {
			ns.print(`-${(server.name + ":").padEnd(maxLen.serverName + 1, " ")
				} Level: ${server.level.toString().padStart(maxLen.level, " ")
				} -- Ram: ${ns.formatRam(server.ram).padStart(maxLen.ram, " ")
				} -- Cores: ${server.cores.toString().padStart(maxLen.cores, " ")
				} -- Cache: ${server.cache.toString().padStart(maxLen.cache, " ")}`);
		}

		if (check.node && check.level && check.ram && check.core && check.cache) {
			ns.print("Jobs Done"); // kill script if we complete all our goals
			ns.exit();
		}
		await ns.sleep(500);
	}
}
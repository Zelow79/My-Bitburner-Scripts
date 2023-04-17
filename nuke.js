export const main = async (ns) => {
	const target = ns.args[0] ?? "n00dles",
		cracks = [{ name: "BruteSSH", doIt: () => ns.brutessh(target) }, { name: "FTPCrack", doIt: () => ns.ftpcrack(target) },
		{ name: "relaySMTP", doIt: () => ns.relaysmtp(target) }, { name: "HTTPWorm", doIt: () => ns.httpworm(target) },
		{ name: "SQLInject", doIt: () => ns.sqlinject(target) }],
		cracker = (crack) => ns.singularity.purchaseTor() ? ns.singularity.purchaseProgram(crack) : null;
	cracks.forEach(crack => { cracker(crack.name + ".exe"); if (ns.ls("home").includes(crack.name + ".exe")) crack.doIt(); });
	try { ns.nuke(target); } catch { ns.print(`nuke failed on ${target}.`); }
}
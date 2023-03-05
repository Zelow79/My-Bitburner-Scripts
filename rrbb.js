export async function main(ns) {
	const folder = "bladeburner_reports"; const files = ns.ls(ns.getHostname(), folder + "/");
	ns.print(`/${ns.getHostname()}/${folder}/ - ${files.length} file${files.length !== 1 ? "s" : ""} found.`);
	if (files.length > 0) ns.alert(ns.read(await ns.prompt("Select File", { type: "select", choices: files })));
	else ns.alert(`There are no files inside ${folder}`);
}
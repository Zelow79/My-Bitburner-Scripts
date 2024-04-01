import { tableMaker, format, getAllServers } from "ze-lib";
/** @param {NS} ns */
export async function main(ns) {
	const content = [], inject = (data, style) => React.createElement("div", { style }, data),
		target = ns.args[0] ?? await ns.prompt("Select Server", { type: "select", choices: getAllServers(ns) });
	ns.clearLog(); ns.tail(); ns.resizeTail(620, 450);

	for (const [key, value] of Object.entries(ns.getServer(target))) {
		if (value === null || value === undefined) continue;
		content.push(inject(key.toString(), { color: "white", "text-align": "right" }));
		content.push(inject(typeof value === "number" ? format(value) : String(value), { color: "white", "text-align": "center" }));
	}

	ns.printRaw(React.createElement("div", { style: { width: "600px" } }, React.createElement("img", { style: { margin: "auto", display: "block", width: "50%" }, src: "https://raw.githubusercontent.com/Zelow79/My-Bitburner-Scripts/main/resources/vegeta-scouter.gif" })));
	ns.printRaw(tableMaker(content, 4, { style: { border: "1px solid white", "border-collapse": "collapse", width: "600px" } }, { style: { border: "1px solid white" } }));
}
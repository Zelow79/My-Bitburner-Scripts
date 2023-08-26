import { cipher } from "ze-lib";
/** @param {NS} ns */
export async function main(ns) {
	if (ns.args.length != 1 && ns.args.length != 2) { //need to provide script with 1 to 2 args or receive help message
		ns.tprintRaw(React.createElement("span", { style: { color: "red" } }, 'Usage: run cipher.js "word to be ciphered" "[array of codes?]"'));
		ns.exit();
	}

	let code = typeof ns.args[1] === "string" ? JSON.parse(ns.args[1]) :
		ns.args[1] ?? [34, 19, 57, 88, 20, 81, 66, 44, 101, 29]; //needs an array of 1 or more codes
	ns.tprintRaw([React.createElement("span", { style: { color: "white" } }, "Encrypted: "),
	React.createElement("span", { style: { color: "lightblue" } }, cipher(ns.args[0], code))]); //print encrypted code
}
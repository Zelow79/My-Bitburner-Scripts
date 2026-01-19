/** @param {NS} ns */
export async function main(ns) {
  let files = ns.ls("home", "dnet/");

  if (ns.ls("darkweb", "dnet/").includes("dnet/victims.txt")) {
    files = ns.ls("home", "dnet/").filter(e => e !== "dnet/victims.txt");
  }

  //ns.tprint(files);
  files.push("ports.js");
  ns.scp(files, "darkweb");
  ns.exec("dnet/controller.js", "darkweb");
}
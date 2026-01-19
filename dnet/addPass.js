import { ports } from "ports.js";
/** @param {NS} ns */
export async function main(ns) {
  ns.getPortHandle(ports["dnetAddPw"]).write(JSON.stringify({
      name: ns.args[0],
      password: ns.args[1]
    }));
}
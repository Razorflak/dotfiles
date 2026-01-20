import { execSync } from "node:child_process";

export const getDefaultBranch = () => {
  const r = execSync("git remote show origin", {
    encoding: "utf8",
  })
    .split("\n")
    .find((line) => line.includes("HEAD branch"))
    ?.trim()
    .split(" ")
    .pop();

  if (!r) {
    throw new Error(
      "Impossible de déterminer la branche principale (HEAD branch)",
    );
  }
  return r;
};

#!/usr/bin/env node

import { execSync } from "child_process";
import enquirer from "enquirer";
import path from "path";
import "./utils/exit.js";
import { isWorktreeRepo } from "./utils/check-is-worktree-repo.js";
import { getDefaultBranch } from "./utils/get-main-branch.js";

const { prompt } = enquirer;

isWorktreeRepo();
console.log(process.cwd());
// Déterminer la branche principale du dépôt
let defaultBranch = getDefaultBranch();

// Récupérer la liste des worktrees
const worktreesRaw = execSync("git worktree list")
  .toString()
  .trim()
  .split("\n");
const worktrees = [];
const nameToPathMap = new Map();
const branchMap = new Map();

worktreesRaw.forEach((line) => {
  const match = line.match(/^(.*?)\s+.*\[(.*?)]$/);
  if (!match) return;

  const repoPath = path.relative(process.cwd(), match[1]);
  const branchInfo = match[2];

  if (
    branchInfo.startsWith("detached") ||
    branchInfo.startsWith("bare") ||
    branchInfo === defaultBranch
  ) {
    return;
  }

  let merged = false;

  // 1 Test historique strict
  try {
    execSync(
      `git -C "${repoPath}" merge-base --is-ancestor ${branchInfo} ${defaultBranch}`,
      { stdio: "ignore" },
    );
    merged = true;
  } catch {
    // 2 Fallback squash / rebase / cherry-pick
    try {
      const cherryOutput = execSync(
        `git -C "${repoPath}" cherry ${defaultBranch} ${branchInfo}`,
        { encoding: "utf8" },
      ).trim();

      // Si AUCUN '+' => contenu déjà présent
      if (
        cherryOutput !== "" &&
        !cherryOutput.split("\n").some((l) => l.startsWith("+"))
      ) {
        merged = true;
      }
    } catch {
      // ignore
    }
  }

  let lastCommitDate = "";
  try {
    lastCommitDate = execSync(
      `git -C "${repoPath}" log -1 --format="%cd" --date=short ${branchInfo}`,
      { encoding: "utf8" },
    ).trim();
  } catch {
    lastCommitDate = "unknown";
  }

  const name = `${repoPath} (${branchInfo}) (Last commit: ${lastCommitDate}) ${merged ? "✅" : "❌"}`;

  worktrees.push({
    name,
    path: repoPath,
    branch: branchInfo,
    merged,
  });

  nameToPathMap.set(name, repoPath);
  branchMap.set(repoPath, branchInfo);
});

if (worktrees.length === 0) {
  console.log("Aucun worktree à traiter.");
  process.exit(0);
}

(async () => {
  const response = await prompt({
    type: "multiselect",
    name: "selectedWorktrees",
    message: `Sélectionnez les worktrees à supprimer :
Par défaut, les worktrees fusionnés sont pré-sélectionnés. (A peu près, car la détection n'est pas parfaite)

("a" pour tout sélectionner, "i" pour inverser la sélection, "entrée" pour valider) `,
    initial: worktrees.filter((w) => w.merged).map((w) => w.name),
    choices: worktrees.map((wt) => ({
      name: wt.name,
      value: wt.name,
      disabled: false,
    })),
    h() {
      return this.left();
    },
    j() {
      return this.down();
    },
    k() {
      return this.up();
    },
    l() {
      return this.right();
    },
  });

  if (!response.selectedWorktrees.length) {
    console.log("Aucune suppression effectuée.");
    process.exit(0);
  }

  // Supprimer les worktrees et leurs branches associées
  response.selectedWorktrees.forEach((name) => {
    const worktree = nameToPathMap.get(name);
    const branch = branchMap.get(worktree);
    console.log(`Suppression de ${worktree}...`);
    execSync(`git worktree remove "${worktree}" --force`);
    console.log(`${worktree} supprimé.`);

    try {
      execSync(`git branch -d "${branch}"`, { stdio: "ignore" });
      console.log(`Branche locale ${branch} supprimée.`);
    } catch (error) {
      console.log(
        `Impossible de supprimer la branche locale ${branch}. Peut-être n'existe-t-elle pas ou n'est-elle pas complètement fusionnée ?`,
      );
    }
  });

  console.log("Opération terminée.");
})();

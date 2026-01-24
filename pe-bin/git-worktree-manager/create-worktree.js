#!/usr/bin/env node

import { execSync } from "child_process";
import inquirer from "inquirer";
import autocomplete from "inquirer-autocomplete-standalone";
import path from "path";
import "./utils/exit.js";
import { getDefaultBranch } from "./utils/get-main-branch.js";
import { isWorktreeRepo } from "./utils/check-is-worktree-repo.js";

isWorktreeRepo();
inquirer.registerPrompt("autocomplete", autocomplete);

const baseBranch = getDefaultBranch();
const newBranchOption = "__New_Branch__";
const cliBranchName = process.argv[2];

function fetchBranches() {
  console.log("Fetching all branches...");
  execSync("git fetch --all", { stdio: "inherit" });

  try {
    return execSync("git branch -r", { encoding: "utf8" })
      .split("\n")
      .map((branch) => branch.trim())
      .filter((branch) => branch && !branch.startsWith("origin/HEAD"));
  } catch {
    console.error("Erreur lors de la récupération des branches distantes.");
    process.exit(1);
  }
}

function sanitizeBranchName(branchName) {
  const parts = branchName.split("/");
  return parts.length > 1 ? parts.slice(1).join("/") : branchName;
}

function createWorktree(branchName, sanitizedName, baseBranch) {
  const worktreePath = path.join(process.cwd(), sanitizedName);
  console.log(
    `Création d'un nouveau worktree pour la branche '${branchName}'...`,
  );
  execSync(
    `git worktree add -b ${branchName} "${sanitizedName}" ${baseBranch}`,
    {
      stdio: "inherit",
    },
  );
  console.log(`Worktree créé : ${worktreePath}`);
}

function createExistingWorktree(branchName) {
  const sanitizedName = sanitizeBranchName(branchName);
  const worktreePath = path.join(process.cwd(), sanitizedName);
  console.log(
    `Création d'un nouveau worktree pour la branche '${branchName}'...`,
  );
  execSync(`git worktree add "${worktreePath}" "${branchName}"`, {
    stdio: "inherit",
  });
  console.log(`Worktree créé : ${worktreePath}`);
}

async function promptBranchSelection(branches) {
  const response = await inquirer.prompt({
    type: "autocomplete",
    name: "selectedBranch",
    pageSize: 20,
    message:
      "Recherchez une branche ou appuyez sur Entrée pour en créer une nouvelle :",
    source: async (input) => {
      input = input || "";
      return branches
        .map((branch) => ({ value: branch }))
        .filter((branch) =>
          branch.value.toLowerCase().includes(input.toLowerCase()),
        );
    },
  });
  return response.selectedBranch;
}

async function promptNewBranchName(branches) {
  const { newBranchName } = await inquirer.prompt({
    type: "input",
    name: "newBranchName",
    message: "Entrez le nom de la nouvelle branche :",
    validate: (input) => {
      if (!input.trim()) return "Le nom de la branche ne peut pas être vide.";
      if (branches.includes(`origin/${input.trim()}`)) {
        return "Cette branche existe déjà. Veuillez choisir un autre nom.";
      }
      return true;
    },
  });
  return newBranchName;
}

(async () => {
  const branches = [newBranchOption, ...fetchBranches()];
  let selectedBranch = cliBranchName || (await promptBranchSelection(branches));

  if (
    !branches.includes(`origin/${selectedBranch}`) &&
    selectedBranch !== newBranchOption
  ) {
    const { confirmCreation } = await inquirer.prompt({
      type: "confirm",
      name: "confirmCreation",
      message: `La branche '${selectedBranch}' n'existe pas. Voulez-vous la créer ?`,
      default: true,
    });

    if (!confirmCreation) {
      console.log("Création de la branche annulée.");
      process.exit(0);
    }

    const sanitizedBranchName = sanitizeBranchName(selectedBranch);
    createWorktree(selectedBranch, sanitizedBranchName, baseBranch);
  } else if (selectedBranch === newBranchOption) {
    const newBranchName = await promptNewBranchName(branches);
    const sanitizedBranchName = sanitizeBranchName(newBranchName);
    createWorktree(newBranchName, sanitizedBranchName, baseBranch);
  } else {
    const branchName = selectedBranch.replace("origin/", "");
    createExistingWorktree(branchName);
  }
})();

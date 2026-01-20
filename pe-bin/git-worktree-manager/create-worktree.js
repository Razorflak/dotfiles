#!/usr/bin/env node

import { execSync } from "child_process";
import inquirer from "inquirer";
import autocomplete from "inquirer-autocomplete-standalone";
import path from "path";
import "./utils/exit.js";
import { getDefaultBranch } from "./utils/get-main-branch.js";
import { isWorktreeRepo } from "./utils/check-is-worktree-repo.js";

isWorktreeRepo();

// Enregistrer le type de question "autocomplete" pour inquirer
inquirer.registerPrompt("autocomplete", autocomplete);

const baseBranch = getDefaultBranch();
const newBranchOption = "__New_Branch__";

// Récupérer les arguments de la ligne de commande
const cliBranchName = process.argv[2];

// Effectuer un fetch all
console.log("Fetching all branches...");
execSync("git fetch --all", { stdio: "inherit" });

// Récupérer la liste des branches distantes
let branches = [];
try {
  branches = execSync("git branch -r", { encoding: "utf8" })
    .split("\n")
    .map((branch) => branch.trim())
    .filter((branch) => branch && !branch.startsWith("origin/HEAD"));
} catch (error) {
  console.error("Erreur lors de la récupération des branches distantes.");
  process.exit(1);
}

// Ajouter une option pour créer une nouvelle branche
branches.unshift(newBranchOption);

(async () => {
  let selectedBranch = cliBranchName;

  if (!selectedBranch) {
    // Si aucun argument n'est passé, demander à l'utilisateur de choisir une branche
    const response = await inquirer.prompt({
      type: "autocomplete",
      name: "selectedBranch",
      pageSize: 20,
      message:
        "Recherchez une branche ou appuyez sur Entrée pour en créer une nouvelle :",
      source: async (input) => {
        // Filtrer les branches en fonction de l'entrée utilisateur
        input = input || "";
        return branches
          .map((branch) => ({ value: branch }))
          .filter((branch) =>
            branch.value.toLowerCase().includes(input.toLowerCase()),
          );
      },
    });

    selectedBranch = response.selectedBranch;
  }

  if (
    !branches.includes(`origin/${selectedBranch}`) &&
    selectedBranch !== newBranchOption
  ) {
    // Demander confirmation avant de créer une nouvelle branche
    const confirmResponse = await inquirer.prompt({
      type: "confirm",
      name: "confirmCreation",
      message: `La branche '${selectedBranch}' n'existe pas. Voulez-vous la créer ?`,
      default: true,
    });

    if (!confirmResponse.confirmCreation) {
      console.log("Création de la branche annulée.");
      process.exit(0);
    }

    const newBranchName = selectedBranch;
    const branchParts = newBranchName.split("/");
    const sanitizedBranchName =
      branchParts.length > 1 ? branchParts.slice(1).join("/") : newBranchName;
    const worktreePath = path.join(process.cwd(), newBranchName);
    console.log(
      `Création d'un nouveau worktree pour la branche '${newBranchName}'...`,
    );
    execSync(
      `git worktree add -b ${newBranchName} "${sanitizedBranchName}" ${baseBranch}`,
      {
        stdio: "inherit",
      },
    );
    console.log(`Worktree créé : ${worktreePath}`);
  } else if (selectedBranch === newBranchOption) {
    // Gérer le cas où l'utilisateur choisit de créer une nouvelle branche

    const { newBranchName } = await inquirer.prompt({
      type: "input",
      name: "newBranchName",
      message: "Entrez le nom de la nouvelle branche :",
      validate: (input) => {
        if (!input.trim()) {
          return "Le nom de la branche ne peut pas être vide.";
        }
        if (branches.includes(`origin/${input.trim()}`)) {
          return "Cette branche existe déjà. Veuillez choisir un autre nom.";
        }
        return true;
      },
    });

    const branchParts = newBranchName.split("/");
    const sanitizedBranchName =
      branchParts.length > 1 ? branchParts.slice(1).join("/") : newBranchName;
    const worktreePath = path.join(process.cwd(), newBranchName);
    execSync(
      `git worktree add -b ${newBranchName} "${sanitizedBranchName}" ${baseBranch}`,
      {
        stdio: "inherit",
      },
    );
    console.log(`Worktree créé : ${worktreePath}`);
  } else {
    // Créer un worktree pour une branche existante
    const branchName = selectedBranch.replace("origin/", "");
    const worktreePath = path.join(process.cwd(), branchName);
    console.log(
      `Création d'un nouveau worktree pour la branche '${branchName}'...`,
    );
    execSync(`git worktree add "${worktreePath}" "${branchName}"`, {
      stdio: "inherit",
    });
    console.log(`Worktree créé : ${worktreePath}`);
  }
})();

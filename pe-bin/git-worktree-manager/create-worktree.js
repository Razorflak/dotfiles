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

	const selectedBranch = response.selectedBranch;

	if (
		selectedBranch === newBranchOption ||
		!branches.includes(selectedBranch)
	) {
		// Créer une nouvelle branche
		const newBranchResponse = await inquirer.prompt({
			type: "input",
			name: "newBranchName",
			message: "Entrez le nom de la nouvelle branche :",
		});

		const newBranchName = newBranchResponse.newBranchName.trim();
		if (!newBranchName) {
			console.error("Le nom de la branche ne peut pas être vide.");
			process.exit(1);
		}

		const worktreePath = path.join(process.cwd(), newBranchName);
		console.log(
			`Création d'un nouveau worktree pour la branche '${newBranchName}'...`,
		);
		execSync(
			`git worktree add -b ${newBranchName} "${worktreePath}" ${baseBranch}`,
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

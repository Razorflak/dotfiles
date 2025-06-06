
#!/bin/bash

# Liste des paquets Homebrew à installer
BREW_PACKAGES=(
    "zoxide"
    "fzf"
    "hashicorp/tap/terraform"
    "hello"
    "jesseduffield/lazydocker/lazydocker"
    "lsd"
    "jq"
    "lazygit"
    "libvterm"
    "msgpack"
    "neovim"
    "node@20"
    "postgresql@14"
    "python@3.12"
    "ripgrep"
    "stow"
    "tmux"
)

# Vérification et installation des paquets
for package in "${BREW_PACKAGES[@]}"; do
    if ! brew leaves | grep -q "^$package\$"; then
        echo "Le paquet '$package' n'est pas installé. Installation en cours..."
        brew install "$package"
    else
        echo "Le paquet '$package' est déjà installé."
    fi
done

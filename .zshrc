
typeset -g POWERLEVEL9K_INSTANT_PROMPT=quiet
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi
# Path to your oh-my-zsh installation.
export ZSH="$HOME/.oh-my-zsh"





ZSH_THEME="powerlevel10k/powerlevel10k"
plugins=(git fzf-tab)

source $ZSH/oh-my-zsh.sh


#Exécution de tous les fichier .zsh dans pec (Commum à tous les env)
PEC_CONFIG_DIR="$HOME/pec"
if [ -d "$PEC_CONFIG_DIR" ]; then
    for file in "$PEC_CONFIG_DIR"/*.zsh; do
        if [ -f "$file" ] && [ -r "$file" ]; then
            source "$file"
        fi
    done
fi


#Exécution de tous les fichier .zsh dans pec (Spécifique à un env)
PEC_SPECIFIC_DIR="$HOME/pec/specific"
if [ -d "$PEC_SPECIFIC_DIR" ]; then
    for file in "$PEC_SPECIFIC_DIR"/*.zsh; do
        if [ -f "$file" ] && [ -r "$file" ]; then
            source "$file"
        fi
    done
fi

## Donner les droit d'exécution sur mon fichier d'init
chmod +x $HOME/init_env.sh


source <(fzf --zsh)
source $(brew --prefix)/share/zsh-autosuggestions/zsh-autosuggestions.zsh
eval "$(zoxide init zsh)"

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

autoload -U +X bashcompinit && bashcompinit

alias ls='lsd'
alias l='ls -la'
alias la='ls -a'
alias lla='ls -la'
alias lt='ls --tree'

alias vim='nvim'
alias v='nvim .'
alias lvim="nvim -u ~/.config/nvim/init_light.lua"

aws_deploy() {
    local DESTENV=${1:-jta}
    local DEPLOY_COMMAND=${2:-deploy}

    pnpm "${DEPLOY_COMMAND}:cdk" DESTENV=$DESTENV
}


# Obsidian
alias oo='cd ~/Google\ Drive/Mon\ Drive/Obsidian-vault/work && nvim welcome.md'
alias or='vim ~/Google\ Drive/Mon\ Drive/Obsidian-vault/work/inbox/*.md'
# dispo bin: "on" pour nouvelle note et "og" pour déplacer les note tomove vers leur hub


# Activer la complétion avancée pour fzf-tab
zstyle ':completion:*' menu select
zstyle ':completion:*:descriptions' format '[%d]'
zstyle ':completion:*:messages' format '%d'
zstyle ':completion:*:options' prefix-needed yes
zstyle ':completion:*:default' list-prompt '%S%p%s'
zstyle ':fzf-tab:*' switch-group ','

# Important pour que fzf-tab prenne le dessus sur la complétion par défaut
zstyle ':completion:*' completer _complete _ignored _approximate


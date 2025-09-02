#!/bin/bash

# Create all missing directories from ti4-complete-project-structure.md
# Each directory will have a .gitkeep file to maintain in git

echo "Creating complete TI4 project structure..."

# .github directories
mkdir -p .github/workflows
mkdir -p .github/ISSUE_TEMPLATE

# Client directories - public assets
mkdir -p client/public/assets/factions/base/{arborec,barony,saar,embers,hacan,jolnar,l1z1x,letnev,mentak,muaat,naalu,nekro,nomad,sardakk,sol,winnu,xxcha,yin}
mkdir -p client/public/assets/factions/pok/{argent,empyrean,mahact,naazrokha,nomad,titans,vuilio}
mkdir -p client/public/assets/cards/{action,agenda,exploration/{cultural,hazardous,industrial},objective,promissory,relic,secret,strategy}
mkdir -p client/public/assets/leaders/{agents,commanders,heroes}
mkdir -p client/public/assets/tokens/{command,control,frontier,trade_goods,commodities}
mkdir -p client/public/assets/units/{ships,ground,structures,mechs}
mkdir -p client/public/assets/{planets,systems,tiles,icons}
mkdir -p client/public/models/ships/{flagship}
mkdir -p client/public/models/{structures,ground/mech,board/{hex_tile,planet_tile,anomaly},effects/{explosions,wormholes}}
mkdir -p client/public/{fonts,sounds/{effects,music,voice,ambient},locales}

# Client source - game engine
mkdir -p client/src/game/{engine,phases,actions,validation,combat,movement,exploration,leaders,mechs,factions/{abilities/{base,pok},starting,technologies}}
mkdir -p client/src/game/{objectives,politics,trade,relics,boardgame-io}

# Client source - components
mkdir -p client/src/components/{board,units,lobby,map,player,ui,communication,cards,combat,trade,politics}
mkdir -p client/src/components/{companion,spectator,tutorial,tournament,admin,shared}

# Client source - Three.js
mkdir -p client/src/three/{scene,geometry,animations,materials,loaders,performance,effects}

# Client source - hooks
mkdir -p client/src/hooks/{game,ui,features,utils}

# Client source - services
mkdir -p client/src/services/{api,websocket,webrtc,storage,audio,notifications,analytics}

# Client source - store
mkdir -p client/src/store/{slices,middleware}

# Client source - types
mkdir -p client/src/types/{game,api}

# Client source - utils
mkdir -p client/src/utils/{gameLogic,math,validation,helpers,accessibility,localization,performance}

# Client source - other
mkdir -p client/src/{workers,styles/{themes/faction,components,accessibility}}

# Client tests
mkdir -p client/tests/{unit/{engine,validation,combat,components},integration/{phases,actions,multiplayer}}
mkdir -p client/tests/{e2e/{gameplay,lobby,tournament},visual/snapshots,performance,accessibility}

# Client Storybook
mkdir -p client/.storybook/stories

# Client Cypress
mkdir -p client/cypress/{e2e,fixtures,support}

# Server directories - source
mkdir -p server/src/{game,api/{routes,middleware,controllers},lobby,tournament,webrtc,chat}
mkdir -p server/src/{db/{migrations,repositories},services,admin,ai,jobs/{workers,schedulers},utils}

# Server tests
mkdir -p server/tests/{unit,integration,load}

# Shared directories
mkdir -p shared/{types,constants,utils}

# Scripts
mkdir -p scripts/{extraction,generation,deployment,setup,maintenance}

# Documentation
mkdir -p docs/{architecture,api,game-rules,development,extraction,deployment,user-guide}

# Docker
mkdir -p docker/{client,server,nginx/{ssl,sites,security},redis,postgres}

# Nginx
mkdir -p nginx/{ssl,sites,security}

# Monitoring
mkdir -p monitoring/{grafana/dashboards,prometheus}

# VSCode
mkdir -p .vscode

# Husky
mkdir -p .husky

# Config
mkdir -p config

# Now create .gitkeep files in all empty directories
echo "Adding .gitkeep files to maintain directory structure..."

# Function to add .gitkeep to empty directories
add_gitkeep() {
    find "$1" -type d -empty -exec touch {}/.gitkeep \;
}

# Add .gitkeep files to all major sections
add_gitkeep ".github"
add_gitkeep "client/public"
add_gitkeep "client/src"
add_gitkeep "client/tests"
add_gitkeep "client/.storybook"
add_gitkeep "client/cypress"
add_gitkeep "server/src"
add_gitkeep "server/tests"
add_gitkeep "shared"
add_gitkeep "scripts"
add_gitkeep "docs"
add_gitkeep "docker"
add_gitkeep "nginx"
add_gitkeep "monitoring"
add_gitkeep ".vscode"
add_gitkeep ".husky"
add_gitkeep "config"

echo "Project structure created successfully!"
echo "Total directories created: $(find . -type d -name '.git' -prune -o -type d -print | wc -l)"
echo "Total .gitkeep files added: $(find . -name '.gitkeep' | wc -l)"
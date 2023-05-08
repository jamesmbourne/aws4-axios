# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.231.2/containers/typescript-node/.devcontainer/base.Dockerfile

# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 16, 14, 12, 16-bullseye, 14-bullseye, 12-bullseye, 16-buster, 14-buster, 12-buster
ARG VARIANT="18-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0-${VARIANT}

# [Optional] Uncomment this section to install additional OS packages.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# Ensure the latest NPM version is installed regardless to which Node version we are running.
RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install-latest-npm"

RUN npm install -g aws-cdk

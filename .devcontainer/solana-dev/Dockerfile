FROM rust:1.84-slim

ENV DEBIAN_FRONTEND=noninteractive
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=${USER_UID}

# ===== 基础依赖 =====
RUN set -eux; \
    for attempt in 1 2 3 4 5; do \
        apt-get -o Acquire::Retries=5 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 update && \
        apt-get -o Acquire::Retries=5 -o Acquire::http::Timeout=30 -o Acquire::https::Timeout=30 install -y --no-install-recommends \
            bash \
            ca-certificates \
            curl \
            git \
            sudo \
            zsh \
            build-essential \
            pkg-config \
            libssl-dev \
            libclang-dev \
            gnupg \
            clang \
            cmake \
            llvm \
            libudev-dev \
            protobuf-compiler \
            unzip \
            python3 \
            python3-pip \
            jq && break; \
        if [ "$attempt" -eq 5 ]; then exit 1; fi; \
        rm -rf /var/lib/apt/lists/*; \
        sleep $((attempt * 5)); \
    done; \
    rm -rf /var/lib/apt/lists/*

# ===== 创建非 root 用户 =====
RUN set -eux; \
    if ! getent group "${USER_GID}" >/dev/null; then groupadd --gid "${USER_GID}" "${USERNAME}"; fi; \
    if ! id -u "${USERNAME}" >/dev/null 2>&1; then useradd --uid "${USER_UID}" --gid "${USER_GID}" -m -s /usr/bin/zsh "${USERNAME}"; fi; \
    echo "${USERNAME} ALL=(root) NOPASSWD:ALL" >/etc/sudoers.d/${USERNAME}; \
    chmod 0440 /etc/sudoers.d/${USERNAME}; \
    chown -R "${USERNAME}:${USERNAME}" /usr/local/cargo /usr/local/rustup

# ===== 安装 Node 18 =====
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get -o Acquire::Retries=5 install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# ===== 安装 Solana CLI =====
ENV SOLANA_VERSION=1.18.17
RUN set -eux; \
    case "$(uname -m)" in \
        x86_64) solana_arch="x86_64" ;; \
        aarch64|arm64) solana_arch="aarch64" ;; \
        *) echo "Unsupported architecture: $(uname -m)"; exit 1 ;; \
    esac; \
    if [ "${solana_arch}" = "x86_64" ]; then \
        solana_tarball_url="https://github.com/solana-labs/solana/releases/download/v${SOLANA_VERSION}/solana-release-${solana_arch}-unknown-linux-gnu.tar.bz2"; \
        curl --retry 10 --retry-all-errors --retry-delay 3 -fsSL "${solana_tarball_url}" -o /tmp/solana.tar.bz2; \
        mkdir -p /tmp/solana-extract; \
        tar -xjf /tmp/solana.tar.bz2 -C /tmp/solana-extract; \
        solana_release_dir="$(find /tmp/solana-extract -type d -name solana-release -print -quit)"; \
        test -n "${solana_release_dir}"; \
        install -d /usr/local/solana; \
        cp -a "${solana_release_dir}/." /usr/local/solana/; \
        rm -rf /tmp/solana.tar.bz2 /tmp/solana-extract; \
    else \
        cargo install --locked solana-cli --version ${SOLANA_VERSION}; \
        cargo install --locked solana-keygen --version ${SOLANA_VERSION}; \
        install -d /usr/local/solana/bin; \
        cp -a /usr/local/cargo/bin/solana /usr/local/solana/bin/; \
        cp -a /usr/local/cargo/bin/solana-keygen /usr/local/solana/bin/; \
        if [ -x /usr/local/cargo/bin/solana-test-validator ]; then \
            cp -a /usr/local/cargo/bin/solana-test-validator /usr/local/solana/bin/; \
        else \
            printf '%s\n' '#!/usr/bin/env bash' 'echo "solana-test-validator is unavailable in this arm64 build." >&2' 'echo "Use solana CLI + keygen, or switch to x86_64 image for test-validator binary." >&2' 'exit 1' >/usr/local/solana/bin/solana-test-validator; \
            chmod +x /usr/local/solana/bin/solana-test-validator; \
        fi; \
    fi

ENV PATH="/usr/local/solana/bin:${PATH}"

# ===== Rust 工具链 =====
RUN rustup component add clippy rustfmt

# ===== 安装 Anchor（arm64 下避免 avm 二进制 404）=====
ENV ANCHOR_CLI_VERSION=0.30.1
ENV ANCHOR_BUILD_TOOLCHAIN=1.79.0
RUN rustup toolchain install ${ANCHOR_BUILD_TOOLCHAIN} --profile minimal \
    && cargo +${ANCHOR_BUILD_TOOLCHAIN} install --locked anchor-cli --version ${ANCHOR_CLI_VERSION}

# ===== 安装 create-solana-dapp =====
RUN npm install -g create-solana-dapp

# ===== 包管理器（web3.js / Anchor TS 测试常用）=====
RUN npm install -g yarn pnpm

# ===== 安装 cargo-audit（安全审计）=====
RUN cargo install cargo-audit --version 0.21.2 --locked

# ===== 设置工作目录 =====
WORKDIR /workspace

CMD ["bash"]

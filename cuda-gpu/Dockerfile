FROM nvidia/cuda:10.1-base-ubuntu18.04

# install build tools
RUN apt-get update -y && apt-get install -y \
    curl \
    git \
    cmake \
    gcc \
 && rm -rf /var/lib/apt/lists/*

# install argon2-gpu
RUN git clone --recurse-submodulese https://gitlab.com/omos/argon2-gpu.git && \
    cmake install -DCMAKE_BUILD_TYPE=Release argon2-gpu && \
    rm -rf argon2-gpu
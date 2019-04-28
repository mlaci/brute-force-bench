FROM nvidia/cuda:10.1-base-ubuntu16.04

# install build tools
RUN apt-get update -y && apt-get install -y \
    curl \
    git \
    cmake \
    gcc \
 && rm -rf /var/lib/apt/lists/*

# install argon2-gpu
RUN git clone --recursive https://gitlab.com/omos/argon2-gpu.git && \
    cmake -DCMAKE_BUILD_TYPE=Release argon2-gpu install && \
    rm -rf argon2-gpu
FROM nvidia/cuda:10.0-base-ubuntu18.04

# install build tools
RUN apt-get update -y && apt-get install -y \
    curl \
    unzip \
    ocl-icd-libopencl1 \
 && rm -rf /var/lib/apt/lists/*

# install argon2-gpu
RUN curl -L https://gitlab.com/omos/argon2-gpu/-/jobs/artifacts/master/download?job=build-gcc-cuda -o build.zip && \
    unzip build.zip && \
    cd build/gcc-cuda && \
    install ./*.so ext/argon2/libargon2.so.1 /usr/lib && \
    install argon2-gpu-bench /usr/local/bin && \
    cd ../.. && \
    rm -rf build build.zip

# install nodejs
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

COPY bench.js /
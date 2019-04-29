FROM nvidia/cuda:10.1-base-ubuntu18.04

# install build tools
RUN apt-get update -y && apt-get install -y \
    curl \
    unzip \
    ocl-icd-libopencl1 && \
 && rm -rf /var/lib/apt/lists/*

# install argon2-gpu
RUN curl -L https://gitlab.com/omos/argon2-gpu/-/jobs/artifacts/master/download?job=build-gcc-cuda -o build.zip && \
    unzip build.zip && \
    cd build/gcc-cuda && \
    install ./*.so ext/argon2/libargon2.so.1 /usr/lib && \
    install argon2-gpu-bench /usr/local/bin && \
    cd ../.. && \
    rm -rf build build.zip
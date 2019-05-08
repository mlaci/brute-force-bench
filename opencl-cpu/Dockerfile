FROM ubuntu:18.04

# install build tools
RUN apt-get update -y && apt-get install -y \
    curl \
    git \
    make \
    unzip \
    libnuma1 \
    lsb-core \
 && rm -rf /var/lib/apt/lists/*

# install opencl cpu driver
RUN mkdir opencl && \
    cd opencl && \
    curl -L http://registrationcenter-download.intel.com/akdlm/irc_nas/vcp/15365/l_opencl_p_18.1.0.014.tgz | \
    tar -xz --strip=1 && \
    sed -i 's/decline/accept/' silent.cfg && \
    ./install.sh -s silent.cfg && \
    cd .. && \
    rm -rf opencl

# install argon2-gpu
RUN curl -L https://gitlab.com/omos/argon2-gpu/-/jobs/artifacts/master/download?job=build-gcc-nocuda -o build.zip && \
    unzip build.zip && \
    cd build/gcc-nocuda && \
    install ./*.so ext/argon2/libargon2.so.1 /usr/lib && \
    install argon2-gpu-bench /usr/local/bin && \
    cd ../.. && \
    rm -rf build build.zip

# install nodejs
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

# install hashcat
RUN git clone https://github.com/hashcat/hashcat.git && \
    sed -i 's/format_speed_display (hashes_msec_dev \* 1000, display, HCBUFSIZ_TINY);/snprintf (display, HCBUFSIZ_TINY, "%.5f ", hashes_msec_dev * 1000);/' hashcat/src/status.c && \
    make -C hashcat install && \
    rm -rf hashcat

ENV BRUTE_FORCE_BENCH "opencl-cpu"
COPY /script /script
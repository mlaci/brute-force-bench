FROM ubuntu:16.04

# install build tools
RUN apt-get update -y && apt-get install -y \
    curl \
    git \
    make \
    gcc \
    cpio \
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

# install argon2
RUN git clone https://github.com/P-H-C/phc-winner-argon2.git argon2 && \
    make -C argon2 install && \
    rm -rf argon2

# install hashcat
RUN git clone https://github.com/hashcat/hashcat.git && \
    make -C hashcat install && \
    rm -rf hashcat
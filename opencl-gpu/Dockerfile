FROM nvidia/opencl:runtime-ubuntu16.04

# install build tools
RUN apt-get update -y && apt-get install -y \
    curl \
    git \
    make \
    gcc \
 && rm -rf /var/lib/apt/lists/*

# install hashcat
RUN git clone https://github.com/hashcat/hashcat.git && \
    make -C hashcat install && \
    rm -rf hashcat
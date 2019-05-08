FROM nvidia/opencl:runtime-ubuntu18.04

# install build tools
RUN apt-get update -y && apt-get install -y \
    curl \
    git \
    make \
    gcc \
 && rm -rf /var/lib/apt/lists/*

# install nodejs
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

# install hashcat
RUN git clone https://github.com/hashcat/hashcat.git && \
    sed -i 's/format_speed_display (hashes_msec_dev \* 1000, display, HCBUFSIZ_TINY);/snprintf (display, HCBUFSIZ_TINY, "%.5f ", hashes_msec_dev * 1000);/' hashcat/src/status.c && \
    make -C hashcat install && \
    rm -rf hashcat

ENV BRUTE_FORCE_BENCH "opencl-gpu"
COPY /script /script